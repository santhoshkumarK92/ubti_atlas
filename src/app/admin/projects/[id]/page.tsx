import { notFound } from 'next/navigation';
import { can, requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { getIndustries, getPlatforms } from '@/lib/repo';
import { aiEnabled } from '@/lib/config';
import { stripEmbedding } from '@/lib/utils';
import { ProjectEditor } from '@/components/admin/ProjectEditor';

export default async function EditProject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePermission('projects.edit');
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const p = await (await getStore()).get('projects', id);
  if (!p) notFound();
  const [industries, platforms] = await Promise.all([getIndustries(), getPlatforms()]);
  return (
    <ProjectEditor
      project={stripEmbedding(p)}
      industries={industries}
      platforms={platforms}
      canPublish={can(user.role, 'projects.publish')}
      aiOn={aiEnabled}
      initialTab={tab as 'source' | 'content' | 'media' | 'publish' | undefined}
    />
  );
}
