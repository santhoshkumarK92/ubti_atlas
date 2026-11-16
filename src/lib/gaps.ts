import type { Project } from './types';

export interface Gap {
  id: string;
  level: 'block' | 'warn' | 'tip';
  label: string;
  hint: string;
  tab: 'source' | 'content' | 'media' | 'publish';
}

type P = Pick<Project, 'title' | 'tagline' | 'industryId' | 'problem' | 'solution' | 'impact' | 'metrics' | 'techStack' | 'platformIds' | 'architecture' | 'media' | 'demoUrl' | 'demoStatus' | 'visibility' | 'clientName' | 'clientDisplay' | 'features'>;

/** Rule-based completeness check shown in the admin and used before publishing. */
export function computeGaps(p: P): Gap[] {
  const g: Gap[] = [];
  const has = (s?: string, n = 1) => !!s && s.trim().length >= n;

  if (!has(p.title, 3)) g.push({ id: 'title', level: 'block', label: 'No title', hint: 'Give the project a clear, outcome-oriented name.', tab: 'content' });
  if (!p.industryId) g.push({ id: 'industry', level: 'block', label: 'No business domain', hint: 'Pick the primary industry so it appears on the right domain page.', tab: 'content' });
  if (!has(p.solution, 40)) g.push({ id: 'solution', level: 'block', label: 'Solution not described', hint: 'Explain what was built in 2–4 sentences.', tab: 'content' });
  if (!has(p.problem, 30)) g.push({ id: 'problem', level: 'warn', label: 'No business problem', hint: 'Clients buy outcomes — state the pain first.', tab: 'content' });

  const numberInImpact = /\d/.test(p.impact || '');
  if (!p.metrics.length && !numberInImpact)
    g.push({ id: 'roi', level: 'warn', label: 'No ROI mentioned', hint: 'Add at least one number: hours saved, cost reduced, accuracy, go-live time.', tab: 'content' });
  if (!has(p.tagline, 30)) g.push({ id: 'tagline', level: 'warn', label: 'Tagline too short', hint: 'One sentence that a salesperson can read aloud.', tab: 'content' });
  if (!p.techStack.length) g.push({ id: 'tech', level: 'warn', label: 'No tech stack', hint: 'Tag the services used, or let AI read them from the diagram.', tab: 'content' });
  if (!p.platformIds.length) g.push({ id: 'platforms', level: 'tip', label: 'No source systems linked', hint: 'Link the client systems (ERP, CRM, DB) so it shows on “AI on your stack”.', tab: 'content' });

  if (!p.architecture.image) g.push({ id: 'diagram', level: 'warn', label: 'No architecture diagram', hint: 'Pick it from the deck or upload a screenshot.', tab: 'media' });
  else if (!p.architecture.flow.length) g.push({ id: 'flow', level: 'tip', label: 'Diagram not described', hint: 'Run “Read diagram with AI” to generate the flow.', tab: 'media' });

  if (!p.demoUrl) g.push({ id: 'live', level: 'warn', label: 'No live link', hint: 'Add the hosted demo URL — or upload a recording if it runs on localhost.', tab: 'media' });
  else if (p.demoStatus && !p.demoStatus.ok) g.push({ id: 'down', level: 'block', label: 'Demo link is down', hint: `Last check returned ${p.demoStatus.code ?? p.demoStatus.error}. Fix it or remove the link.`, tab: 'media' });

  if (!p.media.video && !p.media.videoEmbedUrl) g.push({ id: 'video', level: p.demoUrl ? 'tip' : 'warn', label: 'No demo video', hint: 'Upload a screen recording or paste a YouTube / Stream link.', tab: 'media' });
  if (!p.media.screenshots.length && !p.demoUrl) g.push({ id: 'screens', level: 'tip', label: 'No screenshots', hint: 'Two or three screenshots make the page sell.', tab: 'media' });
  if ((p.media.video || p.media.videoEmbedUrl) && !p.media.thumbnail) g.push({ id: 'thumb', level: 'tip', label: 'No video thumbnail', hint: 'Upload a poster frame for the video.', tab: 'media' });
  if (!p.features.length) g.push({ id: 'features', level: 'tip', label: 'No key features', hint: 'List 3–5 capabilities.', tab: 'content' });

  if (p.visibility === 'public' && has(p.clientName) && (!has(p.clientDisplay) || p.clientDisplay === p.clientName))
    g.push({ id: 'nda', level: 'warn', label: 'Client name may be exposed', hint: 'Public projects show “Client shown as”. Anonymise it if the client is under NDA.', tab: 'publish' });

  return g;
}

export function completeness(gaps: Gap[]) {
  const weights = { block: 14, warn: 8, tip: 3 };
  return Math.max(0, 100 - gaps.reduce((s, g) => s + weights[g.level], 0));
}
