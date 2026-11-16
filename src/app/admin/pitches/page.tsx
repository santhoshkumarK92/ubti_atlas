import Link from 'next/link';
import { Eye, Plus } from 'lucide-react';
import { can, requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries } from '@/lib/repo';
import { formatDate, timeAgo } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';

export default async function Pitches() {
  const user = await requirePermission('pitches.view');
  const [pitches, industries] = await Promise.all([(await getStore()).list('pitches', { orderBy: ['createdAt', 'desc'] }), getIndustries()]);
  return (
    <div>
      <PageHead title="Client Mode" sub="Type who the meeting is with — the Atlas picks the most relevant projects, reframes them for that client and gives you a private link and a PPT. See when they open it and what they read.">
        {can(user.role, 'pitches.edit') && <Link href="/admin/pitches/new" className="btn-dark"><Plus className="h-4 w-4" /> New client pitch</Link>}
      </PageHead>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pitches.map((p) => (
          <Link key={p.id} href={`/admin/pitches/${p.id}`} className="card p-5 transition hover:border-ink/30">
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow">{industries.find((i) => i.id === p.industryId)?.shortName ?? 'Any industry'}</span>
              <span className={`chip text-[10px] ${p.status === 'active' ? 'border-good/40 text-good' : ''}`}>{p.status}</span>
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">{p.clientName}</div>
            <div className="mt-1 text-xs text-muted">{p.projectIds.length} projects · {formatDate(p.createdAt)} · {p.createdByName ?? p.createdBy}</div>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4 text-muted" /> {p.viewCount} opens</span>
              <span className="text-muted">{p.uniqueVisitors} people</span>
              <span className="ml-auto text-xs text-muted">{p.lastViewedAt ? `last ${timeAgo(p.lastViewedAt)}` : 'not opened yet'}</span>
            </div>
          </Link>
        ))}
        {!pitches.length && <div className="card col-span-full p-10 text-center text-sm text-muted">No client pitches yet.</div>}
      </div>
    </div>
  );
}
