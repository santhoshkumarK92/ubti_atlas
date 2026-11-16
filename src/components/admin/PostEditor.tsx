'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Eye, Loader2, Save, Trash2, X } from 'lucide-react';
import type { Industry, Post } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { deletePost, savePost } from '@/app/admin/actions';
import { Markdown } from '../ui/Markdown';
import { Uploader } from './Uploader';
import { ChipSelect, Field, MetricsEditor, Notice, TagsInput } from './fields';
import { cn } from '@/lib/utils';

export function PostEditor({ post, industries, projects }: { post: Post; industries: Industry[]; projects: PublicProject[] }) {
  const [p, setP] = useState(post);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Post>(k: K, v: Post[K]) => setP((x) => ({ ...x, [k]: v }));
  const base = p.type === 'blog' ? 'blog' : 'case-studies';

  const save = (status?: Post['status']) =>
    start(async () => {
      const { id, createdAt, updatedAt, publishedAt, ...input } = { ...p, status: status ?? p.status };
      void id; void createdAt; void updatedAt; void publishedAt;
      const r = await savePost(post.id, input);
      if (r.ok) { setP((x) => ({ ...x, slug: r.data!.slug, status: input.status })); setMsg({ kind: 'ok', text: input.status === 'published' ? 'Published' : 'Saved' }); }
      else setMsg({ kind: 'err', text: r.error });
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('chip', p.status === 'published' && 'border-good/40 text-good')}>{p.status}</span>
        <span className="chip">{p.type === 'blog' ? 'Blog post' : 'Case study'}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={`/${base}/${p.slug}`} target="_blank" className="btn-ghost btn-sm"><Eye className="h-3.5 w-3.5" /> Preview</Link>
          <button onClick={() => save()} disabled={pending} className="btn-ghost btn-sm">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
          {p.status === 'published' ? (
            <button onClick={() => save('draft')} disabled={pending} className="btn-ghost btn-sm">Unpublish</button>
          ) : (
            <button onClick={() => save('published')} disabled={pending} className="btn-dark btn-sm">Publish</button>
          )}
        </div>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card space-y-4 p-5">
          <Field label="Title"><input className="input text-base" value={p.title} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Excerpt"><textarea rows={2} className="input" value={p.excerpt} onChange={(e) => set('excerpt', e.target.value)} /></Field>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0">Body (Markdown)</label>
              <div className="flex gap-1">
                <button onClick={() => setPreview(false)} className={cn('chip py-0.5 text-[11px]', !preview && 'chip-on')}>Write</button>
                <button onClick={() => setPreview(true)} className={cn('chip py-0.5 text-[11px]', preview && 'chip-on')}>Preview</button>
              </div>
            </div>
            {preview ? (
              <div className="min-h-[420px] rounded-xl border border-line bg-paper p-5"><Markdown>{p.body || '*Nothing yet*'}</Markdown></div>
            ) : (
              <textarea rows={22} className="input font-mono text-[13px] leading-6" value={p.body} onChange={(e) => set('body', e.target.value)} placeholder={'## The challenge\n\n## What we built\n\n## Results'} />
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="card space-y-4 p-5">
            <Field label="URL slug"><input className="input" value={p.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
            <Field label="Author"><input className="input" value={p.author} onChange={(e) => set('author', e.target.value)} /></Field>
            <Field label="Tags"><TagsInput value={p.tags} onChange={(v) => set('tags', v)} /></Field>
            <Field label="Industry">
              <select className="input" value={p.industryId ?? ''} onChange={(e) => set('industryId', e.target.value || undefined)}>
                <option value="">—</option>
                {industries.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
              </select>
            </Field>
            <Field label="Related projects"><ChipSelect options={projects.map((x) => ({ id: x.id, label: x.title }))} value={p.projectIds} onChange={(v) => set('projectIds', v)} /></Field>
          </div>
          <div className="card space-y-3 p-5">
            <label className="label">Cover image</label>
            {p.cover?.url || p.coverUrl ? (
              <div className="space-y-2">
                <img src={p.cover?.url || p.coverUrl} alt="" className="aspect-[16/9] w-full rounded-lg border border-line object-cover" />
                <button onClick={() => { set('cover', undefined); set('coverUrl', undefined); }} className="btn-ghost btn-sm"><X className="h-3.5 w-3.5" /> Remove</button>
              </div>
            ) : (
              <Uploader compact folder={`posts/${post.id}`} accept="image/*" label="Upload cover" onUploaded={(f) => set('cover', f)} />
            )}
            <Field label="…or image URL"><input className="input" value={p.coverUrl ?? ''} onChange={(e) => set('coverUrl', e.target.value || undefined)} /></Field>
          </div>
          {p.type === 'case-study' && (
            <div className="card space-y-4 p-5">
              <Field label="Client shown as"><input className="input" value={p.clientDisplay ?? ''} onChange={(e) => set('clientDisplay', e.target.value || undefined)} /></Field>
              <Field label="Headline results"><MetricsEditor value={p.results ?? []} onChange={(v) => set('results', v)} /></Field>
            </div>
          )}
          <form action={deletePost.bind(null, post.id)} onSubmit={(e) => { if (!confirm('Delete this post?')) e.preventDefault(); }}>
            <button className="btn-ghost btn-sm text-bad"><Trash2 className="h-3.5 w-3.5" /> Delete post</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
