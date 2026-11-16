'use client';
import { useState, useTransition } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { CompanySettings } from '@/lib/types';
import { saveCompany } from '@/app/admin/actions';
import { Field, MetricsEditor, Notice, TagsInput } from './fields';

export function CompanyForm({ company }: { company: CompanySettings }) {
  const [c, setC] = useState(company);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => setC((x) => ({ ...x, [k]: v }));
  return (
    <div className="space-y-5">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card grid gap-4 p-5 md:grid-cols-2">
        <Field label="Company name"><input className="input" value={c.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Product name"><input className="input" value={c.productName} onChange={(e) => set('productName', e.target.value)} /></Field>
        <Field label="Tagline (hero headline)" className="md:col-span-2" hint="Use “. ” to split it over two lines."><input className="input" value={c.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
        <Field label="Sub-tagline" className="md:col-span-2"><textarea rows={3} className="input" value={c.subTagline} onChange={(e) => set('subTagline', e.target.value)} /></Field>
        <Field label="Pitch line" className="md:col-span-2"><input className="input" value={c.pitchLine} onChange={(e) => set('pitchLine', e.target.value)} /></Field>
        <Field label="About (Markdown)" className="md:col-span-2"><textarea rows={8} className="input" value={c.about} onChange={(e) => set('about', e.target.value)} /></Field>
        <Field label="Partner line"><input className="input" value={c.partnerLine} onChange={(e) => set('partnerLine', e.target.value)} /></Field>
        <Field label="Website"><input className="input" value={c.website} onChange={(e) => set('website', e.target.value)} /></Field>
        <Field label="Contact email (shown on Contact page)"><input className="input" value={c.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
        <Field label="Offices"><TagsInput value={c.offices} onChange={(v) => set('offices', v)} /></Field>
        <Field label="Capabilities" className="md:col-span-2"><TagsInput value={c.capabilities} onChange={(v) => set('capabilities', v)} /></Field>
        <Field label="Extra stats on the About page" className="md:col-span-2" hint="Project, industry, system and certification counts are calculated automatically."><MetricsEditor value={c.stats} onChange={(v) => set('stats', v)} /></Field>
      </div>
      <button
        onClick={() => start(async () => { const { id, ...rest } = c; void id; const r = await saveCompany(rest); setMsg(r.ok ? { kind: 'ok', text: 'Saved' } : { kind: 'err', text: r.error }); })}
        disabled={pending}
        className="btn-dark"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save company settings
      </button>
    </div>
  );
}
