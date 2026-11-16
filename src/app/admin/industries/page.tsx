import { requirePermission } from '@/lib/auth';
import { getAllProjects, getIndustries } from '@/lib/repo';
import { PageHead } from '@/components/admin/PageHead';
import { RefEditor } from '@/components/admin/RefEditor';
import { ICON_NAMES } from '@/components/ui/Icon';

export default async function IndustriesAdmin() {
  await requirePermission('settings.edit');
  const [rows, projects] = await Promise.all([getIndustries(), getAllProjects()]);
  const counts = Object.fromEntries(rows.map((r) => [r.id, projects.filter((p) => p.industryId === r.id).length]));
  return (
    <div>
      <PageHead title="Industries" sub="The business domains projects are grouped by. The photo shows on the industry tiles and pages." />
      <RefEditor
        col="industries"
        rows={rows as never}
        titleKey="name"
        subKey="description"
        imageKey="imageUrl"
        extraCount={counts}
        defaults={{ name: '', shortName: '', description: '', imageUrl: '', icon: 'Briefcase' }}
        fields={[
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'shortName', label: 'Short name (tiles)', type: 'text' },
          { key: 'slug', label: 'URL slug', type: 'text', hint: 'Leave empty to generate' },
          { key: 'icon', label: 'Icon', type: 'select', options: ICON_NAMES },
          { key: 'order', label: 'Order', type: 'number' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'imageUrl', label: 'Photo', type: 'image', folder: 'industries' },
        ]}
      />
    </div>
  );
}
