import Link from 'next/link';
import { redirect } from 'next/navigation';
import { can, getUser, type Permission } from '@/lib/auth';
import { aiEnabled, useFirebase } from '@/lib/config';
import { ROLES } from '@/lib/types';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LogoutButton } from '@/components/admin/controls';
import { AdminNav, type NavIcon } from '@/components/admin/AdminNav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin' };

const NAV: { href: string; label: string; icon: NavIcon; perm: Permission }[] = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', perm: 'admin.view' },
  { href: '/admin/projects', label: 'Projects', icon: 'Layers', perm: 'admin.view' },
  { href: '/admin/pitches', label: 'Client Mode', icon: 'Presentation', perm: 'pitches.view' },
  { href: '/admin/posts', label: 'Blog & case studies', icon: 'FileText', perm: 'posts.edit' },
  { href: '/admin/leads', label: 'Leads', icon: 'Inbox', perm: 'leads.view' },
  { href: '/admin/industries', label: 'Industries', icon: 'Globe', perm: 'settings.edit' },
  { href: '/admin/platforms', label: 'Systems', icon: 'Server', perm: 'settings.edit' },
  { href: '/admin/certifications', label: 'Certifications', icon: 'Award', perm: 'settings.edit' },
  { href: '/admin/company', label: 'Company', icon: 'Building', perm: 'settings.edit' },
  { href: '/admin/users', label: 'Users & roles', icon: 'Users', perm: 'users.edit' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect('/login?next=/admin');
  if (!can(user.role, 'admin.view')) redirect('/?notice=viewer');
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-gradient-to-b from-[#f8faff] via-[#f1f5fc] to-[#e6eefb] dark:from-[#0c1514] dark:via-[#10201e] dark:to-[#142a27] md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex h-full min-h-0 flex-col p-4">
          <div className="flex items-center justify-between px-2 py-2"><Logo href="/" /></div>
          <div className="md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1"><AdminNav items={NAV.filter((n) => can(user.role, n.perm)).map(({ href, label, icon }) => ({ href, label, icon }))} /></div>
          <div className="hidden shrink-0 space-y-3 border-t border-white/60 pt-4  md:block">
            <div className="rounded-sm border border-line bg-card/60 p-3 text-[11px]  text-muted">
              <div className="flex justify-between"><span>Database</span><b className="text-ink">{useFirebase ? 'Firestore' : 'Local JSON'}</b></div>
              <div className="flex justify-between"><span>AI</span><b className={aiEnabled ? 'text-good' : 'text-warn'}>{aiEnabled ? 'Connected' : 'Not configured'}</b></div>
            </div>
            <div className="flex items-center gap-2 px-1">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-[11px] text-muted">{ROLES.find((r) => r.id === user.role)?.label} · {user.email}</div>
              </div>
              <ThemeToggle className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line" />
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
