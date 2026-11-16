'use client';
import { useEffect } from 'react';

function visitorId() {
  try {
    let v = localStorage.getItem('atlas-vid');
    if (!v) {
      v = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('atlas-vid', v);
    }
    return v;
  } catch {
    return 'anon';
  }
}

function send(body: Record<string, unknown>) {
  const data = JSON.stringify(body);
  if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([data], { type: 'application/json' }));
  else fetch('/api/track', { method: 'POST', body: data, keepalive: true }).catch(() => {});
}

/** Records opens, which project sections were viewed and for how long. Sections carry data-project-id. */
export function MicrositeTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const vid = visitorId();
    send({ slug, type: 'open', visitorId: vid });

    const seen = new Set<string>();
    const startedAt = new Map<string, number>();
    const total = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.projectId!;
          if (e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= window.innerHeight * 0.4)) {
            if (!seen.has(id)) { seen.add(id); send({ slug, type: 'project_view', projectId: id, visitorId: vid }); }
            startedAt.set(id, Date.now());
          } else if (startedAt.has(id)) {
            total.set(id, (total.get(id) ?? 0) + (Date.now() - startedAt.get(id)!) / 1000);
            startedAt.delete(id);
          }
        }
      },
      { threshold: [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.7, 1] },
    );
    document.querySelectorAll<HTMLElement>('[data-project-id]').forEach((el) => io.observe(el));

    const flush = () => {
      for (const [id, t] of startedAt) total.set(id, (total.get(id) ?? 0) + (Date.now() - t) / 1000);
      startedAt.clear();
      for (const [id, s] of total) if (s >= 2) send({ slug, type: 'dwell', projectId: id, seconds: s, visitorId: vid });
      total.clear();
    };
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
      if (a) send({ slug, type: a.dataset.track, projectId: a.dataset.pid, visitorId: vid });
    };
    document.addEventListener('click', onClick);

    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onHide); document.removeEventListener('click', onClick); flush(); };
  }, [slug]);
  return null;
}
