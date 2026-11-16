import { getUser, can } from '@/lib/auth';
import { getCompany, getIndustries, getPlatforms, getProjectsByIds } from '@/lib/repo';
import { getStore } from '@/lib/store';
import { buildDeck } from '@/lib/pptx';
import { config } from '@/lib/config';
import { slugify } from '@/lib/utils';

export const maxDuration = 120;

/** GET ?pitch=<id> | ?project=<id> | ?industry=<id> → .pptx download (staff only). */
export async function GET(req: Request) {
  const u = await getUser();
  if (!u || !can(u.role, 'internal.view')) return new Response('Sign in to export', { status: 401 });
  const q = new URL(req.url).searchParams;
  const [company, industries, platforms] = await Promise.all([getCompany(), getIndustries(), getPlatforms()]);
  const store = await getStore();

  let fileName = 'ubti-ai-atlas';
  let input: Parameters<typeof buildDeck>[0];

  if (q.get('pitch')) {
    const pitch = await store.get('pitches', q.get('pitch')!);
    if (!pitch) return new Response('Pitch not found', { status: 404 });
    const projects = await getProjectsByIds(pitch.projectIds);
    input = {
      company, industries, platforms, projects,
      clientName: pitch.clientName,
      clientLogo: pitch.clientLogo,
      intro: pitch.intro,
      reframes: pitch.reframes,
      industry: industries.find((i) => i.id === pitch.industryId),
      link: `${config.siteUrl}/for/${pitch.slug}`,
    };
    fileName = `ubti-ai-${slugify(pitch.clientName)}`;
  } else if (q.get('project')) {
    const projects = await getProjectsByIds([q.get('project')!]);
    if (!projects.length) return new Response('Project not found', { status: 404 });
    input = { company, industries, platforms, projects, industry: industries.find((i) => i.id === projects[0]!.industryId) };
    fileName = `ubti-ai-${projects[0]!.slug}`;
  } else if (q.get('industry')) {
    const industry = industries.find((i) => i.id === q.get('industry'));
    const all = await store.list('projects', { where: [['status', '==', 'published']] });
    const ids = all.filter((p) => p.industryId === industry?.id || p.extraIndustryIds.includes(industry?.id ?? '')).map((p) => p.id);
    input = { company, industries, platforms, industry, projects: await getProjectsByIds(ids.slice(0, 15)) };
    fileName = `ubti-ai-${industry?.slug ?? 'industry'}`;
  } else {
    return new Response('Pass ?pitch=, ?project= or ?industry=', { status: 400 });
  }

  const buf = await buildDeck(input);
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${fileName}.pptx"`,
    },
  });
}
