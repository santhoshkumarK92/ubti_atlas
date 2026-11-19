'use client';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Industry, Platform } from '@/lib/types';
import { MATURITY } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { ProjectCard } from './ProjectCard';
import { cn } from '@/lib/utils';

const F = 'input border-line bg-white/40 placeholder:text-muted  ';

export function ProjectExplorer({
  projects, industries, platforms, initial = {}, hideIndustry,
}: {
  projects: PublicProject[];
  industries: Industry[];
  platforms: Platform[];
  initial?: { industry?: string; platform?: string; q?: string };
  hideIndustry?: boolean;
}) {
  const [q, setQ] = useState(initial.q ?? '');
  const [industry, setIndustry] = useState(initial.industry ?? '');
  const [platform, setPlatform] = useState(initial.platform ?? '');
  const [maturity, setMaturity] = useState('');

  const usedPlatforms = useMemo(() => platforms.filter((p) => projects.some((x) => x.platformIds.includes(p.id))), [platforms, projects]);

  const list = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter((p) => {
      if (industry && p.industryId !== industry && !p.extraIndustryIds.includes(industry)) return false;
      if (platform && !p.platformIds.includes(platform)) return false;
      if (maturity && p.maturity !== maturity) return false;
      if (terms.length) {
        const hay = [p.title, p.tagline, p.solution, p.problem, p.techStack.join(' '), p.features.join(' ')].join(' ').toLowerCase();
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
  }, [projects, q, industry, platform, maturity]);

  const active = [industry, platform, maturity, q].filter(Boolean).length;

  return (
    <div>
      <div className="grid gap-3 p-4 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:p-6">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents — e.g. invoice OCR, voice, SAP…" className={`${F} pl-10`} />
        </label>
        {!hideIndustry && (
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={F}>
            <option value="">All industries</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
          </select>
        )}
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={F}>
          <option value="">Any system</option>
          {usedPlatforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={maturity} onChange={(e) => setMaturity(e.target.value)} className={F}>
          <option value="">Any maturity</option>
          {Object.entries(MATURITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between px-4 pt-5 text-sm text-muted md:px-6">
        <span>{list.length} {list.length === 1 ? 'agent' : 'agents'}</span>
        {active > 0 && (
          <button onClick={() => { setQ(''); setIndustry(hideIndustry ? industry : ''); setPlatform(''); setMaturity(''); }} className="inline-flex items-center gap-1 hover:text-ink">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-4">
        {list.map((p) => (
          <ProjectCard compact key={p.id} p={p} industry={industries.find((i) => i.id === p.industryId)} />
        ))}
        {!list.length && <p className="col-span-full py-16 text-center text-muted">No agents match these filters yet.</p>}
      </div>
    </div>
  );
}
