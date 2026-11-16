import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { can, getUser } from '@/lib/auth';
import { getIndustries, getPlatforms, getPosts, getVisibleProjects } from '@/lib/repo';
import { ProjectExplorer } from '@/components/site/ProjectExplorer';
import { Img } from '@/components/ui/Img';
import { Icon } from '@/components/ui/Icon';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = (await getIndustries()).find((x) => x.slug === slug);
  return { title: i ? `AI for ${i.shortName}` : 'Industry' };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const [industries, platforms, projects, posts] = await Promise.all([getIndustries(), getPlatforms(), getVisibleProjects(!!user), getPosts('case-study')]);
  const industry = industries.find((x) => x.slug === slug);
  if (!industry) notFound();
  const mine = projects.filter((p) => p.industryId === industry.id || p.extraIndustryIds.includes(industry.id));
  const sysCount = new Map<string, number>();
  mine.forEach((p) => p.platformIds.forEach((id) => sysCount.set(id, (sysCount.get(id) ?? 0) + 1)));
  const topSystems = [...sysCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => platforms.find((p) => p.id === id)).filter(Boolean);
  const stories = posts.filter((p) => p.industryId === industry.id);

  return (
    <>
      <section className="frame row grid md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col justify-between p-6 md:p-10">
          <Link href="/industries" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All industries</Link>
          <div className="mt-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-card"><Icon name={industry.icon} className="h-6 w-6" /></span>
            <h1 className="h-display mt-5 text-5xl md:text-7xl">{industry.name}</h1>
            <p className="mt-4 max-w-lg text-muted">{industry.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip chip-on">{mine.length} AI {mine.length === 1 ? 'agent' : 'agents'}</span>
              {can(user?.role, 'internal.view') && mine.length > 0 && (
                <a href={`/api/export/pptx?industry=${industry.id}`} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> Export domain deck</a>
              )}
            </div>
          </div>
        </div>
        <Img src={industry.imageUrl} alt={industry.name} className="min-h-[280px] border-t border-line md:border-l md:border-t-0" />
      </section>

      {topSystems.length > 0 && (
        <section className="frame row flex flex-wrap items-center gap-2 p-4 md:px-6">
          <span className="eyebrow mr-2">Systems we connect to here</span>
          {topSystems.map((p) => (
            <Link key={p!.id} href={`/projects?platform=${p!.id}`} className="chip hover:border-ink/40">{p!.name}</Link>
          ))}
        </section>
      )}

      <section className="frame row">
        <ProjectExplorer projects={mine} industries={industries} platforms={platforms} initial={{ industry: industry.id }} hideIndustry />
      </section>

      {stories.length > 0 && (
        <section className="frame row grid md:grid-cols-[1fr_2fr]">
          <div className="p-6 md:p-10"><h2 className="h-display text-4xl">Case studies</h2></div>
          <div className="border-t border-line md:border-l md:border-t-0">
            {stories.map((s) => (
              <Link key={s.id} href={`/case-studies/${s.slug}`} className="block border-b border-line p-6 last:border-0 hover:bg-card md:p-8">
                <div className="font-display text-2xl font-semibold">{s.title}</div>
                <p className="mt-1 text-sm text-muted">{s.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
