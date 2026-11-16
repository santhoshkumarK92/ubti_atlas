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
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-4">Business domains</div>
          <h1 className="h-display text-5xl md:text-7xl">AI agents for<br /><span className="text-muted/60">every industry</span></h1>
        </div>
        <div className="flex items-end border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <p className="text-sm leading-6 text-muted">From Shipping and Automotive to Healthcare, Financial Services, Aerospace, Education, Manufacturing, Insurance, Oil & Gas and Real Estate. Each domain page lists every agent we have built, with architecture, demos and results.</p>
        </div>
      </section>
      <section className="frame row grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((i) => {
          const ps = list(i.id);
          return (
            <Link key={i.id} href={`/industries/${i.slug}`} className="group bg-paper p-4 transition hover:bg-card md:p-5">
              <Img src={i.imageUrl} alt={i.name} className="aspect-[16/9] rounded-xl" imgClassName="transition duration-700 group-hover:scale-[1.04]" />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-card"><Icon name={i.icon} className="h-4 w-4" /></span>
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
      </section>
    </>
  );
}
