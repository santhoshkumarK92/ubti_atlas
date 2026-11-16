'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle, ArrowUpRight, Check, CheckCircle2, Copy, Eye, FileText, ImageIcon, Lightbulb, Loader2, RefreshCw, Save,
  Sparkles, Trash2, Video, Wand2, X,
} from 'lucide-react';
import type { DemoStatus, Industry, Platform, Project, ProjectSource, ProjectStatus, StoredFile } from '@/lib/types';
import { MATURITY } from '@/lib/types';
import { completeness, computeGaps, type Gap } from '@/lib/gaps';
import { cn, timeAgo } from '@/lib/utils';
import { deleteProject, duplicateProject, saveProject, setProjectStatus, type ProjectInput } from '@/app/admin/actions';
import { Uploader } from './Uploader';
import { ChipSelect, Field, FlowEditor, MetricsEditor, Notice, TagsInput, Toggle } from './fields';
import { KNOWN_TECH_CLIENT } from './known-tech';
import type { Draft } from '@/lib/intel';

type Tab = 'source' | 'content' | 'media' | 'publish';
type EditableProject = Omit<Project, 'embedding'>;

const toInput = (p: EditableProject): ProjectInput => ({
  slug: p.slug, title: p.title, tagline: p.tagline, industryId: p.industryId, extraIndustryIds: p.extraIndustryIds, clientName: p.clientName,
  clientDisplay: p.clientDisplay, region: p.region, problem: p.problem, solution: p.solution, impact: p.impact, metrics: p.metrics, features: p.features,
  techStack: p.techStack, platformIds: p.platformIds, architecture: p.architecture, media: p.media, demoUrl: p.demoUrl, demoStatus: p.demoStatus, deck: p.deck,
  maturity: p.maturity, reuseScore: p.reuseScore, weeksToDeploy: p.weeksToDeploy, visibility: p.visibility, featured: p.featured, aiSuggestions: p.aiSuggestions,
  isSample: p.isSample,
});

export function ProjectEditor({
  project, industries, platforms, canPublish, aiOn, initialTab,
}: {
  project: EditableProject;
  industries: Industry[];
  platforms: Platform[];
  canPublish: boolean;
  aiOn: boolean;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? (project.source || project.title ? 'content' : 'source'));
  const [f, setF] = useState<ProjectInput>(() => toInput(project));
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [source, setSource] = useState<ProjectSource | undefined>(project.source);
  const [selected, setSelected] = useState<number[]>(project.source?.selectedSlides ?? []);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(project.updatedAt);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info' | 'warn'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<'' | 'extract' | 'draft' | 'diagram' | 'check'>('');

  const set = useCallback(<K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) => { setF((x) => ({ ...x, [k]: v })); setDirty(true); }, []);
  const gaps = useMemo(() => computeGaps({ ...f, metrics: f.metrics, features: f.features }), [f]);
  const score = completeness(gaps);

  const save = useCallback(
    (then?: () => void) =>
      start(async () => {
        const r = await saveProject(project.id, { ...f, selectedSlides: selected });
        if (r.ok) {
          setDirty(false);
          setSavedAt(r.data!.updatedAt);
          if (r.data!.slug !== f.slug) setF((x) => ({ ...x, slug: r.data!.slug }));
          setMsg({ kind: 'ok', text: 'Saved' });
          then?.();
        } else setMsg({ kind: 'err', text: r.error });
      }),
    [f, selected, project.id],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } };
    const leave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('keydown', k);
    window.addEventListener('beforeunload', leave);
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('beforeunload', leave); };
  }, [save, dirty]);

  useEffect(() => { if (msg?.kind === 'ok') { const t = setTimeout(() => setMsg(null), 2500); return () => clearTimeout(t); } }, [msg]);

  // ── Source: upload + extract
  async function onDeck(file: StoredFile) {
    setBusy('extract');
    setMsg({ kind: 'info', text: 'Reading slides…' });
    try {
      const r = await fetch(`/api/admin/projects/${project.id}/extract`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSource(j.source);
      setSelected(j.source.selectedSlides);
      setF((x) => ({ ...x, deck: file }));
      setMsg({ kind: 'ok', text: `Found ${j.source.slides.length} slides. Tick the ones about this use case.` });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  // ── AI draft
  const [overwrite, setOverwrite] = useState(!project.title);
  const [useDiagram, setUseDiagram] = useState(true);
  async function runDraft() {
    setBusy('draft');
    setMsg({ kind: 'info', text: aiOn ? 'AI is drafting the page…' : 'Assembling a draft from slide text…' });
    try {
      const r = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', projectId: project.id, selectedSlides: selected, diagram: useDiagram && aiOn ? f.architecture.image : undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const d = j.draft as Draft;
      const pick = <T,>(cur: T, next: T, empty: (v: T) => boolean): T => (overwrite || empty(cur) ? (empty(next) ? cur : next) : cur);
      const s = (v: string | undefined) => !v || !v.trim();
      const a = (v: unknown[]) => !v.length;
      setF((x) => ({
        ...x,
        title: pick(x.title, d.title, s),
        tagline: pick(x.tagline, d.tagline, s),
        industryId: pick(x.industryId, d.industryId, s),
        extraIndustryIds: pick(x.extraIndustryIds, d.extraIndustryIds, a),
        clientName: pick(x.clientName ?? '', d.clientName, s) || undefined,
        problem: pick(x.problem, d.problem, s),
        solution: pick(x.solution, d.solution, s),
        impact: pick(x.impact, d.impact, s),
        metrics: pick(x.metrics, d.metrics, a),
        features: pick(x.features, d.features, a),
        techStack: overwrite ? d.techStack : [...new Set([...x.techStack, ...d.techStack])],
        platformIds: overwrite ? d.platformIds : [...new Set([...x.platformIds, ...d.platformIds])],
        architecture: {
          ...x.architecture,
          flow: pick(x.architecture.flow, d.flow, a),
          description: pick(x.architecture.description, d.flowDescription, s),
        },
        aiSuggestions: d.suggestions,
      }));
      setDirty(true);
      setTab('content');
      setMsg({ kind: d.usedAI ? 'ok' : 'warn', text: d.usedAI ? 'Draft ready — review every field, then Save.' : d.suggestions[0] });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  async function runDiagram() {
    if (!f.architecture.image) return;
    setBusy('diagram');
    try {
      const r = await fetch('/api/admin/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'diagram', image: f.architecture.image }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      set('architecture', { ...f.architecture, flow: j.result.flow, description: j.result.description || f.architecture.description });
      set('techStack', [...new Set([...f.techStack, ...j.result.techStack])]);
      set('platformIds', [...new Set([...f.platformIds, ...j.result.platformIds])]);
      setMsg({ kind: 'ok', text: `Read ${j.result.flow.length} steps from the diagram. Review and Save.` });
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  async function checkDemo() {
    if (!f.demoUrl) return;
    setBusy('check');
    try {
      const r = await fetch('/api/admin/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: f.demoUrl }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setF((x) => ({ ...x, demoStatus: j.status as DemoStatus }));
      setDirty(true);
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message });
    } finally {
      setBusy('');
    }
  }

  function changeStatus(s: ProjectStatus) {
    const go = () =>
      start(async () => {
        const r = await setProjectStatus(project.id, s);
        if (r.ok) { setStatus(s); setMsg({ kind: 'ok', text: s === 'published' ? 'Published — it is live on the Atlas.' : `Moved to ${s}.` }); }
        else setMsg({ kind: 'err', text: r.error });
      });
    if (dirty) save(go);
    else go();
  }

  const setImageAsDiagram = (img: StoredFile) => { set('architecture', { ...f.architecture, image: img }); setMsg({ kind: 'ok', text: 'Set as architecture diagram' }); };
  const addScreenshot = (img: StoredFile) => {
    if (f.media.screenshots.some((s) => s.path === img.path)) return;
    set('media', { ...f.media, screenshots: [...f.media.screenshots, img] });
  };

  const industryOpts = industries.map((i) => ({ id: i.id, label: i.shortName }));
  const platformOpts = platforms.map((p) => ({ id: p.id, label: p.name, group: p.category }));
  const folder = `projects/${project.id}`;
  const tabs: [Tab, string, number][] = [
    ['source', '1 · Deck & AI draft', 0],
    ['content', '2 · Content', gaps.filter((g) => g.tab === 'content').length],
    ['media', '3 · Diagram, video & demo', gaps.filter((g) => g.tab === 'media').length],
    ['publish', '4 · Review & publish', gaps.filter((g) => g.level === 'block').length],
  ];

  return (
    <div>
      {/* Top bar */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Link href="/admin/projects" className="hover:text-ink">Projects</Link> /
              <StatusPill s={status} />
              {project.isSample && <span className="chip py-0 text-[10px]">Sample</span>}
              <span>{dirty ? 'Unsaved changes' : `Saved ${timeAgo(savedAt)}`}</span>
            </div>
            <div className="truncate font-display text-2xl font-semibold">{f.title || 'Untitled project'}</div>
          </div>
          <Completeness score={score} />
          <Link href={`/projects/${f.slug}`} target="_blank" className="btn-ghost btn-sm"><Eye className="h-3.5 w-3.5" /> Preview</Link>
          <button onClick={() => save()} disabled={pending} className="btn-dark btn-sm">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
        </div>
        <div className="scrollbar-none mt-3 flex gap-1 overflow-x-auto">
          {tabs.map(([id, label, n]) => (
            <button key={id} onClick={() => setTab(id)} className={cn('chip shrink-0', tab === id && 'chip-on')}>
              {label}
              {n > 0 && <span className={cn('rounded-full px-1.5 text-[10px]', tab === id ? 'bg-paper/20' : 'bg-warn/15 text-warn')}>{n}</span>}
            </button>
          ))}
        </div>
        {msg && <div className="mt-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      </div>

      {/* SOURCE */}
      {tab === 'source' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div className="card p-5">
              <h3 className="font-display text-xl font-semibold">Upload the pitch deck</h3>
              <p className="mt-1 text-sm text-muted">PPTX (best — we extract text, speaker notes and images per slide) or PDF. One deck can hold many use cases; you pick the slides for this one.</p>
              <div className="mt-4">
                <Uploader folder={`${folder}/source`} accept=".pptx,.pdf" label={source ? 'Replace deck' : 'Drop a .pptx or .pdf'} hint="Up to your MAX_UPLOAD_MB limit" onUploaded={onDeck} />
              </div>
              {busy === 'extract' && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Extracting slides and images…</p>}
              {source && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-paper p-3 text-sm">
                  <FileText className="h-4 w-4 text-muted" />
                  <a href={source.file.url} className="truncate hover:underline" target="_blank" rel="noreferrer">{source.fileName}</a>
                  <span className="ml-auto shrink-0 text-xs text-muted">{source.slides.length} {source.kind === 'pdf' ? 'pages' : 'slides'}</span>
                </div>
              )}
              {source?.skippedMedia ? <p className="mt-2 text-xs text-muted">{source.skippedMedia} image(s) were EMF/WMF or embedded media and can&apos;t be shown — export those slides as PNG and upload them in Media.</p> : null}
              {source?.kind === 'pdf' && <p className="mt-2 text-xs text-muted">PDFs give text only. Upload the architecture diagram as an image in the next steps.</p>}
            </div>
            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Sparkles className="h-5 w-5 text-accent" /> Draft the page</h3>
              <p className="mt-1 text-sm text-muted">
                {aiOn ? 'AI reads the selected slides (and the diagram, if you set one) and fills problem, solution, impact, metrics, tech stack and systems. Nothing is invented — you review before publishing.' : 'AI is not configured — the draft is assembled from slide text and keyword detection. Add AI keys in .env.local for written drafts and diagram reading.'}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted">Slides selected</span><b>{selected.length || (source ? 'all' : 0)}</b></div>
                <div className="flex items-center justify-between"><span className="text-muted">Architecture diagram</span><b>{f.architecture.image ? 'set' : 'not set'}</b></div>
              </div>
              <div className="mt-4 space-y-2">
                <Toggle checked={overwrite} onChange={setOverwrite} label="Overwrite fields that already have content" />
                {aiOn && f.architecture.image && <Toggle checked={useDiagram} onChange={setUseDiagram} label="Let the vision model read the diagram" />}
              </div>
              <button onClick={runDraft} disabled={!source || busy === 'draft'} className="btn-accent mt-5 w-full">
                {busy === 'draft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate draft from {selected.length || 'all'} {selected.length === 1 ? 'slide' : 'slides'}
              </button>
              <p className="mt-2 text-center text-[11px] text-muted">No deck yet? Skip to Content and type it in.</p>
            </div>
          </div>

          {source && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-semibold">Which slides are about this use case?</h3>
                <span className="text-sm text-muted">Click images to use them as the diagram or screenshots.</span>
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => { setSelected(source.slides.map((s) => s.index)); setDirty(true); }} className="btn-ghost btn-sm">Select all</button>
                  <button onClick={() => { setSelected([]); setDirty(true); }} className="btn-ghost btn-sm">None</button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {source.slides.map((s) => {
                  const on = selected.includes(s.index);
                  return (
                    <div key={s.index} className={cn('card overflow-hidden transition', on ? 'border-accent ring-4 ring-accent/10' : 'opacity-80 hover:opacity-100')}>
                      <button type="button" onClick={() => { setSelected((x) => (on ? x.filter((i) => i !== s.index) : [...x, s.index].sort((a, b) => a - b))); setDirty(true); }} className="flex w-full items-start gap-3 p-4 text-left">
                        <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border', on ? 'border-accent bg-accent text-white' : 'border-line')}>{on && <Check className="h-3.5 w-3.5" />}</span>
                        <span className="min-w-0">
                          <span className="text-[11px] text-muted">{source.kind === 'pdf' ? 'Page' : 'Slide'} {s.index}</span>
                          <span className="block truncate font-medium">{s.title}</span>
                          <span className="mt-1 line-clamp-3 block text-xs text-muted">{s.text.split('\n').slice(1).join(' · ') || '—'}</span>
                        </span>
                      </button>
                      {s.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto border-t border-line bg-paper p-3">
                          {s.images.map((img) => {
                            const isDiagram = f.architecture.image?.path === img.path;
                            const isShot = f.media.screenshots.some((x) => x.path === img.path);
                            return (
                              <div key={img.path} className="w-36 shrink-0">
                                <img src={img.url} alt="" className={cn('h-20 w-36 rounded-lg border bg-white object-contain', isDiagram ? 'border-accent' : 'border-line')} />
                                <div className="mt-1 flex gap-1">
                                  <button onClick={() => setImageAsDiagram(img)} className={cn('chip flex-1 justify-center px-1 py-0.5 text-[10px]', isDiagram && 'chip-on')}>Diagram</button>
                                  <button onClick={() => addScreenshot(img)} className={cn('chip flex-1 justify-center px-1 py-0.5 text-[10px]', isShot && 'chip-on')}>Screenshot</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT */}
      {tab === 'content' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="card grid gap-4 p-5 md:grid-cols-2">
              <Field label="Project title *" className="md:col-span-2"><input className="input text-base" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Freight Invoice & Document AI" /></Field>
              <Field label="One-line pitch (tagline)" hint="One sentence a salesperson can read aloud." className="md:col-span-2"><textarea rows={2} className="input" value={f.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
              <Field label="Primary business domain *">
                <select className="input" value={f.industryId} onChange={(e) => set('industryId', e.target.value)}>
                  <option value="">Select…</option>
                  {industries.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </Field>
              <Field label="URL slug"><input className="input" value={f.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              <Field label="Also relevant for" className="md:col-span-2"><ChipSelect options={industryOpts.filter((o) => o.id !== f.industryId)} value={f.extraIndustryIds} onChange={(v) => set('extraIndustryIds', v)} /></Field>
            </div>

            <div className="card grid gap-4 p-5 md:grid-cols-3">
              <Field label="Client (real name — staff only)"><input className="input" value={f.clientName ?? ''} onChange={(e) => set('clientName', e.target.value || undefined)} /></Field>
              <Field label="Client shown as (public)" hint="e.g. “Leading UAE MEP contractor”"><input className="input" value={f.clientDisplay ?? ''} onChange={(e) => set('clientDisplay', e.target.value || undefined)} /></Field>
              <Field label="Region"><input className="input" value={f.region ?? ''} onChange={(e) => set('region', e.target.value || undefined)} placeholder="UAE · India" /></Field>
            </div>

            <div className="card space-y-4 p-5">
              <Field label="The problem" hint="Markdown supported."><textarea rows={4} className="input" value={f.problem} onChange={(e) => set('problem', e.target.value)} /></Field>
              <Field label="What we built *"><textarea rows={6} className="input" value={f.solution} onChange={(e) => set('solution', e.target.value)} /></Field>
              <Field label="The impact"><textarea rows={3} className="input" value={f.impact} onChange={(e) => set('impact', e.target.value)} /></Field>
              <Field label="ROI & metrics" hint="Only numbers you can stand behind."><MetricsEditor value={f.metrics} onChange={(v) => set('metrics', v)} /></Field>
              <Field label="Key capabilities" hint="One per line."><textarea rows={4} className="input" value={f.features.join('\n')} onChange={(e) => set('features', e.target.value.split('\n'))} /></Field>
            </div>

            <div className="card space-y-4 p-5">
              <Field label="Tech stack"><TagsInput value={f.techStack} onChange={(v) => set('techStack', v)} placeholder="Azure OpenAI, Copilot Studio…" suggestions={KNOWN_TECH_CLIENT} /></Field>
              <Field label="Client systems it connects to" hint="Drives the “AI on your stack” page and “Plug in your stack”."><ChipSelect options={platformOpts} value={f.platformIds} onChange={(v) => set('platformIds', v)} groupBy /></Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Maturity">
                  <select className="input" value={f.maturity} onChange={(e) => set('maturity', e.target.value as ProjectInput['maturity'])}>
                    {Object.entries(MATURITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label={`Reuse score — ${f.reuseScore ?? '—'}%`} hint="How much carries over to a new client in this domain.">
                  <input type="range" min={0} max={100} step={5} value={f.reuseScore ?? 50} onChange={(e) => set('reuseScore', Number(e.target.value))} className="w-full accent-[rgb(var(--accent))]" />
                </Field>
                <Field label="Typical deployment (weeks)"><input type="number" min={0} className="input" value={f.weeksToDeploy ?? ''} onChange={(e) => set('weeksToDeploy', e.target.value ? Number(e.target.value) : undefined)} /></Field>
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <GapsPanel gaps={gaps} onGo={setTab} />
            {!!f.aiSuggestions?.length && (
              <div className="card p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Lightbulb className="h-4 w-4 text-warn" /> AI editor notes</div>
                <ul className="space-y-1.5 text-[13px] text-muted">{f.aiSuggestions.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* MEDIA */}
      {tab === 'media' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><ImageIcon className="h-5 w-5" /> Architecture diagram</h3>
                {f.architecture.image && (
                  <div className="flex gap-1.5">
                    <button onClick={runDiagram} disabled={!aiOn || busy === 'diagram'} title={aiOn ? '' : 'Configure AI to enable'} className="btn-accent btn-sm">
                      {busy === 'diagram' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Read diagram with AI
                    </button>
                    <button onClick={() => set('architecture', { ...f.architecture, image: undefined })} className="btn-ghost btn-sm"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">Shown as-is on the project page (click to zoom). Pick it from the deck in step 1, or upload a PNG/JPG.</p>
              {f.architecture.image ? (
                <img src={f.architecture.image.url} alt="Architecture" className="mt-4 max-h-[420px] w-full rounded-xl border border-line bg-white object-contain p-2" />
              ) : null}
              <Uploader compact className="mt-4" folder={`${folder}/diagram`} accept="image/*" label={f.architecture.image ? 'Replace diagram' : 'Upload diagram image'} onUploaded={(img) => set('architecture', { ...f.architecture, image: img })} />
              <div className="mt-5 grid gap-4">
                <Field label="Flow (how data moves from source to outcome)"><FlowEditor value={f.architecture.flow} onChange={(v) => set('architecture', { ...f.architecture, flow: v })} /></Field>
                <Field label="Flow description"><textarea rows={3} className="input" value={f.architecture.description} onChange={(e) => set('architecture', { ...f.architecture, description: e.target.value })} /></Field>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Video className="h-5 w-5" /> Demo video</h3>
              <p className="mt-1 text-sm text-muted">For solutions that run on localhost: upload a screen recording (MP4/WebM) or paste a YouTube / Stream / SharePoint link. You can add this any time after publishing.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  {f.media.video ? (
                    <div className="space-y-2">
                      <video src={f.media.video.url} controls preload="metadata" className="aspect-video w-full rounded-xl border border-line bg-black" />
                      <button onClick={() => set('media', { ...f.media, video: undefined })} className="btn-ghost btn-sm"><Trash2 className="h-3.5 w-3.5" /> Remove video</button>
                    </div>
                  ) : (
                    <Uploader folder={`${folder}/video`} accept="video/mp4,video/webm,video/quicktime" label="Upload recording" hint="MP4 recommended" onUploaded={(v) => set('media', { ...f.media, video: v })} />
                  )}
                </div>
                <div className="space-y-4">
                  <Field label="…or video link"><input className="input" value={f.media.videoEmbedUrl ?? ''} onChange={(e) => set('media', { ...f.media, videoEmbedUrl: e.target.value || undefined })} placeholder="https://youtu.be/…" /></Field>
                  <Field label="Thumbnail / poster image">
                    {f.media.thumbnail ? (
                      <div className="flex items-center gap-3">
                        <img src={f.media.thumbnail.url} alt="" className="h-16 w-28 rounded-lg border border-line object-cover" />
                        <button onClick={() => set('media', { ...f.media, thumbnail: undefined })} className="btn-ghost btn-sm"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <Uploader compact folder={`${folder}/thumb`} accept="image/*" label="Upload thumbnail" onUploaded={(t) => set('media', { ...f.media, thumbnail: t })} />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display text-xl font-semibold">Live demo link</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <input className="input flex-1" value={f.demoUrl ?? ''} onChange={(e) => set('demoUrl', e.target.value.trim() || undefined)} placeholder="https://demo.yourapp.azurewebsites.net" />
                <button onClick={checkDemo} disabled={!f.demoUrl || busy === 'check'} className="btn-ghost">{busy === 'check' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check now</button>
              </div>
              {f.demoStatus && (
                <p className={cn('mt-2 text-sm', f.demoStatus.ok ? 'text-good' : 'text-bad')}>
                  {f.demoStatus.ok ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : <AlertTriangle className="mr-1 inline h-4 w-4" />}
                  {f.demoStatus.ok ? 'Reachable' : 'Not reachable'} · HTTP {f.demoStatus.code ?? f.demoStatus.error} · {timeAgo(f.demoStatus.checkedAt)}
                </p>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display text-xl font-semibold">Screenshots</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {f.media.screenshots.map((s, i) => (
                  <div key={s.path} className="overflow-hidden rounded-xl border border-line bg-paper">
                    <img src={s.url} alt="" className="aspect-[16/10] w-full bg-white object-contain" />
                    <div className="flex gap-1 p-2">
                      <input className="input py-1.5 text-xs" placeholder="Caption" value={s.caption ?? ''} onChange={(e) => set('media', { ...f.media, screenshots: f.media.screenshots.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)) })} />
                      <button onClick={() => set('media', { ...f.media, screenshots: f.media.screenshots.filter((_, k) => k !== i) })} className="btn-ghost h-8 w-8 shrink-0 p-0"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <Uploader compact multiple className="mt-3" folder={`${folder}/screens`} accept="image/*" label="Add screenshots" onUploaded={(img) => setF((x) => { setDirty(true); return { ...x, media: { ...x.media, screenshots: [...x.media.screenshots, img] } }; })} />
            </div>
          </div>
          <aside className="space-y-4"><GapsPanel gaps={gaps} onGo={setTab} /></aside>
        </div>
      )}

      {/* PUBLISH */}
      {tab === 'publish' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-display text-xl font-semibold">Who can see it?</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {([
                  ['public', 'Public', 'Anyone on the Atlas, and can be added to client links. Real client name hidden.'],
                  ['microsite', 'Client links only', 'Staff see it; clients only via a tailored /for/… link.'],
                  ['internal', 'Internal only', 'Staff only. Never shown on client links (e.g. NDA work).'],
                ] as const).map(([v, t, d]) => (
                  <button key={v} type="button" onClick={() => set('visibility', v)} className={cn('rounded-xl border p-4 text-left transition', f.visibility === v ? 'border-accent ring-4 ring-accent/10' : 'border-line hover:border-ink/30')}>
                    <div className="font-medium">{t}</div>
                    <div className="mt-1 text-xs text-muted">{d}</div>
                  </button>
                ))}
              </div>
              <div className="mt-5"><Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Feature on the home page" /></div>
            </div>
            <div className="card p-5">
              <h3 className="font-display text-xl font-semibold">Approval</h3>
              <p className="mt-1 text-sm text-muted">AI drafts, a human approves. Publishing makes the page live and indexes it for “Ask the Portfolio”.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {status !== 'review' && status !== 'published' && <button onClick={() => changeStatus('review')} disabled={pending} className="btn-ghost">Submit for review</button>}
                {canPublish && status !== 'published' && (
                  <button onClick={() => changeStatus('published')} disabled={pending || gaps.some((g) => g.level === 'block')} className="btn-accent"><CheckCircle2 className="h-4 w-4" /> Approve & publish</button>
                )}
                {status === 'published' && <button onClick={() => changeStatus('draft')} disabled={pending} className="btn-ghost">Unpublish</button>}
                {status !== 'archived' && <button onClick={() => changeStatus('archived')} disabled={pending} className="btn-ghost">Archive</button>}
              </div>
              {!canPublish && <p className="mt-3 text-xs text-muted">Your role can submit for review; an AI-team member or admin publishes.</p>}
              {status === 'published' && <Link href={`/projects/${f.slug}`} target="_blank" className="mt-4 inline-flex items-center gap-1 text-sm hover:underline">View live page <ArrowUpRight className="h-4 w-4" /></Link>}
            </div>
            <div className="card flex flex-wrap gap-2 p-5">
              <a href={`/api/export/pptx?project=${project.id}`} className="btn-ghost btn-sm">Download one-slide PPT</a>
              <form action={duplicateProject.bind(null, project.id)}><button className="btn-ghost btn-sm"><Copy className="h-3.5 w-3.5" /> Duplicate</button></form>
              <form action={deleteProject.bind(null, project.id)} onSubmit={(e) => { if (!confirm('Delete this project permanently?')) e.preventDefault(); }}>
                <button className="btn-ghost btn-sm text-bad"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </form>
            </div>
          </div>
          <aside><GapsPanel gaps={gaps} onGo={setTab} big /></aside>
        </div>
      )}
    </div>
  );
}

function StatusPill({ s }: { s: ProjectStatus }) {
  const c = { draft: 'bg-soft text-muted', review: 'bg-warn/15 text-warn', published: 'bg-good/15 text-good', archived: 'bg-soft text-muted' }[s];
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', c)}>{s}</span>;
}

function Completeness({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-good' : score >= 55 ? 'bg-warn' : 'bg-bad';
  return (
    <div className="hidden items-center gap-2 sm:flex" title="Completeness">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-soft"><div className={cn('h-full transition-all', color)} style={{ width: `${score}%` }} /></div>
      <span className="text-xs tabular-nums text-muted">{score}%</span>
    </div>
  );
}

export function GapsPanel({ gaps, onGo, big }: { gaps: Gap[]; onGo?: (t: Tab) => void; big?: boolean }) {
  const icon = { block: <X className="h-3.5 w-3.5 text-bad" />, warn: <AlertTriangle className="h-3.5 w-3.5 text-warn" />, tip: <Lightbulb className="h-3.5 w-3.5 text-muted" /> };
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">Gap check</span>
        <span className="text-xs text-muted">{completeness(gaps)}% complete</span>
      </div>
      {!gaps.length && <p className="flex items-center gap-2 text-sm text-good"><CheckCircle2 className="h-4 w-4" /> Nothing missing — ready to sell.</p>}
      <ul className="space-y-2">
        {gaps.map((g) => (
          <li key={g.id}>
            <button type="button" onClick={() => onGo?.(g.tab)} className="flex w-full gap-2 rounded-lg p-1.5 text-left hover:bg-soft">
              <span className="mt-0.5">{icon[g.level]}</span>
              <span>
                <span className="block text-[13px] font-medium">{g.label}</span>
                {big && <span className="block text-xs text-muted">{g.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
