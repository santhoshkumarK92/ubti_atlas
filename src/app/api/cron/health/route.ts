import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { checkAllDemos } from '@/lib/health';

/** For Cloud Scheduler / Azure Logic App / GitHub Actions: GET /api/cron/health?key=CRON_SECRET */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key');
  if (!config.cronSecret || key !== config.cronSecret) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const results = await checkAllDemos();
  return NextResponse.json({ checked: results.length, down: results.filter((r) => !r.ok) });
}
