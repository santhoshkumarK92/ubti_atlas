import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MobileNav } from './MobileNav';
import { HeaderTone } from './HeaderTone';

export const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/industries', label: 'Industries' },
  { href: '/projects', label: 'All AI agents' },
  { href: '/platforms', label: 'AI on your stack' },
  { href: '/case-studies', label: 'Case studies' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About & certifications' },
];

/** Fully transparent bar: it shows whatever is behind it, and the glass pills flip light/dark to stay readable as you scroll.
 *  Wordmark left · link pills centred · sign-in + theme toggle right. */
export function Header({ signedIn, canAdmin }: { signedIn: boolean; canAdmin: boolean }) {
  const pill = 'hd-pill inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13.5px] font-semibold';
  return (
    <header data-hd data-tone="dark" className="sticky top-0 z-40 backdrop-blur-[6px]">
      <HeaderTone />
      <div className="relative mx-auto grid h-[72px] max-w-frame grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4 md:px-8">
        <Link href="/" aria-label="UBTI AI Atlas home" className="hd-word self-center font-display text-[24px] font-extrabold tracking-[-0.06em]">
          UBTI AI Atlas
        </Link>
        <nav className="hd-pill hd-bar hidden h-[52px] items-center gap-0.5 self-center rounded-full px-3 xl:flex" aria-label="Main">
          {NAV_LINKS.slice(1).map((l) => (
            <Link key={l.href} href={l.href} className="hd-link whitespace-nowrap rounded-full px-3 py-2 text-[13.5px] font-semibold">{l.label}</Link>
          ))}
        </nav>
        <div className="col-start-3 flex items-center justify-end gap-2.5 self-center">
          {canAdmin ? (
            <Link href="/admin" className={`${pill} hidden px-4 sm:inline-flex`}><LayoutDashboard className="h-4 w-4" /> Admin</Link>
          ) : !signedIn ? (
            <Link href="/login" className={`${pill} hidden px-4 sm:inline-flex`}>Team sign-in</Link>
          ) : null}
          <ThemeToggle className="hd-pill grid h-9 w-9 place-items-center rounded-full" />
          <MobileNav canAdmin={canAdmin} />
        </div>
      </div>
    </header>
  );
}
