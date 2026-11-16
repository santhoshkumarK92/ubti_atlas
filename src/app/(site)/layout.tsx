import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { ChatWidget } from '@/components/site/ChatWidget';
import { can, getUser } from '@/lib/auth';
import { getCompany, getIndustries } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, company, industries] = await Promise.all([getUser(), getCompany(), getIndustries()]);
  return (
    <div className="min-h-screen">
      <Header signedIn={!!user} canAdmin={can(user?.role, 'admin.view')} />
      <main>{children}</main>
      <Footer company={company} industries={industries} />
      <ChatWidget />
    </div>
  );
}
