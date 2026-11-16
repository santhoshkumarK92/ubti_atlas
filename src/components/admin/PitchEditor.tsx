'use client';
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Download, ExternalLink, Loader2, Plus, Save, Search, Sparkles, X } from 'lucide-react';
import type { Industry, Pitch, Platform, StoredFile } from '@/lib/types';
import type { PublicProject } from '@/lib/repo';
import { cn } from '@/lib/utils';
import { savePitch, setPitchStatus } from '@/app/admin/actions';
import { Uploader } from './Uploader';
import { ChipSelect, Field, Notice } from './fields';

interface Candidate { projectId: string; reason: string; score?: number }

export function PitchEditor({ pitch, projects, industries, platforms, siteUrl, aiOn }: { pitch?: Pitch; projects: PublicProject[]; industries: Industry[]; platforms: Platform[]; siteUrl: string; aiOn: boolean }) {
  const router = useRouter();
  const [clientName, setClientName] = useState(pitch?.clientName ?? '');
  const [industryId, setIndustryId] = useState(pitch?.industryId ?? '');
  const [region, setRegion] = useState(pitch?.region ?? '');
  const [context, setContext] = useState(pitch?.context ?? '');
  const [systems, setSystems] = useState<string[]>([]);
  const [logo, setLogo] = useState<StoredFile | undefined>(pitch?.clientLogo);
  const [intro, setIntro] = useState(pitch?.intro ?? '');
  const [picked, setPicked] = useState<string[]>(pitch?.projectIds ?? []);
  const [reframes, setReframes] = useState<Record<string, string>>(pitch?.reframes ?? {});
  const [expiresAt, setExpiresAt] = useState(pitch?.expiresAt?.slice(0, 10) ?? '');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(pitch?.status ?? 'active');

  const byId = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const link = pitch ? `${siteUrl}/for/${pitch.slug}` : '';

  async function suggest() {
    if (!clientName.trim()) { setMsg({ kind: 'err', text: 'Add the client name first' }); return; }
    setBusy(true);
    setMsg({ kind: 'info', text: aiOn ? 'Matching the portfolio to this client…' : 'Scoring projects by industry, systems and keywords…' });
    try {
      const r = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pitch', pitch: { clientName, industryId: industryId || undefined, region, context, platformIds: systems } }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setCandidates(j.picks.map((p: Candidate & { reframe: string }) => ({ projectId: p.projectId, reason: p.reason, score: p.score })));
      const rec = j.picks.filter((p: { recommended: boolean }) => p.recommended);
      const top = (rec.length ? rec : j.picks.slice(0, 3)).slice(0, 5).map((p: { projectId: string }) => p.projectId);
      setPicked(top);
      setReframes((r) => ({ ...r, ...Object.fromEntries(j.picks.map((p: { projectId: string; reframe: string }) => [p.projectId, p.reframe])) }));
      if (!intro || !pitch) setIntro(j.intro);
      setMsg({ kind: 'ok', text: `Picked ${top.length} projects. Untick, reorder or add others, then save to get the link.` });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function save() {
    start(async () => {
      const r = await savePitch(pitch?.id ?? null, {
        clientName, clientLogo: logo, industryId: industryId || undefined, region: region || undefined, context, intro, projectIds: picked, reframes,
        expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : undefined,
      });
      if (!r.ok) { setMsg({ kind: 'err', text: r.error }); return; }
      setMsg({ kind: 'ok', text: 'Saved. Share the link below.' });
      if (!pitch) router.push(`/admin/pitches/${r.data!.id}`);
      else router.refresh();
    });
  }

  const move = (id: string, d: number) => setPicked((p) => { const i = p.indexOf(id); const n = [...p]; n.splice(i, 1); n.splice(Math.max(0, Math.min(n.length, i + d)), 0, id); return n; });
  const others = projects.filter((p) => !picked.includes(p.id) && (!q || (p.title + p.tagline).toLowerCase().includes(q.toLowerCase()))).slice(0, 8);

  return (
    <div className="space-y-6">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="card space-y-4 p-5">
          <h3 className="font-display text-xl font-semibold">1 · Who is the meeting with?</h3>
          <Field label="Client name *"><input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Al Shirawi" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <select className="input" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                <option value="">Any</option>
                {industries.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
              </select>
            </Field>
            <Field label="Region"><input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="UAE" /></Field>
          </div>
          <Field label="Meeting notes" hint="What they do, pains, priorities. Used for matching and to reframe each use case.">
            <textarea rows={4} className="input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Meeting tomorrow — electrical & mechanical contractor in Dubai. Interested in tender documents, RFIs and invoice processing." />
          </Field>
          <Field label="Systems they run (optional)"><ChipSelect options={platforms.map((p) => ({ id: p.id, label: p.name, group: p.category }))} value={systems} onChange={setSystems} groupBy /></Field>
          <Field label="Client logo (optional)" hint="Upload a logo you have permission to use.">
            {logo ? (
              <div className="flex items-center gap-3"><img src={logo.url} alt="" className="h-12 w-28 rounded-lg border border-line bg-white object-contain p-1" /><button onClick={() => setLogo(undefined)} className="btn-ghost btn-sm"><X className="h-3.5 w-3.5" /></button></div>
            ) : (
              <Uploader compact folder="pitches/logos" accept="image/*" label="Upload logo" onUploaded={setLogo} />
            )}
          </Field>
          <button onClick={suggest} disabled={busy} className="btn-accent w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Suggest the best projects</button>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-xl font-semibold">2 · Projects on the microsite ({picked.length})</h3>
            <p className="mt-1 text-sm text-muted">Order matters — the first one is what they see first. Edit how each use case is framed for this client.</p>
            <div className="mt-4 space-y-3">
              {picked.map((id, i) => {
                const p = byId.get(id);
                if (!p) return null;
                return (
                  <div key={id} className="rounded-xl border border-line bg-paper p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-paper">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{p.title}</div>
                        <div className="text-[11px] text-muted">{industries.find((x) => x.id === p.industryId)?.shortName} · {candidates.find((c) => c.projectId === id)?.reason}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => move(id, -1)} disabled={i === 0} className="btn-ghost h-7 w-7 p-0 text-xs">↑</button>
                        <button onClick={() => move(id, 1)} disabled={i === picked.length - 1} className="btn-ghost h-7 w-7 p-0 text-xs">↓</button>
                        <button onClick={() => setPicked((x) => x.filter((y) => y !== id))} className="btn-ghost h-7 w-7 p-0"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <textarea rows={2} className="input mt-2 text-[13px]" value={reframes[id] ?? p.tagline} onChange={(e) => setReframes((r) => ({ ...r, [id]: e.target.value }))} />
                  </div>
                );
              })}
              {!picked.length && <p className="py-6 text-center text-sm text-muted">Click “Suggest the best projects”, or add from the list below.</p>}
            </div>
            {candidates.filter((c) => !picked.includes(c.projectId)).length > 0 && (
              <div className="mt-5">
                <div className="eyebrow mb-2">Also a good fit</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidates.filter((c) => !picked.includes(c.projectId)).map((c) => (
                    <button key={c.projectId} onClick={() => setPicked((x) => [...x, c.projectId])} className="chip"><Plus className="h-3 w-3" /> {byId.get(c.projectId)?.title}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add any project…" className="input pl-9" />
              </label>
              {q && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {others.map((p) => <button key={p.id} onClick={() => { setPicked((x) => [...x, p.id]); setQ(''); }} className="chip"><Plus className="h-3 w-3" /> {p.title}</button>)}
                </div>
              )}
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <h3 className="font-display text-xl font-semibold">3 · Welcome message & link</h3>
            <Field label="Intro shown at the top of the microsite"><textarea rows={3} className="input" value={intro} onChange={(e) => setIntro(e.target.value)} /></Field>
            <Field label="Link expires (optional)"><input type="date" className="input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
            <div className="flex flex-wrap gap-2">
              <button onClick={save} disabled={pending} className="btn-dark">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {pitch ? 'Save changes' : 'Create client link'}</button>
              {pitch && (
                <>
                  <a href={`/for/${pitch.slug}`} target="_blank" className="btn-ghost"><ExternalLink className="h-4 w-4" /> Open</a>
                  <a href={`/api/export/pptx?pitch=${pitch.id}`} className="btn-ghost"><Download className="h-4 w-4" /> Export PPT</a>
                  <button
                    onClick={() => start(async () => { const s = status === 'active' ? 'archived' : 'active'; const r = await setPitchStatus(pitch.id, s); if (r.ok) setStatus(s); })}
                    className="btn-ghost"
                  >
                    {status === 'active' ? 'Disable link' : 'Re-enable link'}
                  </button>
                </>
              )}
            </div>
            {pitch && (
              <div className={cn('flex items-center gap-2 rounded-xl border p-3 text-sm', status === 'active' ? 'border-accent/40 bg-accent/5' : 'border-line opacity-60')}>
                <code className="flex-1 truncate">{link}</code>
                <button onClick={() => { navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); }} className="btn-ghost btn-sm">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
