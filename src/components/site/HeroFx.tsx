'use client';
import { useEffect, useRef, useState } from 'react';

function useTyped(lines: string[], startMs: number, loop: boolean) {
  const [li, setLi] = useState(0);
  const [n, setN] = useState(0);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOn(true); setN(lines[0]!.length); return; }
    const t = setTimeout(() => setOn(true), startMs);
    return () => clearTimeout(t);
  }, [lines, startMs]);
  useEffect(() => {
    if (!on) return;
    const line = lines[li]!;
    if (n < line.length) { const t = setTimeout(() => setN(n + 1), 38); return () => clearTimeout(t); }
    if (!loop || lines.length < 2) return;
    const t = setTimeout(() => { setLi((li + 1) % lines.length); setN(0); }, 2400);
    return () => clearTimeout(t);
  }, [on, n, li, lines, loop]);
  return { text: lines[li]!.slice(0, n), full: lines[li]!, started: on, li };
}

/** Types the text in, holds, erases it, and types it again (loop). Reserves its full height so nothing jumps. */
export function Typewriter({ text, delay = 700, className }: { text: string; delay?: number; className?: string }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'type' | 'hold' | 'erase'>('wait');
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce.current) { setN(text.length); return; }
    const t = setTimeout(() => setPhase('type'), delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  useEffect(() => {
    if (reduce.current) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    if (phase === 'type') {
      if (n < text.length) t = setTimeout(() => setN(n + 1), 45);
      else t = setTimeout(() => setPhase('hold'), 0);
    } else if (phase === 'hold') {
      t = setTimeout(() => setPhase('erase'), 2200);
    } else if (phase === 'erase') {
      if (n > 0) t = setTimeout(() => setN(n - 1), 24);
      else t = setTimeout(() => setPhase('type'), 450);
    }
    return () => { if (t) clearTimeout(t); };
  }, [phase, n, text]);

  const typed = text.slice(0, n);
  return (
    <p className={className} aria-label={text}>
      <span aria-hidden>{typed}</span>
      {phase !== 'wait' && <span aria-hidden className="tw-caret" />}
      <span aria-hidden className="invisible">{text.slice(n)}</span>
    </p>
  );
}

/** Speech bubble that pops beside the agent after it lands and types a few lines. */
export function AgentBubble({ lines, delay = 1900 }: { lines: string[]; delay?: number }) {
  const { text, started, li } = useTyped(lines, delay, true);
  const move = useRef<HTMLDivElement>(null);
  const bump = useRef(-1e9);
  useEffect(() => { bump.current = performance.now(); }, [li]);

  // Moves like the 3D agent: bobs on the same rhythm, leans toward the cursor, and bounces when it speaks a new line.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const m = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => { m.x = (e.clientX / window.innerWidth) * 2 - 1; m.y = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener('pointermove', onMove, { passive: true });
    let raf = 0;
    const tick = (now: number) => {
      const t = now / 1000;
      cur.x += (m.x - cur.x) * 0.08; cur.y += (m.y - cur.y) * 0.08;
      const b = Math.max(0, 1 - (now - bump.current) / 600);
      const hop = -Math.abs(Math.sin(b * Math.PI * 2.5)) * 10 * b; // little hops on each new line
      const x = cur.x * 14 + Math.sin(t * 0.9) * 3;
      const y = Math.sin(t * 1.4) * 7 + cur.y * 6 + hop;
      const r = cur.x * 3 + Math.sin(t * 1.1) * 1.2;
      if (move.current) move.current.style.transform = `translate(${x}px,${y}px) rotate(${r}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); };
  }, []);

  return (
    <div
      aria-hidden
      className="bubble-pop absolute left-1 top-[6%] z-10 max-w-[15.5rem] md:left-4 lg:left-auto lg:right-[66%] lg:top-[8%]"
      style={{ animationDelay: `${delay - 250}ms` }}
    >
      <div ref={move} className="glass relative rounded-2xl px-4 py-3 text-[14px] font-semibold leading-snug text-[#fefffa] will-change-transform" style={{ transformOrigin: '20% 100%' }}>
        <span className="block min-h-[2.6em]">{text}{started && <span className="tw-caret" />}</span>
        <i className="absolute -bottom-[7px] left-10 h-3.5 w-3.5 rotate-45 border-b border-r border-white/40 bg-white/20 lg:left-auto lg:right-7" />
      </div>
    </div>
  );
}
