import { requirePermission } from '@/lib/auth';
import { getCompany } from '@/lib/repo';
import { PageHead } from '@/components/admin/PageHead';
import { CompanyForm } from '@/components/admin/CompanyForm';

export default async function CompanyAdmin() {
  await requirePermission('settings.edit');
  return (
    <div>
      <PageHead title="Company" sub="Headline, about text and contact details used across the site, microsites and exported decks." />
      <CompanyForm company={await getCompany()} />
    </div>
  );
}
