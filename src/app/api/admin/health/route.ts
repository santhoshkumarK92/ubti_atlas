import { NextResponse } from 'next/server';
import { assertPermission } from '@/lib/auth';
import { checkAllDemos, checkUrl } from '@/lib/health';
import { getStore } from '@/lib/store';

/** POST {projectId?, url?} — check one link (or all demo links when empty). */
export async function POST(req: Request) {
  try {
    await assertPermission('projects.edit');
    const { projectId, url } = (await req.json().catch(() => ({}))) as { projectId?: string; url?: string };
    if (url) {
      const st = await checkUrl(url);
      if (projectId) await (await getStore()).update('projects', projectId, { demoStatus: st });
      return NextResponse.json({ status: st });
    }
    return NextResponse.json({ results: await checkAllDemos() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
