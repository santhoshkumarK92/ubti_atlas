import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getPitchBySlug } from '@/lib/repo';
import { getUser } from '@/lib/auth';
import type { PitchEvent } from '@/lib/types';
import { nowIso } from '@/lib/utils';

const TYPES = new Set<PitchEvent['type']>(['open', 'project_view', 'dwell', 'demo_click', 'video_play']);

/** Client-microsite analytics beacon. Staff (signed-in) views are ignored so numbers stay honest. */
export async function POST(req: Request) {
  try {
    const body = JSON.parse((await req.text()) || '{}') as { slug?: string; type?: PitchEvent['type']; projectId?: string; seconds?: number; visitorId?: string };
    if (!body.slug || !body.type || !TYPES.has(body.type)) return NextResponse.json({ ok: false }, { status: 400 });
    if (await getUser()) return NextResponse.json({ ok: true, ignored: 'staff' });
    const pitch = await getPitchBySlug(body.slug);
    if (!pitch || pitch.status !== 'active') return NextResponse.json({ ok: false }, { status: 404 });
    if (body.projectId && !pitch.projectIds.includes(body.projectId)) return NextResponse.json({ ok: false }, { status: 400 });

    const store = await getStore();
    const visitorId = (body.visitorId || 'anon').slice(0, 40);
    await store.create('pitchEvents', {
      pitchId: pitch.id,
      type: body.type,
      projectId: body.projectId,
      seconds: body.seconds ? Math.min(Math.round(body.seconds), 3600) : undefined,
      visitorId,
      at: nowIso(),
    });
    if (body.type === 'open') {
      const prior = await store.list('pitchEvents', { where: [['pitchId', '==', pitch.id]] });
      const unique = new Set(prior.filter((e) => e.type === 'open').map((e) => e.visitorId)).size;
      await store.update('pitches', pitch.id, { viewCount: (pitch.viewCount || 0) + 1, uniqueVisitors: unique, lastViewedAt: nowIso() });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
