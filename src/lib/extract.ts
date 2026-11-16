import 'server-only';
import JSZip from 'jszip';
import path from 'node:path';
import { putFile, mimeFromName } from './storage';
import type { SlideExtract, StoredFile } from './types';

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');

/** Paragraph-aware text extraction from DrawingML XML. */
function paragraphs(xml: string): string[] {
  return xml
    .split(/<\/a:p>/)
    .map((p) => decode([...p.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]).join('')).trim())
    .filter(Boolean);
}

function titleOf(slideXml: string): string {
  const shapes = slideXml.split(/<p:sp>|<p:sp /);
  for (const sh of shapes) {
    if (/<p:ph[^>]*type="(ctrTitle|title)"/.test(sh)) {
      const t = paragraphs(sh).join(' ').trim();
      if (t) return t;
    }
  }
  return '';
}

function rels(xml: string) {
  return [...xml.matchAll(/<Relationship\b([^>]*)\/?>/g)].map((m) => {
    const a = m[1]!;
    const get = (k: string) => a.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? '';
    return { id: get('Id'), type: get('Type'), target: get('Target'), mode: get('TargetMode') };
  });
}

const SHOWABLE = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const MIN_BYTES = 6 * 1024; // skip tiny icons / bullets
const MAX_BYTES = 20 * 1024 * 1024; // skip embedded videos

export interface ExtractResult {
  slides: SlideExtract[];
  skippedMedia: number;
}

/**
 * Extract per-slide title, text, speaker notes and embedded images from a .pptx.
 * Images are uploaded once (deduplicated) to `${folder}/media`.
 */
export async function extractPptx(buf: Buffer, folder: string): Promise<ExtractResult> {
  const zip = await JSZip.loadAsync(buf);
  const read = (p: string) => zip.file(p)?.async('string') ?? Promise.resolve('');

  // Slide order from presentation.xml
  const pres = await read('ppt/presentation.xml');
  const presRels = rels(await read('ppt/_rels/presentation.xml.rels'));
  const order = [...pres.matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)]
    .map((m) => presRels.find((r) => r.id === m[1])?.target)
    .filter(Boolean)
    .map((t) => path.posix.join('ppt', t!));
  const slidePaths = order.length
    ? order
    : Object.keys(zip.files)
        .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
        .sort((a, b) => Number(a.match(/\d+/g)!.pop()) - Number(b.match(/\d+/g)!.pop()));

  const uploaded = new Map<string, StoredFile | null>();
  let skippedMedia = 0;
  const slides: SlideExtract[] = [];

  for (const [i, sp] of slidePaths.entries()) {
    const xml = await read(sp);
    if (!xml) continue;
    const dir = path.posix.dirname(sp);
    const relPath = path.posix.join(dir, '_rels', path.posix.basename(sp) + '.rels');
    const r = rels(await read(relPath));

    const paras = paragraphs(xml);
    const title = titleOf(xml) || paras[0] || `Slide ${i + 1}`;

    // Speaker notes
    let notes = '';
    const notesRel = r.find((x) => x.type.endsWith('/notesSlide'));
    if (notesRel) {
      const nx = await read(path.posix.normalize(path.posix.join(dir, notesRel.target)));
      notes = paragraphs(nx)
        .filter((t) => !/^\d+$/.test(t))
        .join('\n');
    }

    // Images actually referenced in the slide body
    const usedIds = new Set([...xml.matchAll(/r:embed="([^"]+)"/g)].map((m) => m[1]));
    const images: StoredFile[] = [];
    for (const rel of r.filter((x) => x.type.endsWith('/image') && x.mode !== 'External' && usedIds.has(x.id))) {
      const mediaPath = path.posix.normalize(path.posix.join(dir, rel.target));
      if (!uploaded.has(mediaPath)) {
        const ext = path.posix.extname(mediaPath).toLowerCase();
        const f = zip.file(mediaPath);
        if (!f || !SHOWABLE.has(ext)) {
          skippedMedia++;
          uploaded.set(mediaPath, null);
        } else {
          const data = await f.async('nodebuffer');
          if (data.length < MIN_BYTES || data.length > MAX_BYTES) {
            uploaded.set(mediaPath, null);
          } else {
            const name = `slide${i + 1}-${path.posix.basename(mediaPath)}`;
            uploaded.set(mediaPath, await putFile(`${folder}/media`, name, data, mimeFromName(name)));
          }
        }
      }
      const up = uploaded.get(mediaPath);
      if (up && !images.some((x) => x.path === up.path)) images.push(up);
    }

    slides.push({ index: i + 1, title: title.slice(0, 160), text: paras.join('\n').slice(0, 6000), notes: notes.slice(0, 3000) || undefined, images });
  }
  return { slides, skippedMedia };
}

/** Per-page text from a PDF. (Images are not extracted — upload diagrams separately.) */
export async function extractPdf(buf: Buffer): Promise<ExtractResult> {
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return {
    skippedMedia: 0,
    slides: pages.map((t, i) => {
      const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      return { index: i + 1, title: (lines[0] || `Page ${i + 1}`).slice(0, 160), text: lines.join('\n').slice(0, 6000), images: [] };
    }),
  };
}
