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
      <section className="mx-auto mb-6 mt-3 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-md border border-line bg-gradient-to-br from-[#f8f6f2] via-[#f3f0e8] to-[#ece5d6] dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative grid gap-6 p-6 md:grid-cols-[2fr_1fr] md:items-end md:p-10">
            <div>
              <div className="eyebrow mb-4">AI on your stack</div>
              <h1 className="h-display text-5xl md:text-7xl">An AI layer on the systems<br /><span className="text-muted/60">you already run</span></h1>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => <a key={c} href={`#${slugify(c)}`} className="chip border-line bg-card hover:border-ink/40  ">{c}</a>)}
            </div>
          </div>

          {cats.map((c) => (
            <div key={c} id={slugify(c)} className="relative scroll-mt-4 px-4 pb-6 md:px-8">
              <h2 className="h-display px-2 pb-4 pt-4 text-3xl">{c}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {platforms.filter((p) => p.category === c).map((p) => {
                  const n = count(p.id);
                  return (
                    <div key={p.id} className="flex flex-col rounded-md border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_18px_40px_-24px_rgb(var(--ink)/.35)] ">
                      <div className="flex items-start gap-3">
                        {p.logoUrl ? (
                          <Img src={p.logoUrl} alt={p.name} className="h-11 w-11 shrink-0 rounded-sm border border-line bg-white" imgClassName="object-contain p-1.5" />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-line bg-card font-display text-sm font-bold">{initials(p.name)}</span>
                        )}
                        <div className="min-w-0">
                          <div className="font-display text-xl font-semibold leading-tight">{p.name}</div>
                          <div className="text-xs text-muted">{p.vendor}</div>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm text-muted">{p.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1">{p.aiPatterns.map((a) => <span key={a} className="chip text-[11px]">{a}</span>)}</div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs">
                        <span className="min-w-0 truncate text-muted">Connect via: {p.connectVia}</span>
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
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
