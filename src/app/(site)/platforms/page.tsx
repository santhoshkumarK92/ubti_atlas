import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getPlatforms, getVisibleProjects } from '@/lib/repo';
import { PLATFORM_CATEGORIES } from '@/lib/types';
import { initials, slugify } from '@/lib/utils';
import { Img } from '@/components/ui/Img';

export const metadata = { title: 'AI on your stack' };

export default async function PlatformsPage() {
  const signedIn = !!(await getUser());
  const [platforms, projects] = await Promise.all([getPlatforms(), getVisibleProjects(signedIn)]);
  const count = (id: string) => projects.filter((p) => p.platformIds.includes(id)).length;
  const cats = PLATFORM_CATEGORIES.filter((c) => platforms.some((p) => p.category === c));

  return (
    <>
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-4">AI on your stack</div>
          <h1 className="h-display text-5xl md:text-7xl">An AI layer on the systems<br /><span className="text-muted/60">you already run</span></h1>
        </div>
        <div className="flex flex-col justify-end gap-4 border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <p className="text-sm leading-6 text-muted">
            Fabric, Dynamics 365, Salesforce, Oracle, ServiceNow, SAP, SQL Server and {platforms.length - 7}+ more. We connect where your data lives — through mirroring, shortcuts,
            connectors or APIs — and add agents that answer questions, generate reports and take action. No rip-and-replace.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => <a key={c} href={`#${slugify(c)}`} className="chip hover:border-ink/40">{c}</a>)}
          </div>
        </div>
      </section>

      <section className="frame row grid gap-px bg-line md:grid-cols-4">
        {[
          ['Ask in plain English', 'Natural-language questions translated into governed SQL or semantic-model queries.'],
          ['RAG over documents', 'Grounded answers from contracts, manuals, policies and tickets — with citations.'],
          ['Agents that act', 'Create orders, update cases and raise tickets through APIs and MCP tools, with approvals.'],
          ['Alerts & reports', 'Anomaly detection, scheduled narratives and action items in Teams and email.'],
        ].map(([t, d]) => (
          <div key={t} className="bg-paper p-6 md:p-8">
            <div className="font-display text-xl font-semibold">{t}</div>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      {cats.map((c) => (
        <section key={c} id={slugify(c)} className="frame row scroll-mt-4">
          <div className="border-b border-line px-6 py-5 md:px-10"><h2 className="h-display text-3xl">{c}</h2></div>
          <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {platforms.filter((p) => p.category === c).map((p) => {
              const n = count(p.id);
              return (
                <div key={p.id} className="flex flex-col bg-paper p-6">
                  <div className="flex items-start gap-3">
                    {p.logoUrl ? (
                      <Img src={p.logoUrl} alt={p.name} className="h-11 w-11 shrink-0 rounded-xl border border-line bg-white" imgClassName="object-contain p-1.5" />
                    ) : (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-card font-display text-sm font-bold">{initials(p.name)}</span>
                    )}
                    <div className="min-w-0">
                      <div className="font-display text-xl font-semibold leading-tight">{p.name}</div>
                      <div className="text-xs text-muted">{p.vendor}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">{p.aiPatterns.map((a) => <span key={a} className="chip text-[11px]">{a}</span>)}</div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs">
                    <span className="text-muted">Connect via: {p.connectVia}</span>
                    {n > 0 ? (
                      <Link href={`/projects?platform=${p.id}`} className="inline-flex shrink-0 items-center gap-1 font-medium hover:underline">{n} {n === 1 ? 'agent' : 'agents'} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    ) : (
                      <span className="shrink-0 text-muted">Template-ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
