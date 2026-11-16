import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getIndustries, getPostBySlug, getVisibleProjects } from '@/lib/repo';
import { PostView } from '@/components/site/PostView';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPostBySlug('blog', (await params).slug, true);
  return { title: p?.title ?? 'Blog', description: p?.excerpt };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const signedIn = !!(await getUser());
  const post = await getPostBySlug('blog', slug, signedIn);
  if (!post) notFound();
  const [industries, projects] = await Promise.all([getIndustries(), getVisibleProjects(signedIn)]);
  return <PostView post={post} industries={industries} projects={projects.filter((p) => post.projectIds.includes(p.id))} />;
}
