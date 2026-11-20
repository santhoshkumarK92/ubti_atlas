import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getIndustries, getVisibleProjects } from '@/lib/repo';
import { Img } from '@/components/ui/Img';
import { Icon } from '@/components/ui/Icon';

export const metadata = { title: 'Industries' };

export default async function IndustriesPage() {
  const signedIn = !!(await getUser());
  const [industries, projects] = await Promise.all([getIndustries(), getVisibleProjects(signedIn)]);
  const list = (id: string) => projects.filter((p) => p.industryId === id || p.extraIndustryIds.includes(id));

  return (
    <>
      <section className="mx-auto mb-6 mt-3 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-md border border-line bg-gradient-to-br from-[#f8faff] via-[#f1f5fc] to-[#e6eefb] dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative p-6 md:p-10">
            <div className="eyebrow mb-4">Business domains</div>
            <h1 className="h-display text-5xl md:text-7xl">AI agents for<br /><span className="text-muted/60">every industry</span></h1>
          </div>
          <div className="relative grid gap-3 p-4 pt-0 sm:grid-cols-2 md:p-6 md:pt-0 lg:grid-cols-3">
            {industries.map((i) => {
          const ps = list(i.id);
          return (
            <Link key={i.id} href={`/industries/${i.slug}`} className="group rounded-md border border-line bg-card p-4 transition hover:-translate-y-0.5 hover:bg-card  md:p-5">
              <Img src={i.imageUrl} alt={i.name} className="aspect-[16/9] rounded-sm" imgClassName="transition duration-700 group-hover:scale-[1.04]" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-sm border border-line bg-card"><Icon name={i.icon} className="h-4 w-4" /></span>
                  <h2 className="font-display text-2xl font-semibold leading-tight">{i.name}</h2>
                </div>
                <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-muted transition group-hover:text-ink" />
              </div>
              <p className="mt-2 text-sm text-muted">{i.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="chip chip-on text-[11px]">{ps.length} {ps.length === 1 ? 'agent' : 'agents'}</span>
                {ps.slice(0, 2).map((p) => <span key={p.id} className="chip text-[11px]">{p.title}</span>)}
              </div>
            </Link>
          );
        })}
          </div>
        </div>
      </section>
    </>
  );
}
