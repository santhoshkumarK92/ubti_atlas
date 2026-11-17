'use client';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import type { FlowStep, Metric } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Field({ label, hint, children, className, action }: { label: string; hint?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <div className={className}>
      {action ? (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="label !mb-0">{label}</label>
          {action}
        </div>
      ) : (
        <label className="label">{label}</label>
      )}
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function TagsInput({ value, onChange, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState('');
  const add = (t: string) => {
    const parts = t.split(',').map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft('');
  };
  const sugg = suggestions.filter((s) => draft.length > 0 && s.toLowerCase().includes(draft.toLowerCase()) && !value.includes(s)).slice(0, 6);
  return (
    <div className="relative">
      <div className="input flex min-h-[44px] flex-wrap items-center gap-1.5 py-1.5">
        {value.map((t) => (
          <span key={t} className="chip gap-1 py-0.5">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none"
        />
      </div>
      {sugg.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-line bg-card p-1 shadow-lg">
          {sugg.map((s) => <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); add(s); }} className="block w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-soft">{s}</button>)}
        </div>
      )}
    </div>
  );
}

export function ChipSelect({ options, value, onChange, max, groupBy }: { options: { id: string; label: string; group?: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number; groupBy?: boolean }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())), [options, q]);
  const groups = groupBy ? [...new Set(filtered.map((o) => o.group ?? ''))] : [''];
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : max && value.length >= max ? value : [...value, id]);
  return (
    <div className="rounded-xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="flex-1 bg-transparent text-sm outline-none" />
        <span className="text-[11px] text-muted">{value.length} selected</span>
      </div>
      <div className="max-h-56 space-y-3 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g}>
            {g && <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted">{g}</div>}
            <div className="flex flex-wrap gap-1.5">
              {filtered.filter((o) => (o.group ?? '') === g).map((o) => (
                <button key={o.id} type="button" onClick={() => toggle(o.id)} className={cn('chip', value.includes(o.id) && 'chip-on')}>{o.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricsEditor({ value, onChange }: { value: Metric[]; onChange: (v: Metric[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((m, i) => (
        <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2">
          <input className="input" placeholder="-40%" value={m.value} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
          <input className="input" placeholder="Invoice processing time" value={m.label} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="btn-ghost h-[42px] w-[42px] p-0" aria-label="Remove"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { label: '', value: '' }])} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add metric</button>
    </div>
  );
}

export function FlowEditor({ value, onChange }: { value: FlowStep[]; onChange: (v: FlowStep[]) => void }) {
  const move = (i: number, d: number) => {
    const n = [...value];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x!);
    onChange(n);
  };
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="grid grid-cols-[28px_1fr_1.4fr_auto] items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-line font-display text-xs font-bold">{i + 1}</span>
          <input className="input" placeholder="Step" value={s.title} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
          <input className="input" placeholder="Detail (optional)" value={s.detail ?? ''} onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
          <div className="flex gap-1">
            <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="btn-ghost h-8 w-8 p-0"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="btn-ghost h-8 w-8 p-0"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="btn-ghost h-8 w-8 p-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { title: '' }])} className="btn-ghost btn-sm"><Plus className="h-3.5 w-3.5" /> Add step</button>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-accent' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
      {label}
    </label>
  );
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'ok' | 'err' | 'warn'; children: React.ReactNode }) {
  const c = { info: 'border-line bg-card text-ink', ok: 'border-good/30 bg-good/5 text-good', err: 'border-bad/30 bg-bad/5 text-bad', warn: 'border-warn/30 bg-warn/5 text-warn' }[kind];
  return <div className={cn('rounded-xl border px-4 py-3 text-sm', c)}>{children}</div>;
}
