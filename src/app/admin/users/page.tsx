import { requirePermission } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { ROLES } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { PageHead } from '@/components/admin/PageHead';
import { InviteUser, RoleSelect } from '@/components/admin/controls';

export default async function UsersAdmin() {
  const me = await requirePermission('users.edit');
  const users = await (await getStore()).list('users', { orderBy: ['createdAt', 'asc'] });
  return (
    <div>
      <PageHead title="Users & roles" sub="People get Viewer the first time they sign in. Pre-add colleagues here to give them a role from day one." />
      <div className="mb-6 grid gap-2 md:grid-cols-5">
        {ROLES.map((r) => <div key={r.id} className="card p-3"><div className="text-sm font-medium">{r.label}</div><div className="text-[11px] text-muted">{r.help}</div></div>)}
      </div>
      <InviteUser />
      <div className="card mt-4 divide-y divide-line">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{u.name}{u.id.startsWith('pending-') && <span className="chip ml-2 py-0 text-[10px]">invited</span>}</div>
              <div className="text-xs text-muted">{u.email} · {u.lastLoginAt ? `last seen ${timeAgo(u.lastLoginAt)}` : 'never signed in'}</div>
            </div>
            <RoleSelect id={u.id} role={u.role} self={u.id === me.uid} />
          </div>
        ))}
      </div>
    </div>
  );
}
