import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, CheckCircle2, Eye, FileEdit, Inbox, Link2, Plus, SearchCheck, type LucideIcon } from 'lucide-react';
import { can, getUser } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries } from '@/lib/repo';
import { completeness, computeGaps } from '@/lib/gaps';
import { aiEnabled } from '@/lib/config';
import { timeAgo } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { HealthCheckButton, SampleDataButtons } from '@/components/admin/controls';
import { createProject } from './actions';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const user = (await getUser())!;
  const store = await getStore();
  const [projects, pitches, leads, industries] = await Promise.all([store.list('projects'), store.list('pitches'), store.list('leads'), getIndustries()]);
  const published = projects.filter((p) => p.status === 'published');
  const review = projects.filter((p) => p.status === 'review');
  const drafts = projects.filter((p) => p.status === 'draft');
  const down = projects.filter((p) => p.demoUrl && p.demoStatus && !p.demoStatus.ok);
  const weakest = projects
    .filter((p) => p.status !== 'archived')
    .map((p) => ({ p, gaps: computeGaps(p) }))
    .map((x) => ({ ...x, score: completeness(x.gaps) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);
  const coverage = industries.map((i) => ({ i, n: published.filter((p) => p.industryId === i.id || p.extraIndustryIds.includes(i.id)).length })).sort((a, b) => b.n - a.n);
  const max = Math.max(1, ...coverage.map((c) => c.n));
  const recentPitches = [...pitches].sort((a, b) => (b.lastViewedAt ?? b.createdAt).localeCompare(a.lastViewedAt ?? a.createdAt)).slice(0, 5);
  const newLeads = leads.filter((l) => l.status === 'new');

  return (
    <div className="relative overflow-hidden rounded-md border border-line bg-gradient-to-br from-[#f8f6f2] via-[#f3f0e8] to-[#ece5d6] p-5 dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27] md:p-8">
      <div className="relative">
      <PageHead title={`Hi ${user.name.split(' ')[0]}`} sub="Everything the AI team has built — and what needs attention before the next client meeting.">
        {can(user.role, 'projects.edit') && <form action={createProject}><button className="btn-dark"><Plus className="h-4 w-4" /> New project</button></form>}
        {can(user.role, 'pitches.edit') && <Link href="/admin/pitches/new" className="btn-ghost">Prepare a client pitch</Link>}
      </PageHead>
      {denied && <div className="mb-4 rounded-sm border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">Your role doesn&apos;t have access to that page.</div>}
      {!aiEnabled && can(user.role, 'settings.edit') && (
        <div className="mb-4 rounded-sm border border-line bg-card px-4 py-3 text-sm text-muted">AI is not configured — drafts use slide text only and diagram reading is off. Set <code>AI_PROVIDER</code> and Azure OpenAI keys in <code>.env.local</code>.</div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {([
          ['Published', published.length, '/admin/projects?status=published', CheckCircle2, 'from-emerald-400 to-teal-500'],
          ['In review', review.length, '/admin/projects?status=review', SearchCheck, 'from-amber-400 to-orange-500'],
          ['Drafts', drafts.length, '/admin/projects?status=draft', FileEdit, 'from-slate-400 to-slate-600'],
          ['Client links', pitches.filter((p) => p.status === 'active').length, '/admin/pitches', Link2, 'from-sky-400 to-accent'],
          ['New leads', newLeads.length, '/admin/leads', Inbox, 'from-fuchsia-400 to-violet'],
        ] as [string, number, string, LucideIcon, string][]).map(([l, n, href, Icon, grad]) => (
          <Link key={l} href={href} className="rounded-md border border-line bg-card shadow-sm  group p-5 transition hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_18px_40px_-24px_rgb(var(--ink)/.35)]">
            <div className="flex items-start justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-sm bg-gradient-to-br ${grad} text-white shadow-sm`}><Icon className="h-5 w-5" /></span>
              <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="h-display mt-4 text-5xl">{n}</div>
            <div className="mt-1 text-sm text-muted">{l}</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-line bg-card shadow-sm  p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Needs attention</h2><span className="text-xs text-muted">Lowest completeness first</span></div>
          <div className="divide-y divide-line">
            {weakest.map(({ p, gaps, score }) => (
              <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <span className="w-10 text-right text-sm tabular-nums text-muted">{score}%</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.title || 'Untitled'}</div>
                  <div className="truncate text-xs text-muted">{gaps.slice(0, 3).map((g) => g.label).join(' · ') || 'Complete'}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
            {!weakest.length && <p className="py-6 text-center text-sm text-muted">No projects yet.</p>}
          </div>
        </section>

        <section className="rounded-md border border-line bg-card shadow-sm  p-6">
          <div className="mb-4"><h2 className="font-display text-xl font-semibold">Coverage by industry</h2></div>
          <div className="space-y-1.5">
            {coverage.map(({ i, n }) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <span className="w-36 truncate text-muted">{i.shortName}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"><div className={n ? 'h-full rounded-full bg-gradient-to-r from-accent to-violet' : ''} style={{ width: `${(n / max) * 100}%` }} /></div>
                <span className={`w-6 text-right tabular-nums ${n ? '' : 'text-bad'}`}>{n}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-line bg-card shadow-sm  p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Client links activity</h2><Link href="/admin/pitches" className="text-xs text-muted hover:text-ink">All →</Link></div>
          <div className="divide-y divide-line">
            {recentPitches.map((p) => (
              <Link key={p.id} href={`/admin/pitches/${p.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.clientName}</div><div className="text-xs text-muted">{p.projectIds.length} projects · by {p.createdByName ?? p.createdBy}</div></div>
                <span className="inline-flex items-center gap-1 text-xs text-muted"><Eye className="h-3.5 w-3.5" /> {p.viewCount} · {p.lastViewedAt ? timeAgo(p.lastViewedAt) : 'not opened'}</span>
              </Link>
            ))}
            {!recentPitches.length && <p className="py-6 text-center text-sm text-muted">No client links yet. <Link href="/admin/pitches/new" className="link">Create one</Link>.</p>}
          </div>
        </section>

        <section className="rounded-md border border-line bg-card shadow-sm  p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-xl font-semibold">Demo links</h2>{can(user.role, 'projects.edit') && <HealthCheckButton />}</div>
          {down.length ? (
            <ul className="space-y-2">
              {down.map((p) => (
                <li key={p.id}><Link href={`/admin/projects/${p.id}?tab=media`} className="flex items-center gap-2 text-sm text-bad hover:underline"><AlertTriangle className="h-4 w-4" /> {p.title} — HTTP {p.demoStatus?.code ?? p.demoStatus?.error}</Link></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{projects.filter((p) => p.demoUrl).length} projects have live demo links; none are known to be down.</p>
          )}
        </section>
      </div>

      {can(user.role, 'settings.edit') && (
        <section className="mt-6 rounded-md border border-line bg-card shadow-sm  flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <div className="font-medium">Sample content</div>
            <p className="text-sm text-muted">{projects.filter((p) => p.isSample).length} sample projects are loaded to show the layout. Remove them once your real projects are in.</p>
          </div>
          <SampleDataButtons hasSample={projects.some((p) => p.isSample)} empty={projects.length === 0} />
        </section>
      )}
      </div>
    </div>
  );
}
