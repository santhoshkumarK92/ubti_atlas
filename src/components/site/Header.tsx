import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileNav } from './MobileNav';

export const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/industries', label: 'Industries' },
  { href: '/projects', label: 'All AI agents' },
  { href: '/platforms', label: 'AI on your stack' },
  { href: '/case-studies', label: 'Case studies' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About & certifications' },
];

/** Flat, full-width bar: wordmark left, plain text links, one solid button right. */
export function Header({ signedIn, canAdmin }: { signedIn: boolean; canAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-paper">
      <div className="mx-auto flex h-[72px] max-w-frame items-center justify-between gap-6 px-4 md:px-8">
        <Link href="/" aria-label="UBTI AI Atlas home" className="font-display text-[26px] font-extrabold tracking-[-0.06em] text-ink">
          UBTI AI Atlas
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV_LINKS.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-[15px] font-semibold text-ink underline-offset-[10px] decoration-2 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {canAdmin ? (
            <Link href="/admin" className="hidden items-center gap-1.5 text-[15px] font-semibold hover:underline sm:inline-flex">
              <LayoutDashboard className="h-4 w-4" /> Admin
            </Link>
          ) : !signedIn ? (
            <Link href="/login" className="hidden text-[15px] font-semibold hover:underline sm:inline">Team sign-in</Link>
          ) : null}
          <Link href="/contact" className="btn-dark hidden sm:inline-flex">Request a demo</Link>
          <MobileNav canAdmin={canAdmin} />
        </div>
      </div>
    </header>
  );
}
