import { getIndustries, getPosts } from '@/lib/repo';
import { PostList } from '@/components/site/PostList';

export const metadata = { title: 'Blog' };

export default async function Blog() {
  const [posts, industries] = await Promise.all([getPosts('blog'), getIndustries()]);
  return (
    <>
      <section className="frame row p-6 md:p-10">
        <div className="eyebrow mb-4">Blog</div>
        <h1 className="h-display text-5xl md:text-7xl">Notes from<br /><span className="text-muted/60">the AI team</span></h1>
      </section>
      <section className="frame row"><PostList posts={posts} base="blog" industries={industries} /></section>
    </>
  );
}
