import { requirePermission } from '@/lib/auth';
import { getAllProjects, getPlatforms } from '@/lib/repo';
import { PLATFORM_CATEGORIES } from '@/lib/types';
import { PageHead } from '@/components/admin/PageHead';
import { RefEditor } from '@/components/admin/RefEditor';

export default async function PlatformsAdmin() {
  await requirePermission('settings.edit');
  const [rows, projects] = await Promise.all([getPlatforms(), getAllProjects()]);
  const counts = Object.fromEntries(rows.map((r) => [r.id, projects.filter((p) => p.platformIds.includes(r.id)).length]));
  return (
    <div>
      <PageHead title="Systems we connect to" sub={`${rows.length} databases, ERPs, CRMs and platforms we can put an AI layer on. Shown on “AI on your stack” and used for matching.`} />
      <RefEditor
        col="platforms"
        rows={rows as never}
        titleKey="name"
        subKey="category"
        extraCount={counts}
        defaults={{ name: '', vendor: '', category: PLATFORM_CATEGORIES[0], description: '', aiPatterns: [], connectVia: '' }}
        fields={[
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'vendor', label: 'Vendor', type: 'text' },
          { key: 'category', label: 'Category', type: 'select', options: [...PLATFORM_CATEGORIES] },
          { key: 'order', label: 'Order', type: 'number' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'aiPatterns', label: 'What AI can do on it', type: 'tags' },
          { key: 'connectVia', label: 'How we connect', type: 'text', wide: true },
          { key: 'logoUrl', label: 'Logo (optional — only use logos you are permitted to display)', type: 'image', folder: 'platforms' },
        ]}
      />
    </div>
  );
}
