import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { can, requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries, getPlatforms, getVisibleProjects } from '@/lib/repo';
import { aiEnabled, config } from '@/lib/config';
import { formatDate, timeAgo } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { PitchEditor } from '@/components/admin/PitchEditor';
import { deletePitch } from '../../actions';

export default async function PitchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission('pitches.view');
  const { id } = await params;
  const store = await getStore();
  const pitch = await store.get('pitches', id);
  if (!pitch) notFound();
  const [events, projects, industries, platforms] = await Promise.all([
    store.list('pitchEvents', { where: [['pitchId', '==', id]], orderBy: ['at', 'desc'] }),
    getVisibleProjects(true),
    getIndustries(),
    getPlatforms(),
  ]);

  const per = pitch.projectIds.map((pid) => {
    const evs = events.filter((e) => e.projectId === pid);
    return {
      pid,
      title: projects.find((p) => p.id === pid)?.title ?? pid,
      views: evs.filter((e) => e.type === 'project_view').length,
      seconds: Math.round(evs.filter((e) => e.type === 'dwell').reduce((s, e) => s + (e.seconds ?? 0), 0)),
      demo: evs.filter((e) => e.type === 'demo_click').length,
    };
  });
  const maxSec = Math.max(1, ...per.map((p) => p.seconds));
  const top = [...per].sort((a, b) => b.seconds - a.seconds)[0];
  const editable = can(user.role, 'pitches.edit');

  return (
    <div>
      <PageHead title={pitch.clientName} sub={`Created ${formatDate(pitch.createdAt)} by ${pitch.createdByName ?? pitch.createdBy}`}>
        {editable && (
          <form action={deletePitch.bind(null, pitch.id)}>
            <button className="btn-ghost text-bad"><Trash2 className="h-4 w-4" /> Delete</button>
          </form>
        )}
      </PageHead>

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ['Opens', pitch.viewCount],
          ['People', pitch.uniqueVisitors],
          ['Last opened', pitch.lastViewedAt ? timeAgo(pitch.lastViewedAt) : '—'],
          ['Most read', top && top.seconds > 0 ? top.title : '—'],
        ].map(([l, v]) => (
          <div key={l as string} className="card p-5"><div className="h-display truncate text-3xl">{v}</div><div className="mt-1 text-sm text-muted">{l}</div></div>
        ))}
      </section>

      <section className="card mb-6 p-5">
        <h2 className="font-display text-xl font-semibold">What they looked at</h2>
        <p className="text-xs text-muted">Staff visits are excluded. Reading time counts while a project section is on screen.</p>
        <div className="mt-4 space-y-2.5">
          {per.map((p) => (
            <div key={p.pid} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm md:grid-cols-[260px_1fr_auto]">
              <span className="truncate">{p.title}</span>
              <div className="hidden h-2 overflow-hidden rounded-full bg-soft md:block"><div className="h-full rounded-full bg-gradient-to-r from-accent to-violet" style={{ width: `${(p.seconds / maxSec) * 100}%` }} /></div>
              <span className="text-xs tabular-nums text-muted">{p.views} views · {Math.floor(p.seconds / 60)}m {p.seconds % 60}s{p.demo ? ` · ${p.demo} demo clicks` : ''}</span>
            </div>
          ))}
        </div>
        {events.length > 0 && (
          <details className="mt-5 text-sm">
            <summary className="cursor-pointer text-muted">Recent activity ({events.length})</summary>
            <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-xs text-muted">
              {events.slice(0, 100).map((e) => (
                <li key={e.id}>{formatDate(e.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · visitor {e.visitorId.slice(0, 6)} · {e.type.replace('_', ' ')}{e.projectId ? ` · ${projects.find((p) => p.id === e.projectId)?.title ?? ''}` : ''}{e.seconds ? ` · ${e.seconds}s` : ''}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {editable ? (
        <PitchEditor pitch={pitch} projects={projects.filter((p) => p.visibility !== 'internal')} industries={industries} platforms={platforms} siteUrl={config.siteUrl} aiOn={aiEnabled} />
      ) : (
        <a href={`/for/${pitch.slug}`} target="_blank" className="btn-dark">Open the microsite</a>
      )}
    </div>
  );
}
