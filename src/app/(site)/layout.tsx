import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { ChatWidget } from '@/components/site/ChatWidget';
import { can, getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="min-h-screen">
      <Header signedIn={!!user} canAdmin={can(user?.role, 'admin.view')} />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
