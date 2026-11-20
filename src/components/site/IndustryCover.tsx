import type { Industry } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Img } from '../ui/Img';
import { cn } from '@/lib/utils';

const PALETTE = [
  { bg: '#bdd5e5', fg: '#337cb7' },
  { bg: '#b4d4ce', fg: '#22479b' },
  { bg: '#fae6a1', fg: '#c79a12' },
  { bg: '#f4c9c4', fg: '#dc3f4a' },
  { bg: '#d9d3ec', fg: '#6a5acd' },
  { bg: '#cfe3c3', fg: '#4f8a3a' },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Default project thumbnail: one distinct, on-brand cover per industry (colour, pattern, icon). */
export function IndustryCover({ industry, className }: { industry?: Industry; className?: string }) {
  // Preferred: the industry's own photo under a consistent teal tint, with its icon + name.
  if (industry?.imageUrl) {
    return (
      <div className={cn('relative isolate overflow-hidden bg-[#081a45]', className)} role="img" aria-label={industry.name}>
        <Img src={industry.imageUrl} alt="" className="absolute inset-0 -z-10" imgClassName="transition duration-700 group-hover:scale-[1.05]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081a45]/90 via-[#1a3a82]/40 to-[#1a3a82]/15" />
        <span className="absolute right-0 top-0 h-7 w-7 rounded-bl-full bg-[#f6c835]" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-3 text-[#fefffa]">
          <span className="grid h-8 w-8 shrink-0 place-items-center border border-[#fefffa]/80 bg-white text-[#0c0f14]">
            <Icon name={industry.icon} className="h-4 w-4" />
          </span>
          <span className="truncate text-[12px] font-bold uppercase tracking-[0.14em]">{industry.shortName}</span>
        </div>
      </div>
    );
  }
  const key = industry?.id ?? 'general';
  const h = hash(key);
  const c = PALETTE[h % PALETTE.length]!;
  const pattern = h % 3; // 0 grid · 1 dots · 2 diagonal stripes
  const bgImage =
    pattern === 0
      ? `linear-gradient(${c.fg}22 1px,transparent 1px),linear-gradient(90deg,${c.fg}22 1px,transparent 1px)`
      : pattern === 1
        ? `radial-gradient(${c.fg}40 1.4px,transparent 1.6px)`
        : `repeating-linear-gradient(135deg,${c.fg}18 0 2px,transparent 2px 14px)`;
  const bgSize = pattern === 0 ? '24px 24px' : pattern === 1 ? '16px 16px' : undefined;

  return (
    <div className={cn('relative isolate overflow-hidden', className)} style={{ background: c.bg }} role="img" aria-label={industry?.name ?? 'AI agent'}>
      <div className="absolute inset-0 -z-10" style={{ backgroundImage: bgImage, backgroundSize: bgSize }} />
      {/* flat geometric accents */}
      <span className="absolute -right-6 -top-6 h-28 w-28 rounded-full" style={{ background: c.fg, opacity: 0.22 }} />
      <span className="absolute -bottom-5 left-8 h-16 w-16 rounded-t-full" style={{ background: c.fg, opacity: 0.3 }} />
      <span className="absolute bottom-3 right-5 h-5 w-5" style={{ background: c.fg }} />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-[4.25rem] w-[4.25rem] place-items-center border-2 border-[#0c0f14] bg-white text-[#0c0f14] shadow-[4px_4px_0_0_#0c0f14]">
          <Icon name={industry?.icon} className="h-8 w-8" />
        </span>
      </div>
    </div>
  );
}
