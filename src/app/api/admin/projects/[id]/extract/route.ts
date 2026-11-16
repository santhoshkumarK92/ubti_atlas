import { NextResponse } from 'next/server';
import { assertPermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { readFile } from '@/lib/storage';
import { extractPdf, extractPptx } from '@/lib/extract';
import type { ProjectSource, StoredFile } from '@/lib/types';
import { nowIso } from '@/lib/utils';

export const maxDuration = 120;

/** Reads an uploaded PPTX/PDF, extracts slides (text, notes, images) and stores them on the project. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await assertPermission('projects.edit');
    const { id } = await ctx.params;
    const { file } = (await req.json()) as { file: StoredFile };
    const store = await getStore();
    const project = await store.get('projects', id);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const lower = (file.name || file.path).toLowerCase();
    const kind: ProjectSource['kind'] | null = lower.endsWith('.pptx') ? 'pptx' : lower.endsWith('.pdf') ? 'pdf' : null;
    if (!kind) {
      return NextResponse.json({ error: lower.endsWith('.ppt') ? 'Old .ppt format — open it in PowerPoint and “Save as .pptx” first.' : 'Upload a .pptx or .pdf' }, { status: 400 });
    }
    const buf = await readFile(file.path);
    const result = kind === 'pptx' ? await extractPptx(buf, `projects/${id}/source`) : await extractPdf(buf);
    const source: ProjectSource = {
      fileName: file.name || file.path.split('/').pop()!,
      file,
      kind,
      slides: result.slides,
      selectedSlides: result.slides.length <= 6 ? result.slides.map((s) => s.index) : [],
      skippedMedia: result.skippedMedia,
      extractedAt: nowIso(),
    };
    await store.update('projects', id, { source, deck: file, updatedAt: nowIso() });
    return NextResponse.json({ source });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
