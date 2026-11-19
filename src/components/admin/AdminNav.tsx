'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, Building, FileText, Globe, Inbox, LayoutDashboard, Layers, Presentation, Server, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = { LayoutDashboard, Layers, Presentation, FileText, Inbox, Globe, Server, Award, Building, Users };
export type NavIcon = keyof typeof ICONS;
export interface NavItem { href: string; label: string; icon: NavIcon }

export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const isActive = (href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(href + '/'));
  return (
    <nav className="scrollbar-none mt-5 flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Admin">
      {items.map((n) => {
        const Icon = ICONS[n.icon];
        const on = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'group relative flex shrink-0 items-center gap-3 rounded-sm px-2.5 py-2 text-sm font-medium transition',
              on ? 'bg-card text-ink shadow-[0_6px_18px_-10px_rgb(var(--ink)/.45)] ring-1 ring-white/70 dark:ring-line' : 'text-muted hover:bg-card/60 hover:text-ink',
            )}
          >
            {on && <span className="absolute -left-4 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-accent to-violet md:block" />}
            <span
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition',
                on ? 'bg-gradient-to-br from-accent to-violet text-white shadow-sm' : 'bg-card text-muted group-hover:text-accent',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
