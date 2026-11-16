import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries } from '@/lib/repo';
import { formatDate } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { LeadStatus } from '@/components/admin/controls';

export default async function Leads() {
  await requirePermission('leads.view');
  const [leads, industries] = await Promise.all([(await getStore()).list('leads', { orderBy: ['createdAt', 'desc'] }), getIndustries()]);
  const srcLink = (s: string) => {
    const [k, v] = s.split(':');
    if (k === 'project') return <Link className="link" href={`/projects/${v}`}>project · {v}</Link>;
    if (k === 'microsite') return <Link className="link" href={`/for/${v}`}>client link · {v}</Link>;
    return s;
  };
  return (
    <div>
      <PageHead title="Leads" sub="Demo requests from the Contact page, project pages and client microsites." />
      <div className="card divide-y divide-line">
        {leads.map((l) => (
          <div key={l.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_2fr_auto]">
            <div>
              <div className="font-medium">{l.name}</div>
              <a className="text-sm text-muted hover:underline" href={`mailto:${l.email}`}>{l.email}</a>
              <div className="text-xs text-muted">{[l.company, l.phone, industries.find((i) => i.id === l.industryId)?.shortName].filter(Boolean).join(' · ')}</div>
            </div>
            <div className="text-sm">
              <p className="whitespace-pre-wrap text-ink/80">{l.message || '—'}</p>
              <div className="mt-1 text-xs text-muted">{formatDate(l.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {srcLink(l.source)}</div>
            </div>
            <LeadStatus id={l.id} status={l.status} />
          </div>
        ))}
        {!leads.length && <p className="p-8 text-center text-sm text-muted">No leads yet.</p>}
      </div>
    </div>
  );
}
