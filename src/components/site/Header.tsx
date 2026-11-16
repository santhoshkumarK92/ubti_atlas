import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileNav } from './MobileNav';

export const NAV: [string, { href: string; label: string }[]][] = [
  ['Explore', [
    { href: '/', label: 'Home' },
    { href: '/industries', label: 'Industries' },
    { href: '/projects', label: 'All AI agents' },
  ]],
  ['Platform', [
    { href: '/platforms', label: 'AI on your stack' },
    { href: '/case-studies', label: 'Case studies' },
    { href: '/blog', label: 'Blog' },
  ]],
  ['Company', [
    { href: '/about', label: 'About & certifications' },
    { href: '/contact', label: 'Request a demo' },
  ]],
];

export function Header({ signedIn, canAdmin }: { signedIn: boolean; canAdmin: boolean }) {
  return (
    <header className="frame row grid grid-cols-[1fr_auto] md:grid-cols-[1.3fr_1fr_1fr_1fr_1.25fr]">
      <div className="flex items-start p-5 md:p-6">
        <Logo />
      </div>
      {NAV.map(([title, links]) => (
        <nav key={title} className="hidden border-l border-line p-6 md:block" aria-label={title}>
          <ul className="space-y-1.5 text-[13px]">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-muted transition hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ))}
      <div className="flex items-start justify-end gap-2 p-5 md:border-l md:border-line md:p-6">
        <ThemeToggle />
        {canAdmin ? (
          <Link href="/admin" className="btn-ghost btn-sm hidden sm:inline-flex">
            <LayoutDashboard className="h-3.5 w-3.5" /> Admin
          </Link>
        ) : !signedIn ? (
          <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Team sign-in</Link>
        ) : null}
        <Link href="/contact" className="btn-dark btn-sm hidden lg:inline-flex">
          Request a demo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <MobileNav canAdmin={canAdmin} />
      </div>
    </header>
  );
}
