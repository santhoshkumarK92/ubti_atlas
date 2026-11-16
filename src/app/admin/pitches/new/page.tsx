import { requirePermission } from '@/lib/auth';
import { getIndustries, getPlatforms, getVisibleProjects } from '@/lib/repo';
import { aiEnabled, config } from '@/lib/config';
import { PageHead } from '@/components/admin/PageHead';
import { PitchEditor } from '@/components/admin/PitchEditor';

export default async function NewPitch() {
  await requirePermission('pitches.edit');
  const [projects, industries, platforms] = await Promise.all([getVisibleProjects(true), getIndustries(), getPlatforms()]);
  return (
    <div>
      <PageHead title="New client pitch" sub="About two minutes: describe the meeting, review the picks, share the link." />
      <PitchEditor projects={projects.filter((p) => p.visibility !== 'internal')} industries={industries} platforms={platforms} siteUrl={config.siteUrl} aiOn={aiEnabled} />
    </div>
  );
}
