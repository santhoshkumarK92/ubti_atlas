import Link from 'next/link';
import { NAV_LINKS } from './Header';

export function Footer() {
  return (
    <footer data-zone="dark" className="bg-[#0c0f14] text-[#fefffa]">
      <div className="mx-auto grid max-w-frame gap-10 px-4 py-14 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl font-bold tracking-tight">UBTI AI Atlas</div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#fefffa]/65">How your business work evolves matters. Industry-specific AI agents on the Microsoft stack.</p>
        </div>
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f6c835]">Explore</div>
          <ul className="space-y-2 text-sm text-[#fefffa]/80">
            {NAV_LINKS.slice(1).map((l) => <li key={l.href}><Link href={l.href} className="hover:text-white hover:underline">{l.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f6c835]">Get started</div>
          <ul className="space-y-2 text-sm text-[#fefffa]/80">
            <li><Link href="/contact" className="hover:text-white hover:underline">Request a demo</Link></li>
            <li><Link href="/login" className="hover:text-white hover:underline">Team sign-in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#fefffa]/15 px-4 py-5 text-center text-xs text-[#fefffa]/55">© {new Date().getFullYear()} UBTI · Internal portfolio</div>
    </footer>
  );
}
