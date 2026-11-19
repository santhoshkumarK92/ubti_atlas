import Link from 'next/link';
import type { Industry } from '@/lib/types';
import { Img } from '../ui/Img';
import { Icon } from '../ui/Icon';

export function IndustryCard({ i, count }: { i: Industry; count: number }) {
  return (
    <Link href={`/industries/${i.slug}`} className="group relative block overflow-hidden rounded-md border border-line">
      <Img src={i.imageUrl} alt={i.name} className="aspect-[4/3]" imgClassName="transition duration-700 group-hover:scale-[1.06]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070a16]/90 via-[#070a16]/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
            <Icon name={i.icon} className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold leading-tight">{i.shortName}</span>
        </div>
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px]">{count} {count === 1 ? 'agent' : 'agents'}</span>
      </div>
    </Link>
  );
}
