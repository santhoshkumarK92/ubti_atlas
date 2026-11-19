'use client';
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, useTransition } from 'react';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { deleteRef, saveRef } from '@/app/admin/actions';
import { Uploader } from './Uploader';
import { Field, Notice, TagsInput, Toggle } from './fields';
import { cn } from '@/lib/utils';

export type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' | 'number' | 'url'; hint?: string; wide?: boolean }
  | { key: string; label: string; type: 'select'; options: string[]; hint?: string; wide?: boolean }
  | { key: string; label: string; type: 'tags'; hint?: string; wide?: boolean }
  | { key: string; label: string; type: 'image'; folder: string; hint?: string; wide?: boolean }
  | { key: string; label: string; type: 'checkbox'; hint?: string; wide?: boolean };

type Row = Record<string, unknown> & { id: string };

/** Generic list + side-panel editor for industries, platforms and certifications. */
export function RefEditor({ col, rows: initial, fields, titleKey, subKey, imageKey, defaults, extraCount }: {
  col: 'industries' | 'platforms' | 'certifications';
  rows: Row[];
  fields: FieldDef[];
  titleKey: string;
  subKey?: string;
  imageKey?: string;
  defaults: Record<string, unknown>;
  extraCount?: Record<string, number>;
}) {
  const [rows, setRows] = useState(initial);
  const [edit, setEdit] = useState<Row | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const list = useMemo(() => rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const save = () =>
    edit &&
    start(async () => {
      const isNew = edit.id === '__new';
      const r = await saveRef(col, isNew ? null : edit.id, edit as never);
      if (!r.ok) { setMsg({ kind: 'err', text: r.error }); return; }
      const saved = { ...edit, id: r.data!.id };
      setRows((x) => (isNew ? [...x, saved] : x.map((y) => (y.id === edit.id ? saved : y))));
      setEdit(null);
      setMsg({ kind: 'ok', text: 'Saved' });
    });

  const remove = (id: string) =>
    confirm('Delete this item?') &&
    start(async () => {
      const r = await deleteRef(col, id);
      if (!r.ok) { setMsg({ kind: 'err', text: r.error }); return; }
      setRows((x) => x.filter((y) => y.id !== id));
      setEdit(null);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="input pl-9" />
        </label>
        <button onClick={() => setEdit({ id: '__new', ...defaults, order: rows.length + 1 })} className="btn-dark"><Plus className="h-4 w-4" /> Add</button>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="card divide-y divide-line overflow-hidden">
        {list.map((r) => (
          <div key={r.id} className={cn('flex items-center gap-3 px-4 py-3', r.show === false && 'opacity-50')}>
            {imageKey && (r[imageKey] ? <img src={String(r[imageKey])} alt="" className="h-10 w-14 shrink-0 rounded-md border border-line bg-white object-cover" /> : <span className="h-10 w-14 shrink-0 rounded-md bg-soft" />)}
            <button onClick={() => setEdit(r)} className="min-w-0 flex-1 text-left">
              <div className="truncate font-medium">{String(r[titleKey] ?? '')}</div>
              {subKey && <div className="truncate text-xs text-muted">{String(r[subKey] ?? '')}</div>}
            </button>
            {extraCount && <span className="chip text-[11px]">{extraCount[r.id] ?? 0} projects</span>}
            <button onClick={() => setEdit(r)} className="btn-ghost btn-sm">Edit</button>
          </div>
        ))}
        {!list.length && <p className="p-6 text-center text-sm text-muted">Nothing here.</p>}
      </div>

      {edit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={() => setEdit(null)}>
          <div className="h-full w-full max-w-xl animate-fade-up overflow-y-auto border-l border-line bg-paper p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold">{edit.id === '__new' ? 'Add' : 'Edit'}</h3>
              <button onClick={() => setEdit(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((fd) => {
                const v = edit[fd.key];
                const upd = (nv: unknown) => setEdit((x) => ({ ...x!, [fd.key]: nv }));
                const wide = fd.wide || fd.type === 'textarea' || fd.type === 'tags' || fd.type === 'image';
                return (
                  <Field key={fd.key} label={fd.label} hint={fd.hint} className={wide ? 'sm:col-span-2' : ''}>
                    {fd.type === 'textarea' ? <textarea rows={3} className="input" value={String(v ?? '')} onChange={(e) => upd(e.target.value)} />
                      : fd.type === 'number' ? <input type="number" className="input" value={v === undefined ? '' : Number(v)} onChange={(e) => upd(e.target.value === '' ? 0 : Number(e.target.value))} />
                      : fd.type === 'select' ? (
                        <select className="input" value={String(v ?? '')} onChange={(e) => upd(e.target.value)}>
                          {fd.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : fd.type === 'tags' ? <TagsInput value={(v as string[]) ?? []} onChange={upd} />
                      : fd.type === 'checkbox' ? <Toggle checked={v !== false} onChange={upd} label={v !== false ? 'Yes' : 'No'} />
                      : fd.type === 'image' ? (
                        <div className="space-y-2">
                          {v ? <img src={String(v)} alt="" className="max-h-40 rounded-lg border border-line bg-white object-contain" /> : null}
                          <input className="input" value={String(v ?? '')} onChange={(e) => upd(e.target.value)} placeholder="https://…" />
                          <Uploader compact folder={fd.folder} accept="image/*" label="…or upload" onUploaded={(f) => upd(f.url)} />
                        </div>
                      ) : <input className="input" value={String(v ?? '')} onChange={(e) => upd(e.target.value)} />}
                  </Field>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={save} disabled={pending} className="btn-dark">{pending && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
              <button onClick={() => setEdit(null)} className="btn-ghost">Cancel</button>
              {edit.id !== '__new' && <button onClick={() => remove(edit.id)} disabled={pending} className="btn-ghost ml-auto text-bad"><Trash2 className="h-4 w-4" /> Delete</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
