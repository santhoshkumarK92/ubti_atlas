import 'server-only';
import { aiEnabled, config } from './config';

/**
 * Thin REST client for Azure OpenAI or OpenAI (no SDK lock-in).
 * Everything degrades gracefully: callers check `aiEnabled` and fall back to heuristics.
 */

export { aiEnabled };

type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Part[];
}

function endpoint(kind: 'chat' | 'embed') {
  if (config.ai.provider === 'azure') {
    const a = config.ai.azure;
    const dep = kind === 'chat' ? a.chat : a.embedding;
    const pathPart = kind === 'chat' ? 'chat/completions' : 'embeddings';
    return {
      url: `${a.endpoint}/openai/deployments/${encodeURIComponent(dep)}/${pathPart}?api-version=${a.apiVersion}`,
      headers: { 'api-key': a.apiKey, 'Content-Type': 'application/json' } as Record<string, string>,
      model: undefined as string | undefined,
    };
  }
  const o = config.ai.openai;
  return {
    url: `https://api.openai.com/v1/${kind === 'chat' ? 'chat/completions' : 'embeddings'}`,
    headers: { Authorization: `Bearer ${o.apiKey}`, 'Content-Type': 'application/json' } as Record<string, string>,
    model: kind === 'chat' ? o.model : o.embedding,
  };
}

async function post<T>(kind: 'chat' | 'embed', body: Record<string, unknown>, timeoutMs = 90000): Promise<T> {
  if (!aiEnabled) throw new Error('AI is not configured. Set AI_PROVIDER and keys in .env.local');
  const ep = endpoint(kind);
  const res = await fetch(ep.url, {
    method: 'POST',
    headers: ep.headers,
    body: JSON.stringify(ep.model ? { model: ep.model, ...body } : body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export async function chat(messages: ChatMessage[], opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}) {
  const r = await post<{ choices: { message: { content: string } }[] }>('chat', {
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1800,
    ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
  });
  return r.choices[0]?.message?.content ?? '';
}

export async function chatJSON<T>(system: string, user: string | Part[], maxTokens = 2500): Promise<T> {
  const out = await chat(
    [
      { role: 'system', content: system + '\nRespond with a single valid JSON object only.' },
      { role: 'user', content: user },
    ],
    { json: true, maxTokens },
  );
  try {
    return JSON.parse(out) as T;
  } catch {
    const m = out.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error('AI returned invalid JSON');
  }
}

export async function embed(texts: string[]): Promise<number[][]> {
  const r = await post<{ data: { embedding: number[]; index: number }[] }>('embed', {
    input: texts.map((t) => t.slice(0, 24000)),
    dimensions: config.ai.dimensions,
  });
  return r.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

export const imagePart = (dataUrl: string): Part => ({ type: 'image_url', image_url: { url: dataUrl, detail: 'high' } });
export const textPart = (text: string): Part => ({ type: 'text', text });
