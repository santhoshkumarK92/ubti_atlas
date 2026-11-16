import 'server-only';
import { aiEnabled, chatJSON, imagePart, textPart } from './ai';
import type { FlowStep, Industry, Metric, Platform, SlideExtract } from './types';
import type { PublicProject } from './repo';
import { mdToPlain, truncate } from './utils';

// ─── Keyword knowledge (used without AI and to validate AI output) ───────────
export const KNOWN_TECH = [
  'Azure OpenAI', 'Azure AI Foundry', 'Azure AI Search', 'Azure AI Document Intelligence', 'Azure AI Speech', 'Azure OpenAI Realtime',
  'Voice Live API', 'Azure Machine Learning', 'Azure Functions', 'Logic Apps', 'Azure Data Factory', 'Azure App Service', 'Azure Container Apps',
  'Azure Kubernetes Service', 'Azure Health Data Services', 'Azure Communication Services', 'Azure Bot Service', 'Microsoft Fabric',
  'Fabric Real-Time Intelligence', 'Fabric Data Agent', 'Power BI', 'Power Automate', 'Power Apps', 'Copilot Studio', 'Microsoft Graph',
  'Semantic Kernel', 'AutoGen', 'LangChain', 'LangGraph', 'LlamaIndex', 'MCP', 'n8n', 'Python', 'PySpark', 'FastAPI', 'Flask', 'Streamlit',
  'React', 'Next.js', 'TypeScript', 'Node.js', '.NET', 'Docker', 'GPT-4o', 'GPT-4.1', 'GPT-5', 'Whisper', 'Firebase', 'Pinecone', 'pgvector',
  'Hugging Face', 'Tesseract', 'Twilio', 'WhatsApp Business API', 'UiPath', 'Databricks', 'Snowflake',
];

const words = (s: string) => s.toLowerCase();
const STOP = new Set(['anything','something','have','with','that','which','what','show','does','there','about','agent','agents','project','projects','work','works','used','using','into','from','them','they','this','need','want','looking','would','could','should','where','when','some','also','more','like','pitch','client','clients','top','our','any','all','for','the','and','can','get','you','who','how','why','has','did','built','build']);

export function detectTech(text: string) {
  const t = words(text);
  return KNOWN_TECH.filter((k) => t.includes(k.toLowerCase()));
}

export function detectPlatforms(text: string, platforms: Platform[]) {
  const t = words(text);
  return platforms
    .filter((p) => {
      const names = [p.name, p.name.replace(/^Dynamics 365 /, 'D365 ')].map(words);
      return names.some((n) => n.length > 3 && t.includes(n));
    })
    .map((p) => p.id);
}

export function detectIndustry(text: string, industries: Industry[]) {
  const t = words(text);
  const hints: Record<string, string[]> = {
    'real-estate': ['lease', 'tenant', 'property', 'spa ', 'real estate', 'broker'],
    construction: ['construction', 'site', 'rfi', 'contractor', 'mep', 'drawing'],
    manufacturing: ['manufactur', 'factory', 'production line', 'plant', 'vendor'],
    logistics: ['shipment', 'freight', 'logistic', 'cargo', 'container', 'warehouse', 'bill of lading'],
    healthcare: ['patient', 'hospital', 'clinic', 'ehr', 'fhir'],
    'financial-services': ['bank', 'loan', 'credit', '10-k', 'finance', 'audit', 'invoice'],
    insurance: ['insur', 'claim', 'policy', 'actuar', 'underwrit', 'premium'],
    retail: ['retail', 'store', 'shopify', 'e-commerce', 'pos ', 'sku'],
    energy: ['oil', 'gas', 'refinery', 'turnaround', 'upstream', 'drilling'],
    government: ['government', 'citizen', 'ministry', 'municipal', 'public sector'],
    agriculture: ['farm', 'crop', 'agri', 'food processing'],
    automotive: ['automotive', 'vehicle', 'car ', 'warranty', 'dealer'],
    travel: ['hotel', 'guest', 'travel', 'tourism', 'booking'],
    aerospace: ['aircraft', 'aviation', 'flight', 'mro', 'aerospace'],
    education: ['student', 'university', 'school', 'campus', 'faculty'],
  };
  let best = '', score = 0;
  for (const ind of industries) {
    const s = (hints[ind.id] ?? [ind.shortName.toLowerCase()]).reduce((n, h) => n + (t.split(h).length - 1), 0);
    if (s > score) { score = s; best = ind.id; }
  }
  return best;
}

export interface Draft {
  title: string;
  tagline: string;
  industryId: string;
  extraIndustryIds: string[];
  clientName: string;
  problem: string;
  solution: string;
  impact: string;
  metrics: Metric[];
  features: string[];
  techStack: string[];
  platformIds: string[];
  flow: FlowStep[];
  flowDescription: string;
  suggestions: string[];
  usedAI: boolean;
}

const slidesText = (slides: SlideExtract[]) =>
  slides
    .map((s) => `### Slide ${s.index}: ${s.title}\n${s.text}${s.notes ? `\n[Speaker notes] ${s.notes}` : ''}`)
    .join('\n\n')
    .slice(0, 28000);

function heuristicDraft(slides: SlideExtract[], industries: Industry[], platforms: Platform[]): Draft {
  const all = slidesText(slides);
  const titles = new Set(slides.map((s) => s.title.trim().toLowerCase()));
  const body = (s: SlideExtract) => s.text.split('\n').map((l) => l.trim()).filter((l) => l && !titles.has(l.toLowerCase()));
  const section = (re: RegExp) => slides.filter((s) => re.test(s.title));
  const take = (re: RegExp) => section(re).flatMap((s) => [...body(s), ...(s.notes ? [s.notes] : [])]).join('\n');
  const problem = take(/problem|challenge|pain|current|today/i);
  const impact = take(/impact|benefit|roi|result|value|outcome/i);
  const solution =
    take(/solution|approach|what we built|overview|architecture|how it works/i) ||
    slides.flatMap(body).filter((l) => !problem.includes(l) && !impact.includes(l)).slice(0, 5).join('\n');
  const used = new Set([...problem.split('\n'), ...impact.split('\n')]);
  const lines = slides.flatMap(body);
  const features = lines.filter((l) => l.length > 12 && l.length < 120 && !used.has(l) && !/^ai that/i.test(l)).slice(0, 5);
  const metrics: Metric[] = [];
  for (const l of lines) {
    const m = l.match(/(\d+(?:[.,]\d+)?\s?(?:%|x|hrs?|hours|days|weeks|mins?))/i);
    if (m && metrics.length < 3) metrics.push({ label: truncate(l.replace(m[0], '').replace(/\s+(by|in|of)\s*$/i, '').replace(/[-–:]+\s*$/, '').trim() || 'Impact', 60), value: m[0] });
  }
  const subtitle = slides[0] ? body(slides[0])[0] ?? '' : '';
  return {
    title: slides[0]?.title ?? '',
    tagline: truncate(subtitle || lines.find((l) => l.length > 40) || '', 180),
    industryId: detectIndustry(all, industries),
    extraIndustryIds: [],
    clientName: '',
    problem,
    solution,
    impact,
    metrics,
    features,
    techStack: detectTech(all),
    platformIds: detectPlatforms(all, platforms),
    flow: [],
    flowDescription: '',
    suggestions: ['AI is not configured — this draft was assembled from slide text. Set AI_PROVIDER to get a written draft.'],
    usedAI: false,
  };
}

const DRAFT_SYSTEM = (industries: Industry[], platforms: Platform[]) => `You are the editor of UBTI AI Atlas, the internal portfolio of UBTI's AI team.
Turn pitch-deck slides about ONE AI use case into a project page for sales teams and clients.
Rules:
- Use only facts present in the slides or diagram. Never invent numbers, client names or results. If a field is unknown return "" or [].
- Business tone, concise, outcome-first. No hype words like "revolutionary".
- problem/solution/impact are short markdown paragraphs (2-4 sentences each).
- tagline: one sentence (max 160 chars) a salesperson can read aloud.
- metrics: only numbers stated in the material, as {label, value}.
- industryId must be one of: ${industries.map((i) => i.id).join(', ')}.
- platformIds: client systems used as data sources, chosen ONLY from: ${platforms.map((p) => p.id).join(', ')}.
- techStack: services/frameworks used (e.g. Azure OpenAI, Copilot Studio, Microsoft Fabric).
- flow: if an architecture diagram is provided, 3-8 ordered steps {title, detail} from data source to outcome; flowDescription: 2 sentences.
- suggestions: 2-6 short notes for the editor about missing or weak content (e.g. "No ROI mentioned", "Add a live demo link").
Return JSON with keys: title, tagline, industryId, extraIndustryIds, clientName, problem, solution, impact, metrics, features, techStack, platformIds, flow, flowDescription, suggestions.`;

export async function draftFromSlides(
  slides: SlideExtract[],
  industries: Industry[],
  platforms: Platform[],
  diagram?: { dataUrl: string },
): Promise<Draft> {
  if (!aiEnabled) return heuristicDraft(slides, industries, platforms);
  const parts = [textPart(`Slides selected for this use case:\n\n${slidesText(slides)}`)];
  if (diagram) parts.push(textPart('Architecture diagram for this use case:'), imagePart(diagram.dataUrl));
  const r = await chatJSON<Partial<Draft>>(DRAFT_SYSTEM(industries, platforms), parts, 3000);
  const indIds = new Set(industries.map((i) => i.id));
  const platIds = new Set(platforms.map((p) => p.id));
  return {
    title: r.title ?? '',
    tagline: r.tagline ?? '',
    industryId: r.industryId && indIds.has(r.industryId) ? r.industryId : detectIndustry(slidesText(slides), industries),
    extraIndustryIds: (r.extraIndustryIds ?? []).filter((x) => indIds.has(x) && x !== r.industryId),
    clientName: r.clientName ?? '',
    problem: r.problem ?? '',
    solution: r.solution ?? '',
    impact: r.impact ?? '',
    metrics: (r.metrics ?? []).filter((m) => m?.label && m?.value).slice(0, 6),
    features: (r.features ?? []).filter(Boolean).slice(0, 8),
    techStack: [...new Set(r.techStack ?? [])].slice(0, 16),
    platformIds: (r.platformIds ?? []).filter((x) => platIds.has(x)),
    flow: (r.flow ?? []).filter((f) => f?.title).slice(0, 10),
    flowDescription: r.flowDescription ?? '',
    suggestions: (r.suggestions ?? []).slice(0, 8),
    usedAI: true,
  };
}

export async function readDiagram(dataUrl: string, platforms: Platform[]) {
  if (!aiEnabled) throw new Error('Diagram reading needs AI. Set AI_PROVIDER in .env.local.');
  const r = await chatJSON<{ flow: FlowStep[]; description: string; techStack: string[]; platformIds: string[] }>(
    `You read software architecture diagrams for an AI consultancy's portfolio.
Return: flow (3-8 ordered steps {title, detail} following the data from sources to outcomes), description (2 sentences, plain English, for a business reader),
techStack (services/frameworks visible in the diagram), platformIds (source systems, chosen ONLY from: ${platforms.map((p) => p.id).join(', ')}).
Only include what is visible in the image.`,
    [textPart('Read this architecture diagram.'), imagePart(dataUrl)],
    1500,
  );
  const ids = new Set(platforms.map((p) => p.id));
  return {
    flow: (r.flow ?? []).filter((f) => f?.title),
    description: r.description ?? '',
    techStack: r.techStack ?? [],
    platformIds: (r.platformIds ?? []).filter((x) => ids.has(x)),
  };
}

// ─── Matching (Client Mode + "Plug in your stack") ──────────────────────────
export function scoreProject(
  p: PublicProject,
  q: { industryId?: string; platformIds?: string[]; text?: string },
) {
  let s = 0;
  const reasons: string[] = [];
  if (q.industryId) {
    if (p.industryId === q.industryId) { s += 50; reasons.push('Same industry'); }
    else if (p.extraIndustryIds.includes(q.industryId)) { s += 30; reasons.push('Also used in this industry'); }
  }
  const overlap = (q.platformIds ?? []).filter((x) => p.platformIds.includes(x));
  if (overlap.length) { s += 12 * overlap.length; reasons.push(`Runs on ${overlap.length} of their systems`); }
  if (q.text) {
    const hay = words([p.title, p.tagline, p.problem, p.solution, p.features.join(' '), p.techStack.join(' '), p.platformIds.join(' ').replace(/-/g, ' ')].join(' '));
    const terms = [...new Set(words(q.text).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)))];
    const esc = (t: string) => t.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
    const hits = terms.filter((t) => new RegExp('\\b' + esc(t)).test(hay));
    if (hits.length) { s += Math.min(40, hits.length * 8); reasons.push(`Matches: ${hits.slice(0, 4).join(', ')}`); }
  }
  if (p.maturity === 'template') s += 6;
  if (p.maturity === 'production') s += 4;
  s += (p.reuseScore ?? 50) / 20;
  return { score: Math.round(s), reasons };
}

export interface PitchSuggestion {
  projectId: string;
  score: number;
  reason: string;
  reframe: string;
  recommended: boolean;
}

export async function suggestForPitch(
  input: { clientName: string; industryId?: string; region?: string; context: string; platformIds?: string[] },
  candidates: PublicProject[],
  industries: Industry[],
): Promise<{ intro: string; picks: PitchSuggestion[]; usedAI: boolean }> {
  const ranked = candidates
    .map((p) => ({ p, ...scoreProject(p, { industryId: input.industryId, platformIds: input.platformIds, text: input.context }) }))
    .sort((a, b) => b.score - a.score);
  const ind = industries.find((i) => i.id === input.industryId);
  const fallbackIntro = `Prepared for ${input.clientName}: ready-to-deploy AI agents${ind ? ` for ${ind.shortName.toLowerCase()}` : ''}, built on the systems you already run.`;

  if (!aiEnabled) {
    return {
      usedAI: false,
      intro: fallbackIntro,
      picks: ranked.slice(0, 8).map((r, i) => ({
        projectId: r.p.id,
        score: r.score,
        reason: r.reasons.join(' · ') || 'General fit',
        reframe: r.p.tagline,
        recommended: i < 4 && r.score > 10,
      })),
    };
  }

  const shortlist = ranked.slice(0, 18);
  const r = await chatJSON<{ intro: string; picks: { projectId: string; reason: string; reframe: string }[] }>(
    `You help UBTI's sales team prepare a tailored client microsite from the AI team's portfolio.
Pick the 3-5 projects most relevant to the client and explain why in one short line each.
"reframe" rewrites the project's one-line pitch for THIS client's industry and context (max 200 chars). Do not invent results or claim work for this client.
"intro" is 1-2 sentences welcoming the client (no hype). Only use projectIds from the list.`,
    `Client: ${input.clientName}\nIndustry: ${ind?.name ?? 'unknown'}\nRegion: ${input.region ?? ''}\nSales notes: ${input.context}\n\nPortfolio:\n${shortlist
      .map((x) => `- id=${x.p.id} | ${x.p.title} | ${industries.find((i) => i.id === x.p.industryId)?.shortName} | ${x.p.tagline} | ${truncate(mdToPlain(x.p.solution), 260)}`)
      .join('\n')}\n\nReturn JSON {intro, picks:[{projectId, reason, reframe}]}`,
    2000,
  );
  const byId = new Map(shortlist.map((x) => [x.p.id, x]));
  const picks = (r.picks ?? [])
    .filter((x) => byId.has(x.projectId))
    .map((x) => ({ projectId: x.projectId, score: byId.get(x.projectId)!.score, reason: x.reason, reframe: x.reframe || byId.get(x.projectId)!.p.tagline, recommended: true }));
  // keep a few extra candidates (unticked) for the salesperson
  for (const x of shortlist) if (picks.length < 8 && !picks.some((p) => p.projectId === x.p.id)) picks.push({ projectId: x.p.id, score: x.score, reason: x.reasons.join(' · '), reframe: x.p.tagline, recommended: false });
  return { usedAI: true, intro: r.intro || fallbackIntro, picks };
}
