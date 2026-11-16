import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries, getVisibleProjects } from '@/lib/repo';
import { PageHead } from '@/components/admin/PageHead';
import { PostEditor } from '@/components/admin/PostEditor';

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('posts.edit');
  const { id } = await params;
  const post = await (await getStore()).get('posts', id);
  if (!post) notFound();
  const [industries, projects] = await Promise.all([getIndustries(), getVisibleProjects(true)]);
  return (
    <div>
      <PageHead title={post.title || (post.type === 'blog' ? 'New blog post' : 'New case study')} />
      <PostEditor post={post} industries={industries} projects={projects} />
    </div>
  );
}
