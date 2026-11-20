import { getIndustries, getPosts } from '@/lib/repo';
import { PostList } from '@/components/site/PostList';

export const metadata = { title: 'Case studies' };

export default async function CaseStudies() {
  const [posts, industries] = await Promise.all([getPosts('case-study'), getIndustries()]);
  return (
    <>
      <section data-zone="dark" className="relative overflow-hidden border-b border-ink bg-[#132f6e] text-[#fefffa]">
        <div className="mx-auto max-w-frame px-4 py-14 md:px-8 md:py-20">
          <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[#a9c8f5]">Case studies</div>
          <h1 className="text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.055em]">
            Results our clients <mark className="bg-transparent text-[#a9c8f5]">can measure.</mark>
          </h1>
        </div>
        <i aria-hidden className="absolute right-0 top-0 h-[clamp(70px,8vw,140px)] w-[clamp(70px,8vw,140px)] rounded-bl-full bg-[#f6c835]" />
      </section>
      <section className="border-b border-ink bg-[#e6eefb] dark:bg-card">
        <div className="mx-auto max-w-frame">
          <PostList posts={posts} base="case-studies" industries={industries} />
        </div>
      </section>
    </>
  );
}
