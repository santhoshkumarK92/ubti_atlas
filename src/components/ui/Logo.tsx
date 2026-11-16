import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-7 w-7', className)} aria-hidden>
      <defs>
        <linearGradient id="atlas-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--violet))" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" className="fill-ink" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="url(#atlas-g)" strokeWidth="4" />
      <path d="M15 32h34M32 15c6 5 6 29 0 34M32 15c-6 5-6 29 0 34" fill="none" stroke="url(#atlas-g)" strokeWidth="2.5" />
    </svg>
  );
}

export function Logo({ href = '/', name = 'UBTI', product = 'AI Atlas' }: { href?: string; name?: string; product?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="font-display text-[19px] font-bold tracking-tight">{name}</span>
        <span className="font-display text-[19px] font-medium text-muted group-hover:text-ink">{product}</span>
      </span>
    </Link>
  );
}
