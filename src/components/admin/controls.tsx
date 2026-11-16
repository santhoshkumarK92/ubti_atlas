'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Loader2, LogOut, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import type { Lead, Role } from '@/lib/types';
import { ROLES } from '@/lib/types';
import { deleteUser, inviteUser, loadSampleData, removeSampleData, setLeadStatus, setUserRole } from '@/app/admin/actions';

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        try { const m = await import('@/lib/firebase-client'); await m.signOutClient(); } catch { /* local mode */ }
        window.location.href = '/';
      }}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-soft hover:text-ink"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}

export function SampleDataButtons({ hasSample, empty }: { hasSample: boolean; empty: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState('');
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {empty && (
        <button disabled={pending} onClick={() => start(async () => { const r = await loadSampleData(); setMsg(r.ok ? `Loaded ${r.data!.added} items` : r.error); router.refresh(); })} className="btn-dark btn-sm">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />} Load sample data
        </button>
      )}
      {hasSample && (
        <button
          disabled={pending}
          onClick={() => confirm('Remove all sample projects and posts? Industries, systems and certifications stay.') && start(async () => { const r = await removeSampleData(); setMsg(r.ok ? `Removed ${r.data!.removed} sample items` : r.error); router.refresh(); })}
          className="btn-ghost btn-sm"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove sample projects & posts
        </button>
      )}
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}

export function HealthCheckButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await fetch('/api/admin/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          const j = await r.json();
          setBusy(false);
          setMsg(r.ok ? `Checked ${j.results.length} demo links · ${j.results.filter((x: { ok: boolean }) => !x.ok).length} down` : j.error);
          router.refresh();
        }}
        className="btn-ghost btn-sm"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Check all demo links
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}

export function LeadStatus({ id, status }: { id: string; status: Lead['status'] }) {
  const [s, setS] = useState(status);
  const [pending, start] = useTransition();
  return (
    <select disabled={pending} value={s} onChange={(e) => { const v = e.target.value as Lead['status']; setS(v); start(() => setLeadStatus(id, v)); }} className="input w-auto py-1.5 text-xs">
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </select>
  );
}

export function RoleSelect({ id, role, self }: { id: string; role: Role; self: boolean }) {
  const [r, setR] = useState(role);
  const [err, setErr] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <select disabled={pending || self} value={r} onChange={(e) => { const v = e.target.value as Role; start(async () => { const res = await setUserRole(id, v); if (res.ok) setR(v); else setErr(res.error); }); }} className="input w-auto py-1.5 text-xs">
        {ROLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
      {!self && <button onClick={() => confirm('Remove this user?') && start(async () => { const res = await deleteUser(id); if (!res.ok) setErr(res.error); router.refresh(); })} className="btn-ghost h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></button>}
      {err && <span className="text-xs text-bad">{err}</span>}
    </div>
  );
}

export function InviteUser() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('sales');
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await inviteUser(email, name, role); setMsg(r.ok ? `Added — ${email} gets this role at first sign-in.` : r.error); if (r.ok) { setEmail(''); setName(''); router.refresh(); } }); }} className="card grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto]">
      <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@ubtiinc.com" />
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
      <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
      <button disabled={pending} className="btn-dark">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Add</button>
      {msg && <p className="text-xs text-muted md:col-span-4">{msg}</p>}
    </form>
  );
}
