import { requirePermission } from '@/lib/auth';
import { getCertifications } from '@/lib/repo';
import { PageHead } from '@/components/admin/PageHead';
import { RefEditor } from '@/components/admin/RefEditor';

export default async function CertsAdmin() {
  await requirePermission('settings.edit');
  const rows = await getCertifications();
  return (
    <div>
      <PageHead title="Certifications" sub="Microsoft certifications held by the team. Set how many people hold each one, hide the ones you don’t want shown, or delete them. Badges are the official Microsoft Learn images." />
      <RefEditor
        col="certifications"
        rows={rows as never}
        titleKey="code"
        subKey="name"
        imageKey="badgeUrl"
        defaults={{ code: '', name: 'Microsoft Certified: ', level: 'Associate', track: 'AI', badgeUrl: 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-associate-badge.svg', learnUrl: '', holders: 0, status: 'active', show: true }}
        fields={[
          { key: 'code', label: 'Exam code', type: 'text' },
          { key: 'holders', label: 'Team members certified', type: 'number' },
          { key: 'name', label: 'Certification name', type: 'text', wide: true },
          { key: 'level', label: 'Level', type: 'select', options: ['Fundamentals', 'Associate', 'Expert', 'Specialty', 'Business'] },
          { key: 'track', label: 'Track', type: 'select', options: ['AI', 'Data & Fabric', 'Power Platform', 'Azure', 'Other'] },
          { key: 'status', label: 'Status', type: 'select', options: ['active', 'retired'] },
          { key: 'show', label: 'Show on site', type: 'checkbox' },
          { key: 'order', label: 'Order', type: 'number' },
          { key: 'note', label: 'Note', type: 'text', wide: true },
          { key: 'learnUrl', label: 'Microsoft Learn link', type: 'url', wide: true },
          { key: 'badgeUrl', label: 'Badge image', type: 'image', folder: 'certifications' },
        ]}
      />
    </div>
  );
}
