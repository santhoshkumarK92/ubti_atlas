'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Msg { role: 'user' | 'assistant'; content: string; projects?: { slug: string; title: string; industry: string }[] }

const EXAMPLES = ['Do we have anything for invoice OCR in logistics?', 'Which agents work on top of Salesforce?', 'Show me voice agents', 'What can we pitch to an insurer?'];

/** "Ask the Portfolio" floating assistant. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    const history = msgs.map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: 'user', content: text }]);
    setQ('');
    setBusy(true);
    try {
      const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, history }) });
      const j = await r.json();
      setMsgs((m) => [...m, { role: 'assistant', content: j.answer ?? j.error ?? 'Something went wrong.', projects: j.projects }]);
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', content: 'Network error — please try again.' }]);
    } finally {
      setBusy(false);
    }
  }

  // Render "[slug]" references as plain text (cards are shown below the answer)
  const clean = (s: string) => s.replace(/\s?\[([a-z0-9-]+)\]/g, '');

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn('fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper shadow-[0_12px_30px_-10px_rgb(var(--ink)/.7)] transition hover:scale-[1.03]', open && 'hidden')}>
        <Sparkles className="h-4 w-4" /> Ask the Portfolio
      </button>
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(620px,calc(100vh-40px))] w-[min(420px,calc(100vw-40px))] animate-fade-up flex-col overflow-hidden rounded-3xl border border-line bg-paper shadow-2xl">
          <div className="flex items-center justify-between border-b border-line bg-card px-5 py-4">
            <div>
              <div className="font-display text-lg font-semibold">Ask the Portfolio</div>
              <div className="text-xs text-muted">Answers only from published Atlas projects</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-soft"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {!msgs.length && (
              <div className="space-y-2">
                <p className="text-sm text-muted">Try:</p>
                {EXAMPLES.map((e) => (
                  <button key={e} onClick={() => ask(e)} className="block w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-left text-sm hover:border-ink/30">{e}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' && 'justify-end')}>
                <div className={cn('max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-6', m.role === 'user' ? 'bg-ink text-paper' : 'border border-line bg-card')}>
                  <p className="whitespace-pre-wrap">{clean(m.content)}</p>
                  {!!m.projects?.length && (
                    <div className="mt-3 space-y-1.5">
                      {m.projects.slice(0, 4).map((p) => (
                        <Link key={p.slug} href={`/projects/${p.slug}`} onClick={() => setOpen(false)} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3 py-2 hover:border-ink/30">
                          <span className="font-medium">{p.title}</span>
                          <span className="shrink-0 text-[11px] text-muted">{p.industry}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2 border-t border-line bg-card p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about any use case…" className="input" />
            <button disabled={busy || !q.trim()} className="btn-dark h-[42px] w-[42px] shrink-0 p-0" aria-label="Send"><ArrowUp className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
