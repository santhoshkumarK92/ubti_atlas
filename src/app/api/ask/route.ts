import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { aiEnabled, chat, embed } from '@/lib/ai';
import { getUser } from '@/lib/auth';
import { getIndustries, getVisibleProjects } from '@/lib/repo';
import { getStore } from '@/lib/store';
import { detectIndustry, scoreProject } from '@/lib/intel';
import { mdToPlain, truncate } from '@/lib/utils';

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 3600_000) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > 40;
}

/** "Ask the Portfolio" — retrieval over published projects + a grounded answer. */
export async function POST(req: Request) {
  const { question, history = [] } = (await req.json()) as { question: string; history?: { role: 'user' | 'assistant'; content: string }[] };
  if (!question?.trim()) return NextResponse.json({ error: 'Ask a question' }, { status: 400 });
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (limited(ip)) return NextResponse.json({ error: 'Too many questions — try again in a while.' }, { status: 429 });

  const signedIn = !!(await getUser());
  const [visible, industries] = await Promise.all([getVisibleProjects(signedIn), getIndustries()]);
  const allowed = new Map(visible.map((p) => [p.id, p]));

  // 1) retrieve
  const industryId = detectIndustry(question, industries) || undefined;
  let matches = visible
    .map((p) => ({ p, ...scoreProject(p, { text: question, industryId }) }))
    .filter((x) => x.reasons.length > 0)
    .map((x) => ({ p: x.p, s: x.score }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.p);

  if (aiEnabled) {
    try {
      const [vec] = await embed([question]);
      const store = await getStore();
      const near = await store.nearest('projects', 'embedding', vec!, 12);
      const semantic = near.map((n) => allowed.get(n.id)).filter(Boolean) as typeof visible;
      if (semantic.length) matches = [...semantic.slice(0, 6), ...matches.filter((m) => !semantic.some((s) => s.id === m.id))].slice(0, 6);
    } catch (e) {
      console.warn('[atlas] semantic search failed', (e as Error).message);
    }
  }

  const cards = matches.map((p) => ({
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    industry: industries.find((i) => i.id === p.industryId)?.shortName ?? '',
  }));

  if (!aiEnabled) {
    return NextResponse.json({
      answer: matches.length
        ? `Here are the closest matches in the portfolio for “${truncate(question, 80)}”.`
        : 'I could not find a matching project. Try different words — for example the system (SAP, Salesforce), the document type (invoice, contract) or the industry.',
      projects: cards,
    });
  }

  const context = matches
    .map((p) => `[${p.slug}] ${p.title} (${industries.find((i) => i.id === p.industryId)?.shortName}; ${p.maturity})\n${p.tagline}\nSolution: ${truncate(mdToPlain(p.solution), 500)}\nTech: ${p.techStack.join(', ')}`)
    .join('\n\n');
  try {
    const answer = await chat(
      [
        {
          role: 'system',
          content:
            "You are the assistant for UBTI AI Atlas, the AI team's portfolio. Answer ONLY from the projects in the context. Mention projects by title and put their slug in square brackets like [freight-document-ai]. If nothing fits, say so honestly and suggest what to search for. Be concise (max 120 words). Never invent clients or numbers.",
        },
        ...history.slice(-6),
        { role: 'user', content: `Context projects:\n${context || '(none found)'}\n\nQuestion: ${question}` },
      ],
      { maxTokens: 400, temperature: 0.2 },
    );
    return NextResponse.json({ answer, projects: cards });
  } catch (e) {
    return NextResponse.json({ answer: `AI is unavailable right now (${(e as Error).message.slice(0, 80)}). Closest matches:`, projects: cards });
  }
}
