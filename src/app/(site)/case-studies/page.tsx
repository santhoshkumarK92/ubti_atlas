import { getIndustries, getPosts } from '@/lib/repo';
import { PostList } from '@/components/site/PostList';

export const metadata = { title: 'Case studies' };

export default async function CaseStudies() {
  const [posts, industries] = await Promise.all([getPosts('case-study'), getIndustries()]);
  return (
    <>
      <section className="frame row p-6 md:p-10">
        <div className="eyebrow mb-4">Case studies</div>
        <h1 className="h-display text-5xl md:text-7xl">Results our clients<br /><span className="text-muted/60">can measure</span></h1>
      </section>
      <section className="frame row"><PostList posts={posts} base="case-studies" industries={industries} /></section>
    </>
  );
}
