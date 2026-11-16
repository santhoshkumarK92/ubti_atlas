import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermission } from '@/lib/auth';
import { getPosts } from '@/lib/repo';
import { formatDate } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { createPost } from '../actions';

export default async function PostsAdmin() {
  await requirePermission('posts.edit');
  const posts = await getPosts(undefined, true);
  return (
    <div>
      <PageHead title="Blog & case studies" sub="What the AI team publishes. Case studies can show headline results and link to project pages.">
        <form action={createPost.bind(null, 'case-study')}><button className="btn-dark"><Plus className="h-4 w-4" /> Case study</button></form>
        <form action={createPost.bind(null, 'blog')}><button className="btn-ghost"><Plus className="h-4 w-4" /> Blog post</button></form>
      </PageHead>
      <div className="card divide-y divide-line">
        {posts.map((p) => (
          <Link key={p.id} href={`/admin/posts/${p.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-soft/50">
            <span className="chip w-24 justify-center text-[11px]">{p.type === 'blog' ? 'Blog' : 'Case study'}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{p.title || 'Untitled'}</div>
              <div className="truncate text-xs text-muted">{p.excerpt}</div>
            </div>
            <span className={`text-xs ${p.status === 'published' ? 'text-good' : 'text-muted'}`}>{p.status}{p.publishedAt ? ` · ${formatDate(p.publishedAt)}` : ''}</span>
          </Link>
        ))}
        {!posts.length && <p className="p-8 text-center text-sm text-muted">Nothing yet.</p>}
      </div>
    </div>
  );
}
