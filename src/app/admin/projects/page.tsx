import Link from 'next/link';
import { Plus } from 'lucide-react';
import { can, requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries } from '@/lib/repo';
import { completeness, computeGaps } from '@/lib/gaps';
import { cn, timeAgo } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { createProject } from '../actions';

const STATUSES = ['all', 'draft', 'review', 'published', 'archived'] as const;

export default async function ProjectsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; industry?: string; q?: string }> }) {
  const user = await requirePermission('admin.view');
  const sp = await searchParams;
  const [rows, industries] = await Promise.all([(await getStore()).list('projects', { orderBy: ['updatedAt', 'desc'] }), getIndustries()]);
  const status = sp.status ?? 'all';
  const q = (sp.q ?? '').toLowerCase();
  const list = rows.filter((p) => (status === 'all' || p.status === status) && (!sp.industry || p.industryId === sp.industry) && (!q || `${p.title} ${p.tagline} ${p.clientName ?? ''}`.toLowerCase().includes(q)));
  const counts = Object.fromEntries(STATUSES.map((s) => [s, s === 'all' ? rows.length : rows.filter((p) => p.status === s).length]));
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `?${p.toString()}`;
  };

  return (
    <div>
      <PageHead title="Projects" sub="One upload = one project page. Upload a deck, let AI draft, review the gaps, publish.">
        {can(user.role, 'projects.edit') && <form action={createProject}><button className="btn-dark"><Plus className="h-4 w-4" /> New project</button></form>}
      </PageHead>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={qs({ status: s === 'all' ? undefined : s })} className={cn('chip capitalize', status === s && 'chip-on')}>{s} <span className="opacity-60">{counts[s]}</span></Link>
        ))}
        <form className="ml-auto flex gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <select name="industry" defaultValue={sp.industry ?? ''} className="input w-auto py-2 text-sm">
            <option value="">All industries</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
          </select>
          <input name="q" defaultValue={sp.q} placeholder="Search…" className="input w-48 py-2" />
          <button className="btn-ghost btn-sm">Filter</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr><th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 font-medium">Industry</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Visibility</th><th className="px-4 py-3 font-medium">Complete</th><th className="px-4 py-3 font-medium">Updated</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const score = completeness(computeGaps(p));
              return (
                <tr key={p.id} className="hover:bg-soft/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">{p.title || 'Untitled project'}</Link>
                    <div className="text-xs text-muted">{p.clientName ?? '—'}{p.isSample && ' · sample'}{p.featured && ' · featured'}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{industries.find((i) => i.id === p.industryId)?.shortName ?? '—'}</td>
                  <td className="px-4 py-3"><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', { draft: 'bg-soft text-muted', review: 'bg-warn/15 text-warn', published: 'bg-good/15 text-good', archived: 'bg-soft text-muted' }[p.status])}>{p.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{p.visibility}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-soft"><div className={cn('h-full', score >= 80 ? 'bg-good' : score >= 55 ? 'bg-warn' : 'bg-bad')} style={{ width: `${score}%` }} /></div><span className="text-xs tabular-nums text-muted">{score}%</span></div></td>
                  <td className="px-4 py-3 text-xs text-muted">{timeAgo(p.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <p className="p-8 text-center text-sm text-muted">No projects match.</p>}
      </div>
    </div>
  );
}
