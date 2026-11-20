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
      <section className="mx-auto mb-6 mt-3 w-full max-w-frame px-3 md:px-6">
        <div className="relative overflow-hidden rounded-md border border-line bg-gradient-to-br from-[#f8faff] via-[#f1f5fc] to-[#e6eefb] dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27]">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative p-6 md:p-10">
            <div className="eyebrow mb-4">The portfolio</div>
            <h1 className="h-display text-5xl md:text-7xl">Ready-to-deploy<br /><span className="text-muted/60">AI agents</span></h1>
          </div>
          <div className="relative">
            <ProjectExplorer projects={projects} industries={industries} platforms={platforms} initial={sp} />
          </div>
        </div>
      </section>
    </>
  );
}
