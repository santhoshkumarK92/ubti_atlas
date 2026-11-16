'use client';
import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { Industry } from '@/lib/types';

export function LeadForm({ source, industries, compact, cta = 'Send request' }: { source: string; industries?: Industry[]; compact?: boolean; cta?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setState('busy');
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, source }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'Could not send'); setState('idle'); return; }
    setState('done');
  }

  if (state === 'done')
    return (
      <div className="card flex items-center gap-3 p-6">
        <CheckCircle2 className="h-6 w-6 text-good" />
        <div><div className="font-medium">Thanks — we&apos;ll be in touch shortly.</div><div className="text-sm text-muted">Your request reached the UBTI AI team.</div></div>
      </div>
    );

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <div><label className="label">Name *</label><input name="name" required className="input" /></div>
      <div><label className="label">Work email *</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Company</label><input name="company" className="input" /></div>
      {!compact && industries ? (
        <div>
          <label className="label">Industry</label>
          <select name="industryId" className="input">
            <option value="">Select…</option>
            {industries.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
          </select>
        </div>
      ) : (
        <div><label className="label">Phone</label><input name="phone" className="input" /></div>
      )}
      <div className="sm:col-span-2"><label className="label">What would you like to automate?</label><textarea name="message" rows={compact ? 3 : 5} className="input" /></div>
      {err && <p className="text-sm text-bad sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2"><button disabled={state === 'busy'} className="btn-dark">{state === 'busy' && <Loader2 className="h-4 w-4 animate-spin" />}{cta}</button></div>
    </form>
  );
}
