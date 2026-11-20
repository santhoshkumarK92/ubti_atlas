import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Industry, Post } from '@/lib/types';
import { Img } from '../ui/Img';
import { formatDate, readingMinutes } from '@/lib/utils';

export function PostList({ posts, base, industries }: { posts: Post[]; base: 'blog' | 'case-studies'; industries: Industry[] }) {
  if (!posts.length) return <p className="p-10 text-center text-muted">Nothing published yet.</p>;
  if (base === 'blog') return <BlogEditorial posts={posts} />;
  const [first, ...rest] = posts;
  return (
    <>
      <Link href={`/${base}/${first!.slug}`} className="group grid border-b border-ink md:grid-cols-[1.2fr_1fr]">
        <Img src={first!.cover?.url || first!.coverUrl || industries.find((i) => i.id === first!.industryId)?.imageUrl} alt={first!.title} fallbackLabel={first!.title} className="min-h-[260px]" />
        <div className="flex flex-col justify-end border-t border-ink p-6 md:border-l md:border-t-0 md:p-10">
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
      <div className="grid gap-px bg-[#0c0f14]/40 md:grid-cols-3">
        {rest.map((p) => (
          <Link key={p.id} href={`/${base}/${p.slug}`} className="group bg-[#f4f7fc] p-6 transition-colors hover:bg-white dark:bg-card md:p-8">
            {(p.cover?.url || p.coverUrl) && <Img src={p.cover?.url || p.coverUrl} alt={p.title} className="mb-5 aspect-[16/9] rounded-sm" />}
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

const TINTS = ['#a9c8f5', '#fae6a1', '#f4c9c4', '#d9d3ec'];

/** First ~N characters of the post as plain text (markdown stripped), cut at a word with an ellipsis. */
function previewOf(body: string, max = 230) {
  const t = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/** Image-free blog layout: a grid of cards — start of the post, an ellipsis, then a Read more button. */
function BlogEditorial({ posts }: { posts: Post[] }) {
  return (
    <div className="grid gap-5 p-4 sm:grid-cols-2 md:p-8 lg:grid-cols-3">
      {posts.map((p, i) => (
        <article
          key={p.id}
          style={{ ['--tint' as string]: TINTS[i % TINTS.length] }}
          className="group flex flex-col border border-[#0c0f14]/30 bg-[#ffffff] text-[#0c0f14] transition hover:-translate-y-1 hover:border-[#0c0f14] hover:shadow-[4px_4px_0_0_rgba(12,15,20,.85)]"
        >
          <div className="h-1.5 bg-[var(--tint)]" />
          <div className="flex flex-1 flex-col p-6">
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#22479b]">
              {i === 0 && <span className="bg-[#0c0f14] px-1.5 py-0.5 text-[#fefffa]">Latest</span>}
              <span>{formatDate(p.publishedAt)} · {readingMinutes(p.body)} min read</span>
            </div>
            <h3 className="mt-3 text-[1.2rem] font-bold leading-[1.2] tracking-[-0.025em]">{p.title}</h3>
            <p className="mt-3 text-[14px] leading-6 text-[#0c0f14]/70">{previewOf(p.body)}</p>
            {p.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.slice(0, 3).map((t) => <span key={t} className="border border-[#0c0f14]/25 px-2 py-0.5 text-[11px] font-medium text-[#0c0f14]/75">{t}</span>)}
              </div>
            )}
            <div className="mt-auto pt-6">
              <Link href={`/blog/${p.slug}`} className="inline-flex items-center gap-1.5 border border-[#0c0f14] bg-[#0c0f14] px-4 py-2 text-[13px] font-semibold text-[#fefffa] transition hover:bg-transparent hover:text-[#0c0f14]">
                Read more <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
