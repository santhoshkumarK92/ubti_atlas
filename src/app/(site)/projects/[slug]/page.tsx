import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, PencilLine } from 'lucide-react';
import { can, getUser } from '@/lib/auth';
import { getIndustries, getPlatforms, getProjectBySlug, getVisibleProjects } from '@/lib/repo';
import { ProjectDetail } from '@/components/site/ProjectDetail';
import { ProjectCard } from '@/components/site/ProjectCard';
import { LeadForm } from '@/components/site/LeadForm';
import { DemoBadge } from '@/components/site/DemoBadge';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug, true);
  return { title: p?.title ?? 'Project', description: p?.tagline };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const p = await getProjectBySlug(slug, !!user);
  if (!p) notFound();
  const [industries, platforms, all] = await Promise.all([getIndustries(), getPlatforms(), getVisibleProjects(!!user)]);
  const industry = industries.find((i) => i.id === p.industryId);
  const related = all.filter((x) => x.id !== p.id && (x.industryId === p.industryId || x.extraIndustryIds.includes(p.industryId))).slice(0, 3);
  const hasVideo = !!(p.media.video || p.media.videoEmbedUrl);

  return (
    <>
      {p.status !== 'published' && (
        <div className="frame row bg-warn/10 px-6 py-2 text-center text-sm text-warn">Preview — this project is <b>{p.status}</b> and only visible to signed-in staff.</div>
      )}
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <Link href={industry ? `/industries/${industry.slug}` : '/projects'} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {industry?.name ?? 'All agents'}
          </Link>
          <h1 className="h-display mt-8 text-5xl md:text-7xl">{p.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{p.tagline}</p>
        </div>
        <div className="flex flex-col justify-end gap-4 border-t border-line p-6 md:border-l md:border-t-0 md:p-8">
          <div className="flex flex-wrap gap-1.5">
            {p.isSample && <span className="chip">Sample content</span>}
            {p.visibility !== 'public' && <span className="chip border-warn/40 text-warn">{p.visibility === 'internal' ? 'Internal only' : 'Client links only'}</span>}
            <DemoBadge url={p.demoUrl} status={p.demoStatus} hasVideo={hasVideo} />
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted">Client</dt><dd className="font-medium">{user ? p.clientName || p.clientDisplay || '—' : p.clientDisplay}</dd></div>
            {user && p.clientName && p.clientDisplay && p.clientDisplay !== p.clientName && <div><dt className="text-xs text-muted">Shown to clients as</dt><dd className="font-medium">{p.clientDisplay}</dd></div>}
          </dl>
          <div className="flex flex-wrap gap-2">
            <a href="#request" className="btn-dark">Request this agent</a>
            {can(user?.role, 'internal.view') && <a href={`/api/export/pptx?project=${p.id}`} className="btn-ghost"><Download className="h-4 w-4" /> PPT</a>}
            {can(user?.role, 'projects.edit') && <Link href={`/admin/projects/${p.id}`} className="btn-ghost"><PencilLine className="h-4 w-4" /> Edit</Link>}
          </div>
        </div>
      </section>

      <div className="frame">
        <ProjectDetail p={p} industry={industry} platforms={platforms} />
      </div>

      {related.length > 0 && (
        <section className="frame row">
          <div className="border-b border-line p-6 md:px-10"><h2 className="h-display text-3xl">More for {industry?.shortName ?? 'this industry'}</h2></div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
            {related.map((r) => <ProjectCard key={r.id} p={r} industry={industries.find((i) => i.id === r.industryId)} />)}
          </div>
        </section>
      )}

      <section id="request" className="frame row grid scroll-mt-4 md:grid-cols-[1fr_2fr]">
        <div className="p-6 md:p-10">
          <h2 className="h-display text-4xl">Want this for your business?</h2>
          <p className="mt-3 text-sm text-muted">Tell us about your systems and we&apos;ll show you how this agent adapts to them.</p>
        </div>
        <div className="border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <LeadForm source={`project:${p.slug}`} industries={industries} />
        </div>
      </section>
    </>
  );
}
