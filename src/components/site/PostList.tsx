import Link from 'next/link';
import type { Industry, Post } from '@/lib/types';
import { Img } from '../ui/Img';
import { formatDate, readingMinutes } from '@/lib/utils';

export function PostList({ posts, base, industries }: { posts: Post[]; base: 'blog' | 'case-studies'; industries: Industry[] }) {
  if (!posts.length) return <p className="p-10 text-center text-muted">Nothing published yet.</p>;
  const [first, ...rest] = posts;
  return (
    <>
      <Link href={`/${base}/${first!.slug}`} className="row group grid md:grid-cols-[1.2fr_1fr]">
        <Img src={first!.cover?.url || first!.coverUrl || industries.find((i) => i.id === first!.industryId)?.imageUrl} alt={first!.title} fallbackLabel={first!.title} className="min-h-[260px]" />
        <div className="flex flex-col justify-end border-t border-line p-6 md:border-l md:border-t-0 md:p-10">
          <div className="eyebrow">{formatDate(first!.publishedAt)} · {readingMinutes(first!.body)} min read</div>
          <h2 className="h-display mt-3 text-4xl group-hover:underline md:text-5xl">{first!.title}</h2>
          <p className="mt-3 text-muted">{first!.excerpt}</p>
          {first!.results?.length ? (
            <div className="mt-5 flex flex-wrap gap-5">
              {first!.results.map((r) => <div key={r.label}><div className="h-display text-3xl">{r.value}</div><div className="text-xs text-muted">{r.label}</div></div>)}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="grid gap-px bg-line md:grid-cols-3">
        {rest.map((p) => (
          <Link key={p.id} href={`/${base}/${p.slug}`} className="group bg-paper p-6 md:p-8">
            {(p.cover?.url || p.coverUrl) && <Img src={p.cover?.url || p.coverUrl} alt={p.title} className="mb-5 aspect-[16/9] rounded-xl" />}
            <div className="eyebrow">{formatDate(p.publishedAt)} · {readingMinutes(p.body)} min</div>
            <h3 className="mt-3 font-display text-2xl font-semibold leading-tight group-hover:underline">{p.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted">{p.excerpt}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{p.tags.slice(0, 3).map((t) => <span key={t} className="chip text-[11px]">{t}</span>)}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
