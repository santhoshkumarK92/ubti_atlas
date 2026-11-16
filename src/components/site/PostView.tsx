import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Industry, Post } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { Markdown } from '../ui/Markdown';
import { Img } from '../ui/Img';
import { ProjectCard } from './ProjectCard';
import { formatDate, readingMinutes } from '@/lib/utils';

export function PostView({ post, industries, projects }: { post: Post; industries: Industry[]; projects: PublicProject[] }) {
  const base = post.type === 'blog' ? 'blog' : 'case-studies';
  const industry = industries.find((i) => i.id === post.industryId);
  const cover = post.cover?.url || post.coverUrl;
  return (
    <>
      <section className="frame row grid md:grid-cols-[2fr_1fr]">
        <div className="p-6 md:p-10">
          <Link href={`/${base}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> {post.type === 'blog' ? 'Blog' : 'Case studies'}</Link>
          <h1 className="h-display mt-8 text-4xl md:text-6xl">{post.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{post.excerpt}</p>
        </div>
        <div className="flex flex-col justify-end gap-3 border-t border-line p-6 text-sm md:border-l md:border-t-0 md:p-8">
          {post.status !== 'published' && <span className="chip self-start border-warn/40 text-warn">Draft preview</span>}
          <div><span className="text-muted">By</span> {post.author}</div>
          <div className="text-muted">{formatDate(post.publishedAt)} · {readingMinutes(post.body)} min read</div>
          {post.clientDisplay && <div><span className="text-muted">Client:</span> {post.clientDisplay}</div>}
          {industry && <Link href={`/industries/${industry.slug}`} className="chip self-start">{industry.shortName}</Link>}
          <div className="flex flex-wrap gap-1.5">{post.tags.map((t) => <span key={t} className="chip text-[11px]">{t}</span>)}</div>
        </div>
      </section>
      {cover && <section className="frame row"><Img src={cover} alt={post.title} className="max-h-[520px] min-h-[240px]" /></section>}
      {post.results?.length ? (
        <section className="frame row grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {post.results.map((r) => (
            <div key={r.label} className="bg-paper p-6 md:p-8"><div className="h-display text-5xl">{r.value}</div><div className="mt-2 text-sm text-muted">{r.label}</div></div>
          ))}
        </section>
      ) : null}
      <section className="frame row grid md:grid-cols-[1fr_2.2fr_1fr]">
        <div className="hidden md:block" />
        <article className="p-6 md:border-x md:border-line md:p-10"><Markdown>{post.body}</Markdown></article>
        <div className="hidden md:block" />
      </section>
      {projects.length > 0 && (
        <section className="frame row">
          <div className="border-b border-line p-6 md:px-10"><h2 className="h-display text-3xl">Agents in this story</h2></div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} p={p} industry={industries.find((i) => i.id === p.industryId)} />)}
          </div>
        </section>
      )}
    </>
  );
}
