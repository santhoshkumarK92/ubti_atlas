import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { Logo } from '../ui/Logo';
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

export function Header({ signedIn, canAdmin }: { signedIn: boolean; canAdmin: boolean }) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <div className="mx-auto flex max-w-frame items-center justify-between gap-4 rounded-full border border-line bg-card/80 py-2.5 pl-5 pr-3 shadow-[0_8px_30px_-12px_rgb(var(--ink)/.25)] backdrop-blur-xl">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] text-muted transition hover:bg-soft hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {canAdmin ? (
            <Link href="/admin" className="btn-dark btn-sm hidden sm:inline-flex">
              <LayoutDashboard className="h-3.5 w-3.5" /> Admin
            </Link>
          ) : !signedIn ? (
            <Link href="/login" className="btn-dark btn-sm hidden sm:inline-flex">Team sign-in</Link>
          ) : null}
          <MobileNav canAdmin={canAdmin} />
        </div>
      </div>
    </header>
  );
}
