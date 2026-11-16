import 'server-only';
import PptxGenJS from 'pptxgenjs';
import type { CompanySettings, Industry, Platform } from './types';
import type { PublicProject } from './repo';
import { bytesOf } from './storage';
import { mdToPlain, truncate } from './utils';

const INK = '0B1020';
const MUTED = '5B6475';
const ACCENT = '5B6CFF';
const VIOLET = '8B5CF6';
const LINE = 'E3E6EC';
const PAPER = 'F7F8FA';
const FONT_H = 'Arial Narrow';
const FONT = 'Calibri';

async function imageData(f?: { path?: string; url?: string }) {
  if (!f) return null;
  const b = await bytesOf(f);
  if (!b || b.type.includes('svg')) return null; // SVG support in PowerPoint is inconsistent
  return `data:${b.type};base64,${b.data.toString('base64')}`;
}

export interface DeckInput {
  company: CompanySettings;
  clientName?: string;
  clientLogo?: { path?: string; url?: string };
  intro?: string;
  industry?: Industry;
  projects: PublicProject[];
  reframes?: Record<string, string>;
  industries: Industry[];
  platforms: Platform[];
  link?: string;
}

/** Builds a branded 16:9 deck: cover → "bring the AI to your data" → one slide per project → close. */
export async function buildDeck(d: DeckInput): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
  pptx.title = d.clientName ? `${d.company.productName} — ${d.clientName}` : d.company.productName;
  pptx.company = d.company.name;

  pptx.defineSlideMaster({
    title: 'ATLAS',
    background: { color: 'FFFFFF' },
    objects: [
      { rect: { x: 0, y: 0, w: 13.33, h: 0.08, fill: { color: ACCENT } } },
      { text: { text: `${d.company.productName}`, options: { x: 0.5, y: 7.0, w: 6, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED } } },
      { line: { x: 0.5, y: 6.9, w: 12.33, h: 0, line: { color: LINE, width: 0.75 } } },
    ],
    slideNumber: { x: 12.4, y: 7.0, fontFace: FONT, fontSize: 9, color: MUTED },
  });

  // 1 ─ Cover
  const cover = pptx.addSlide();
  cover.background = { color: INK };
  cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: INK } });
  cover.addShape(pptx.ShapeType.ellipse, { x: 8.2, y: -2.2, w: 7.5, h: 7.5, fill: { color: ACCENT, transparency: 70 }, line: { color: ACCENT, transparency: 100 } });
  cover.addShape(pptx.ShapeType.ellipse, { x: 9.8, y: 2.6, w: 5.5, h: 5.5, fill: { color: VIOLET, transparency: 72 }, line: { color: VIOLET, transparency: 100 } });
  cover.addText(d.company.productName.toUpperCase(), { x: 0.7, y: 0.6, w: 8, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: 'A9B1FF', charSpacing: 4 });
  if (d.clientName) cover.addText(`Prepared for ${d.clientName}`, { x: 0.7, y: 2.1, w: 9, h: 0.5, fontFace: FONT, fontSize: 18, color: 'C9CEE0' });
  cover.addText(d.industry ? `AI agents for ${d.industry.name}` : d.company.tagline, {
    x: 0.7, y: 2.6, w: 9.5, h: 1.9, fontFace: FONT_H, fontSize: 44, bold: true, color: 'FFFFFF', valign: 'top',
  });
  cover.addText(d.company.pitchLine, { x: 0.7, y: 4.7, w: 9, h: 0.5, fontFace: FONT, fontSize: 16, color: 'C9CEE0' });
  const logo = await imageData(d.clientLogo);
  if (logo) cover.addImage({ data: logo, x: 0.7, y: 5.7, w: 1.6, h: 0.9, sizing: { type: 'contain', w: 1.6, h: 0.9 } });
  cover.addText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), { x: 9.3, y: 6.7, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 11, color: 'C9CEE0', align: 'right' });

  // 2 ─ Your data could be anywhere
  const s2 = pptx.addSlide({ masterName: 'ATLAS' });
  s2.addText(d.company.tagline, { x: 0.5, y: 0.4, w: 12.3, h: 1.1, fontFace: FONT_H, fontSize: 34, bold: true, color: INK });
  s2.addText(d.intro || d.company.subTagline, { x: 0.5, y: 1.5, w: 12.3, h: 0.9, fontFace: FONT, fontSize: 14, color: MUTED, valign: 'top' });
  const usedPlatforms = d.platforms.filter((p) => d.projects.some((x) => x.platformIds.includes(p.id))).slice(0, 12);
  const cols = [
    { title: 'Any data source', items: usedPlatforms.length ? usedPlatforms.map((p) => p.name) : ['Databases', 'ERP & CRM', 'Cloud & SaaS', 'Files & SharePoint'] },
    { title: 'Unify & reason', items: ['Microsoft Fabric', 'Azure AI Foundry agents', 'Copilot Studio', 'Governed semantic layer'] },
    { title: 'Outcomes', items: ['AI agents that act', 'Q&A in plain English', 'Reports generated instantly', 'Action items & next steps'] },
  ];
  cols.forEach((c, i) => {
    const x = 0.5 + i * 4.18;
    s2.addShape(pptx.ShapeType.roundRect, { x, y: 2.7, w: 3.95, h: 3.9, fill: { color: i === 1 ? INK : PAPER }, line: { color: LINE }, rectRadius: 0.12 });
    s2.addText(c.title, { x: x + 0.3, y: 2.9, w: 3.4, h: 0.5, fontFace: FONT_H, fontSize: 20, bold: true, color: i === 1 ? 'FFFFFF' : INK });
    s2.addText(
      c.items.slice(0, 9).map((t) => ({ text: t, options: { bullet: { code: '25A0' }, breakLine: true } })),
      { x: x + 0.3, y: 3.5, w: 3.4, h: 3.0, fontFace: FONT, fontSize: 13, color: i === 1 ? 'DADFF0' : INK, valign: 'top', paraSpaceAfter: 4 },
    );
  });

  // 3.. ─ one slide per project
  for (const p of d.projects) {
    const s = pptx.addSlide({ masterName: 'ATLAS' });
    const ind = d.industries.find((i) => i.id === p.industryId);
    s.addText((ind?.shortName ?? '').toUpperCase(), { x: 0.5, y: 0.3, w: 8, h: 0.3, fontFace: FONT, fontSize: 10, bold: true, color: ACCENT, charSpacing: 3 });
    s.addText(p.title, { x: 0.5, y: 0.6, w: 8.6, h: 0.8, fontFace: FONT_H, fontSize: 30, bold: true, color: INK });
    s.addText(d.reframes?.[p.id] || p.tagline, { x: 0.5, y: 1.4, w: 8.6, h: 0.8, fontFace: FONT, fontSize: 14, color: MUTED, valign: 'top' });

    const blocks: [string, string][] = [
      ['The problem', mdToPlain(p.problem)],
      ['What we built', mdToPlain(p.solution)],
    ];
    blocks.forEach(([h, body], i) => {
      const y = 2.35 + i * 1.95;
      s.addText(h, { x: 0.5, y, w: 4.2, h: 0.35, fontFace: FONT_H, fontSize: 15, bold: true, color: INK });
      s.addText(truncate(body, 420), { x: 0.5, y: y + 0.35, w: 4.2, h: 1.55, fontFace: FONT, fontSize: 11, color: '30364A', valign: 'top' });
    });

    const img = await imageData(p.architecture.image ?? p.media.screenshots[0] ?? p.media.thumbnail);
    if (img) {
      s.addShape(pptx.ShapeType.rect, { x: 4.95, y: 2.35, w: 4.6, h: 3.9, fill: { color: PAPER }, line: { color: LINE } });
      s.addImage({ data: img, x: 5.05, y: 2.45, w: 4.4, h: 3.7, sizing: { type: 'contain', w: 4.4, h: 3.7 } });
    } else if (p.architecture.flow.length) {
      s.addText('How it works', { x: 4.95, y: 2.35, w: 4.6, h: 0.35, fontFace: FONT_H, fontSize: 15, bold: true, color: INK });
      p.architecture.flow.slice(0, 6).forEach((f, i) => {
        const y = 2.8 + i * 0.58;
        s.addShape(pptx.ShapeType.roundRect, { x: 4.95, y, w: 4.6, h: 0.48, fill: { color: i % 2 ? 'FFFFFF' : PAPER }, line: { color: LINE }, rectRadius: 0.08 });
        s.addText(`${i + 1}`, { x: 5.05, y, w: 0.4, h: 0.48, fontFace: FONT_H, fontSize: 14, bold: true, color: ACCENT });
        s.addText(f.title, { x: 5.45, y, w: 4.0, h: 0.48, fontFace: FONT, fontSize: 11, color: INK });
      });
    }

    // right rail: metrics + stack
    const metrics = p.metrics.slice(0, 3);
    metrics.forEach((m, i) => {
      const y = 0.6 + i * 1.15;
      s.addShape(pptx.ShapeType.roundRect, { x: 9.8, y, w: 3.0, h: 1.0, fill: { color: i === 0 ? INK : PAPER }, line: { color: LINE }, rectRadius: 0.1 });
      s.addText(m.value, { x: 9.95, y: y + 0.05, w: 2.75, h: 0.55, fontFace: FONT_H, fontSize: 24, bold: true, color: i === 0 ? 'FFFFFF' : INK });
      s.addText(m.label, { x: 9.95, y: y + 0.55, w: 2.75, h: 0.4, fontFace: FONT, fontSize: 10, color: i === 0 ? 'C9CEE0' : MUTED });
    });
    const stackY = 0.6 + Math.max(metrics.length, 1) * 1.15 + 0.1;
    s.addText('Tech stack', { x: 9.8, y: stackY, w: 3, h: 0.3, fontFace: FONT_H, fontSize: 13, bold: true, color: INK });
    s.addText(p.techStack.slice(0, 8).join('  ·  ') || '—', { x: 9.8, y: stackY + 0.3, w: 3, h: 1.2, fontFace: FONT, fontSize: 10, color: '30364A', valign: 'top' });
    const sys = d.platforms.filter((x) => p.platformIds.includes(x.id)).map((x) => x.name);
    if (sys.length) {
      s.addText('Connects to', { x: 9.8, y: stackY + 1.5, w: 3, h: 0.3, fontFace: FONT_H, fontSize: 13, bold: true, color: INK });
      s.addText(sys.slice(0, 6).join('  ·  '), { x: 9.8, y: stackY + 1.8, w: 3, h: 1.0, fontFace: FONT, fontSize: 10, color: '30364A', valign: 'top' });
    }
    if (p.demoUrl) s.addText([{ text: 'Live demo ↗', options: { hyperlink: { url: p.demoUrl } } }], { x: 9.8, y: 6.35, w: 3, h: 0.4, fontFace: FONT, fontSize: 12, bold: true, color: ACCENT });
  }

  // Close
  const end = pptx.addSlide();
  end.background = { color: INK };
  end.addText('Skip the months of development.', { x: 0.7, y: 2.2, w: 11, h: 1, fontFace: FONT_H, fontSize: 40, bold: true, color: 'FFFFFF' });
  end.addText('Start with a template.', { x: 0.7, y: 3.1, w: 11, h: 0.9, fontFace: FONT_H, fontSize: 40, bold: true, color: 'A9B1FF' });
  end.addText(
    [d.company.partnerLine, d.company.website, d.company.contactEmail, d.link].filter(Boolean).join('   ·   '),
    { x: 0.7, y: 4.5, w: 12, h: 0.5, fontFace: FONT, fontSize: 14, color: 'C9CEE0' },
  );

  const out = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
  return out;
}
