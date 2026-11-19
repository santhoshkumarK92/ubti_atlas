import { NextResponse } from 'next/server';
import { assertPermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { bytesOf } from '@/lib/storage';
import { draftFromSlides, enhanceText, formatPostBody, ENHANCE_FIELDS, readDiagram, suggestForPitch, type EnhanceField } from '@/lib/intel';
import { getIndustries, getPlatforms, getVisibleProjects } from '@/lib/repo';
import type { StoredFile } from '@/lib/types';

export const maxDuration = 120;

async function dataUrl(f: StoredFile) {
  const b = await bytesOf(f);
  if (!b) throw new Error('Could not read the image');
  if (b.type.includes('svg')) throw new Error('SVG diagrams cannot be read by the vision model — upload a PNG/JPG screenshot.');
  if (b.data.length > 18 * 1024 * 1024) throw new Error('Image is too large for the vision model (max ~18 MB).');
  return `data:${b.type};base64,${b.data.toString('base64')}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action: 'draft' | 'diagram' | 'pitch' | 'enhance' | 'formatPost';
    post?: { body: string; title?: string; type?: string };
    projectId?: string;
    enhance?: { field: EnhanceField; text: string; title?: string; industryId?: string; techStack?: string[] };
    selectedSlides?: number[];
    diagram?: StoredFile;
    image?: StoredFile;
    pitch?: { clientName: string; industryId?: string; region?: string; context: string; platformIds?: string[] };
  };
  try {
    const [industries, platforms] = await Promise.all([getIndustries(), getPlatforms()]);

    if (body.action === 'draft') {
      await assertPermission('projects.edit');
      const store = await getStore();
      const p = await store.get('projects', body.projectId!);
      if (!p?.source) throw new Error('Upload a deck first');
      const sel = new Set(body.selectedSlides?.length ? body.selectedSlides : p.source.slides.map((s) => s.index));
      const slides = p.source.slides.filter((s) => sel.has(s.index));
      await store.update('projects', p.id, { source: { ...p.source, selectedSlides: [...sel] } });
      const diagram = body.diagram ? { dataUrl: await dataUrl(body.diagram) } : undefined;
      const draft = await draftFromSlides(slides, industries, platforms, diagram);
      return NextResponse.json({ draft });
    }

    if (body.action === 'formatPost') {
      await assertPermission('posts.edit');
      const r = await formatPostBody(String(body.post?.body ?? ''), { title: body.post?.title, type: body.post?.type });
      return NextResponse.json(r);
    }

    if (body.action === 'enhance') {
      await assertPermission('projects.edit');
      const e = body.enhance;
      if (!e || !ENHANCE_FIELDS.includes(e.field)) throw new Error('Unknown field');
      // Only the title, industry and tech stack are sent as context — never the real client name.
      const text = await enhanceText(e.field, String(e.text ?? ''), {
        title: e.title,
        industry: industries.find((i) => i.id === e.industryId)?.name,
        techStack: Array.isArray(e.techStack) ? e.techStack.map(String) : undefined,
      });
      return NextResponse.json({ text });
    }

    if (body.action === 'diagram') {
      await assertPermission('projects.edit');
      if (!body.image) throw new Error('No image');
      return NextResponse.json({ result: await readDiagram(await dataUrl(body.image), platforms) });
    }

    if (body.action === 'pitch') {
      await assertPermission('pitches.edit');
      if (!body.pitch?.clientName) throw new Error('Client name is required');
      // Internal-only projects are never offered for client links
      const candidates = (await getVisibleProjects(true)).filter((p) => p.visibility !== 'internal');
      return NextResponse.json(await suggestForPitch(body.pitch, candidates, industries));
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
