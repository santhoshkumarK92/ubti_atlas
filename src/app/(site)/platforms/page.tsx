import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { getPlatforms, getVisibleProjects } from '@/lib/repo';
import { PLATFORM_CATEGORIES } from '@/lib/types';
import { LogoRivers } from '@/components/site/LogoRivers';

export const metadata = { title: 'AI on your stack' };

export default async function PlatformsPage() {
  const signedIn = !!(await getUser());
  const [platforms, projects] = await Promise.all([getPlatforms(), getVisibleProjects(signedIn)]);
  const count = (id: string) => projects.filter((p) => p.platformIds.includes(id)).length;
  const cats = PLATFORM_CATEGORIES.filter((c) => platforms.some((p) => p.category === c));

  return (
    <>
      {/* header band */}
      <section data-zone="dark" className="relative overflow-hidden border-b border-ink bg-[#132f6e] text-[#fefffa]">
        <div className="mx-auto grid max-w-frame items-end gap-6 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#a9c8f5]">AI on your stack</div>
            <h1 className="text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.055em]">
              An AI layer on the systems <mark className="bg-transparent text-[#a9c8f5]">you already run.</mark>
            </h1>
          </div>
          <p className="max-w-md text-[16px] leading-7 text-[#fefffa]/85 lg:justify-self-end">
            No rip-and-replace. Pick a category, choose your system, and see how Atlas connects to it and what it adds.
          </p>
        </div>
        <i aria-hidden className="absolute right-0 top-0 h-[clamp(70px,8vw,140px)] w-[clamp(70px,8vw,140px)] rounded-bl-full bg-[#f6c835]" />
      </section>

      <LogoRivers
        categories={cats}
        platforms={platforms.map((p) => ({
          id: p.id, name: p.name, vendor: p.vendor, category: p.category,
          connectVia: p.connectVia, logoUrl: p.logoUrl, agents: count(p.id),
        }))}
      />

      <section className="border-t border-ink">
        <div className="mx-auto flex max-w-frame flex-wrap items-center justify-between gap-6 px-4 py-12 md:px-8">
          <h2 className="max-w-2xl text-[clamp(1.6rem,2.6vw,2.4rem)] font-extrabold leading-tight tracking-[-0.04em]">Don&apos;t see your system? If it has a database, an API or files, we can connect to it.</h2>
          <Link href="/contact" className="btn-dark">Ask about your stack <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
