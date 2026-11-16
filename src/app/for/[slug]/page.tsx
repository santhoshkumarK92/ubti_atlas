import { notFound } from 'next/navigation';
import { ArrowDown, Download } from 'lucide-react';
import { can, getUser } from '@/lib/auth';
import { forViewer, getCompany, getIndustries, getPitchBySlug, getPlatforms, getProjectsByIds } from '@/lib/repo';
import { ProjectDetail } from '@/components/site/ProjectDetail';
import { MicrositeTracker } from '@/components/site/MicrositeTracker';
import { LeadForm } from '@/components/site/LeadForm';
import { Logo } from '@/components/ui/Logo';
import { Img } from '@/components/ui/Img';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Silk } from '@/components/site/Silk';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const pitch = await getPitchBySlug((await params).slug);
  return { title: pitch ? `Prepared for ${pitch.clientName}` : 'UBTI AI Atlas', robots: { index: false, follow: false } };
}

/** Client Mode microsite — only the projects chosen for this client, reframed for them. */
export default async function Microsite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pitch = await getPitchBySlug(slug);
  if (!pitch) notFound();
  const user = await getUser();
  const expired = pitch.status !== 'active' || (pitch.expiresAt && new Date(pitch.expiresAt) < new Date());
  const [company, industries, platforms, raw] = await Promise.all([getCompany(), getIndustries(), getPlatforms(), getProjectsByIds(pitch.projectIds)]);

  if (expired && !user) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div><Logo /><h1 className="h-display mt-8 text-5xl">This link has expired</h1><p className="mt-3 text-muted">Please ask your UBTI contact for an updated link.</p></div>
      </div>
    );
  }

  // Never show internal-only or unpublished projects on a client link; never show real client names.
  const projects = raw.filter((p) => p.status === 'published' && p.visibility !== 'internal').map((p) => forViewer(p, false));
  const industry = industries.find((i) => i.id === pitch.industryId);

  return (
    <div className="min-h-screen">
      {!user && <MicrositeTracker slug={pitch.slug} />}
      {user && (
        <div className="bg-ink px-4 py-2 text-center text-xs text-paper">
          Staff preview — your visits are not counted. {expired && <b>This link is archived/expired for clients.</b>}{' '}
          {can(user.role, 'pitches.view') && <a className="underline" href={`/admin/pitches/${pitch.id}`}>Open analytics</a>}
        </div>
      )}
      <header className="frame row flex items-center justify-between gap-4 p-5 md:px-8">
        <div className="flex items-center gap-4">
          <Logo href={`/for/${pitch.slug}`} />
          {pitch.clientLogo && (
            <>
              <span className="text-muted">×</span>
              <Img src={pitch.clientLogo.url} alt={pitch.clientName} className="h-9 w-24 bg-transparent" imgClassName="object-contain" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <a href={`/api/export/pptx?pitch=${pitch.id}`} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> PPT</a>}
          <a href="#talk" className="btn-dark btn-sm">Let&apos;s talk</a>
        </div>
      </header>

      <section className="frame row grid md:grid-cols-[1.6fr_1fr]">
        <div className="p-6 md:p-10">
          <div className="eyebrow mb-4">Prepared for {pitch.clientName}</div>
          <h1 className="h-display text-5xl md:text-7xl">{industry ? <>AI agents for<br /><span className="text-muted/60">{industry.shortName.toLowerCase()}</span></> : company.tagline}</h1>
          <p className="mt-5 max-w-xl text-muted">{pitch.intro}</p>
          <a href="#agents" className="btn-ghost mt-6">See the {projects.length} agents <ArrowDown className="h-4 w-4" /></a>
        </div>
        <div className="relative min-h-[260px] border-t border-line md:border-l md:border-t-0">
          <Silk labels={platforms.filter((x) => projects.some((p) => p.platformIds.includes(x.id))).slice(0, 6).map((x) => x.name)} />
        </div>
      </section>

      <nav id="agents" className="frame row scrollbar-none flex gap-2 overflow-x-auto p-4 md:px-8">
        {projects.map((p, i) => <a key={p.id} href={`#p-${p.slug}`} className="chip shrink-0">{String(i + 1).padStart(2, '0')} · {p.title}</a>)}
      </nav>

      {projects.map((p, i) => (
        <section key={p.id} id={`p-${p.slug}`} data-project-id={p.id} className="frame scroll-mt-4">
          <div className="row grid md:grid-cols-[auto_1fr]">
            <div className="p-6 md:border-r md:border-line md:p-10"><span className="h-display text-6xl text-muted/40">{String(i + 1).padStart(2, '0')}</span></div>
            <div className="border-t border-line p-6 md:border-t-0 md:p-10">
              <div className="eyebrow">{industries.find((x) => x.id === p.industryId)?.shortName}</div>
              <h2 className="h-display mt-2 text-4xl md:text-5xl">{p.title}</h2>
              <p className="mt-3 max-w-3xl text-lg text-muted">{pitch.reframes[p.id] || p.tagline}</p>
            </div>
          </div>
          <ProjectDetail p={p} industry={industries.find((x) => x.id === p.industryId)} platforms={platforms} linkPlatforms={false} trackId={p.id} />
        </section>
      ))}

      <section id="talk" className="frame row grid scroll-mt-4 md:grid-cols-[1fr_1.5fr]">
        <div className="bg-ink p-6 text-paper md:p-10">
          <h2 className="h-display text-4xl md:text-5xl">Skip the months of development.</h2>
          <p className="mt-3 text-paper/70">{company.pitchLine}</p>
          <p className="mt-8 text-sm text-paper/60">{company.partnerLine}{company.website ? ` · ${company.website.replace(/^https?:\/\//, '')}` : ''}</p>
        </div>
        <div className="p-6 md:p-10">
          <LeadForm source={`microsite:${pitch.slug}`} compact cta="Book a working session" />
        </div>
      </section>
      <footer className="frame row p-5 text-center text-xs text-muted md:px-8">Confidential — prepared by {company.name} for {pitch.clientName}.</footer>
    </div>
  );
}
