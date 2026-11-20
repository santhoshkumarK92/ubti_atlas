'use client';
import { useEffect, useRef, useState } from 'react';

/** Counts up to a value like "-80%", "40+", "35 min" or "12k+" the first time it scrolls into view. */
export function CountUp({ value, className, ms = 1500 }: { value: string; className?: string; ms?: number }) {
  const m = value.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [k, setK] = useState(m ? 0 : 1);

  useEffect(() => {
    if (!m || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setK(1); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const u = Math.min(1, (now - t0) / ms);
        setK(1 - Math.pow(1 - u, 3));
        if (u < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!m) return <span className={className}>{value}</span>;
  const [, pre, num, post] = m;
  const dec = num!.includes('.') ? num!.split('.')[1]!.length : 0;
  return <span ref={ref} className={className}>{pre}{(parseFloat(num!) * k).toFixed(dec)}{post}</span>;
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n));

function useTween(target: number) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); from.current = target; return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / 600);
      const x = a + (target - a) * (1 - Math.pow(1 - u, 3));
      setV(x); from.current = x;
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function Slider({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-white/80">{label}</span>
        <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-white">{fmt(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))}
        className="roi-range h-2 w-full cursor-pointer appearance-none rounded-full"
        style={{ background: `linear-gradient(90deg,#f6c835 ${pct}%,rgba(255,255,255,.22) ${pct}%)` }}
      />
    </label>
  );
}

/** Interactive ROI estimator: the visitor's own numbers in, an illustrative annual saving out. */
export function RoiCalc() {
  const [hours, setHours] = useState(120);
  const [rate, setRate] = useState(45);
  const [share, setShare] = useState(50);
  const hoursBack = hours * 52 * (share / 100);
  const saving = hoursBack * rate;
  const sSave = useTween(saving);
  const sHours = useTween(hoursBack);

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 text-white md:p-8">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#f6c835]/30 blur-3xl" />
      <div className="relative">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a9c8f5]">ROI estimator</div>
        <h3 className="mt-2 text-[1.5rem] font-extrabold leading-tight tracking-[-0.035em]">What could one agent give back?</h3>
        <div className="mt-6 space-y-5">
          <Slider label="Hours a week spent on the manual task" value={hours} set={setHours} min={10} max={400} step={10} fmt={(n) => `${n} h`} />
          <Slider label="Loaded cost per hour" value={rate} set={setRate} min={15} max={150} step={5} fmt={(n) => `$${n}`} />
          <Slider label="Share the agent takes over" value={share} set={setShare} min={20} max={80} step={5} fmt={(n) => `${n}%`} />
        </div>
        <div className="mt-7 rounded-2xl border border-white/30 bg-white/10 p-5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/65">Estimated yearly saving</div>
          <div className="mt-1 text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-none tracking-[-0.05em] text-[#f6c835]" aria-live="polite">{usd(sSave)}</div>
          <div className="mt-2 text-[14px] text-white/80">≈ <b className="text-white">{Math.round(sHours).toLocaleString('en-US')}</b> hours given back to your team each year</div>
        </div>
        <p className="mt-4 text-[12px] leading-5 text-white/60">An illustration built from the numbers you enter, not a guarantee. Real results depend on the use case. We&apos;ll size it properly in a demo.</p>
      </div>
    </div>
  );
}
