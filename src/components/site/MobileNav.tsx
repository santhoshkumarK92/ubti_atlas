'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  ['/', 'Home'], ['/industries', 'Industries'], ['/projects', 'All AI agents'], ['/platforms', 'AI on your stack'],
  ['/case-studies', 'Case studies'], ['/blog', 'Blog'], ['/about', 'About & certifications'], ['/contact', 'Request a demo'],
];

export function MobileNav({ canAdmin }: { canAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button aria-label="Menu" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card">
        <Menu className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-paper p-6 animate-fade-up">
          <button aria-label="Close" onClick={() => setOpen(false)} className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-line">
            <X className="h-4 w-4" />
          </button>
          <ul className="mt-14 space-y-1">
            {[...LINKS, ...(canAdmin ? [['/admin', 'Admin']] : [['/login', 'Team sign-in']])].map(([href, label]) => (
              <li key={href}>
                <Link onClick={() => setOpen(false)} href={href!} className="block border-b border-line py-3 font-display text-3xl font-semibold">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
