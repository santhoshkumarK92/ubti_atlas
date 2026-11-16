import Link from 'next/link';
import type { CompanySettings, Industry } from '@/lib/types';
import { Logo } from '../ui/Logo';

export function Footer({ company, industries }: { company: CompanySettings; industries: Industry[] }) {
  return (
    <footer className="frame grid border-b md:grid-cols-[1.3fr_2fr_1fr]">
      <div className="p-6 md:p-8">
        <Logo />
        <p className="mt-4 max-w-xs text-sm text-muted">{company.tagline}</p>
        <p className="mt-6 text-xs text-muted">{company.partnerLine}</p>
      </div>
      <div className="border-t border-line p-6 md:border-l md:border-t-0 md:p-8">
        <div className="eyebrow mb-3">Industries</div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
          {industries.map((i) => (
            <li key={i.id}>
              <Link href={`/industries/${i.slug}`} className="text-muted hover:text-ink">{i.shortName}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-line p-6 text-sm md:border-l md:border-t-0 md:p-8">
        <div className="eyebrow mb-3">Company</div>
        <ul className="space-y-1.5">
          <li><Link className="text-muted hover:text-ink" href="/about">About & certifications</Link></li>
          <li><Link className="text-muted hover:text-ink" href="/case-studies">Case studies</Link></li>
          <li><Link className="text-muted hover:text-ink" href="/blog">Blog</Link></li>
          <li><Link className="text-muted hover:text-ink" href="/contact">Contact</Link></li>
          {company.website && <li><a className="text-muted hover:text-ink" href={company.website} target="_blank" rel="noreferrer">{company.website.replace(/^https?:\/\//, '')}</a></li>}
        </ul>
        <p className="mt-6 text-xs text-muted">© {new Date().getFullYear()} {company.name}. Internal portfolio.</p>
      </div>
    </footer>
  );
}
