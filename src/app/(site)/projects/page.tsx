import { getUser } from '@/lib/auth';
import { getIndustries, getPlatforms, getVisibleProjects } from '@/lib/repo';
import { ProjectExplorer } from '@/components/site/ProjectExplorer';

export const metadata = { title: 'All AI agents' };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ industry?: string; platform?: string; q?: string }> }) {
  const sp = await searchParams;
  const signedIn = !!(await getUser());
  const [industries, platforms, projects] = await Promise.all([getIndustries(), getPlatforms(), getVisibleProjects(signedIn)]);
  return (
    <>
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-4">The portfolio</div>
          <h1 className="h-display text-5xl md:text-7xl">Ready-to-deploy<br /><span className="text-muted/60">AI agents</span></h1>
        </div>
        <div className="flex items-end border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <p className="text-sm leading-6 text-muted">Every use case our AI team has built — filter by industry, by the system it runs on, by maturity, or by whether there&apos;s a live demo or recording.</p>
        </div>
      </section>
      <section className="frame row">
        <ProjectExplorer projects={projects} industries={industries} platforms={platforms} initial={sp} />
      </section>
    </>
  );
}
