import 'server-only';
import { getStore } from './store';
import type { DemoStatus } from './types';
import { nowIso } from './utils';

export async function checkUrl(url: string): Promise<DemoStatus> {
  const at = nowIso();
  const attempt = async (method: 'HEAD' | 'GET') =>
    fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'UBTI-AI-Atlas-HealthCheck/1.0' } });
  try {
    let r = await attempt('HEAD');
    if (r.status === 405 || r.status === 403 || r.status === 501) r = await attempt('GET');
    // 401 means the demo is up but behind a login — treat as alive.
    return { ok: r.status < 400 || r.status === 401, code: r.status, checkedAt: at };
  } catch (e) {
    return { ok: false, code: null, checkedAt: at, error: (e as Error).name === 'TimeoutError' ? 'timeout' : (e as Error).message.slice(0, 120) };
  }
}

export async function checkAllDemos() {
  const s = await getStore();
  const rows = (await s.list('projects')).filter((p) => p.demoUrl);
  const results = await Promise.all(
    rows.map(async (p) => {
      const st = await checkUrl(p.demoUrl!);
      await s.update('projects', p.id, { demoStatus: st });
      return { id: p.id, title: p.title, url: p.demoUrl, ...st };
    }),
  );
  return results;
}
