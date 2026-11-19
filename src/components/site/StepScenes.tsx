import type { CSSProperties } from 'react';

/** Animated clay-style robot scenes — one per Atlas step. Pure SVG + CSS, no image files. */

const SKIN = '#e4d6c1';
const SKIN_D = '#d3c1a7';
const SKIN_L = '#f1e8d9';
const INK = '#5a4a3a';

const css = `
@keyframes sc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes sc-paper{0%{transform:translate(var(--dx),var(--dy)) rotate(var(--r,0deg));opacity:0}12%{opacity:1}68%{transform:translate(0,0) rotate(0deg);opacity:1}84%,100%{transform:translate(0,0) scale(.2);opacity:0}}
@keyframes sc-merge{0%,15%{transform:translate(var(--dx),var(--dy))}55%,100%{transform:translate(0,0)}}
@keyframes sc-bar{0%{transform:scaleY(.15)}60%,100%{transform:scaleY(1)}}
@keyframes sc-sway{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
@keyframes sc-check{0%,8%{stroke-dashoffset:14}22%,85%{stroke-dashoffset:0}96%,100%{stroke-dashoffset:14}}
@keyframes sc-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes sc-pulse{0%,100%{opacity:.15;transform:scale(.9)}50%{opacity:.55;transform:scale(1.1)}}
.sc *{transform-box:fill-box;transform-origin:center}
.sc-bob{animation:sc-bob 2.6s ease-in-out infinite}
.sc-eyes{animation:sc-blink 4s ease-in-out infinite}
.sc-paper{animation:sc-paper 3.6s ease-in-out infinite}
.sc-merge{animation:sc-merge 3.2s ease-in-out infinite alternate}
.sc-bar{transform-origin:bottom!important;animation:sc-bar 2.8s ease-out infinite alternate}
.sc-sway{animation:sc-sway 2.4s ease-in-out infinite}
.sc-check{stroke-dasharray:14;animation:sc-check 4.2s ease-in-out infinite}
.sc-pulse{animation:sc-pulse 3.2s ease-in-out infinite}
`;

type V = CSSProperties & Record<`--${string}`, string>;

function Doll() {
  return (
    <g>
      <ellipse cx="100" cy="180" rx="40" ry="6" fill="#000" opacity=".12" />
      <g className="sc-bob">
        <rect x="82" y="160" width="14" height="18" rx="7" fill={SKIN_D} />
        <rect x="104" y="160" width="14" height="18" rx="7" fill={SKIN_D} />
        <path d="M70 126q0-24 30-24t30 24v20q0 22-30 22t-30-22z" fill={SKIN} />
        <rect x="88" y="130" width="24" height="16" rx="6" fill={SKIN_D} />
        <circle cx="67" cy="82" r="7" fill={SKIN_D} />
        <circle cx="133" cy="82" r="7" fill={SKIN_D} />
        <circle cx="100" cy="80" r="35" fill={SKIN_L} />
        <path d="M80 62a28 28 0 0 1 22-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6" />
        <rect x="76" y="68" width="48" height="28" rx="14" fill={SKIN_D} />
        <rect x="80" y="71" width="40" height="22" rx="11" fill="#f6eee2" />
        <g className="sc-eyes">
          <circle cx="92" cy="82" r="3" fill={INK} />
          <circle cx="108" cy="82" r="3" fill={INK} />
        </g>
        <path d="M95 88q5 4 10 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
}

const arm = (d: string) => <path d={d} stroke={SKIN_D} strokeWidth="11" strokeLinecap="round" fill="none" />;

function Paper({ dx, dy, r, delay }: { dx: number; dy: number; r: number; delay: number }) {
  return (
    <g className="sc-paper" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, '--r': `${r}deg`, animationDelay: `${delay}s` } as V}>
      <rect x="93" y="132" width="14" height="17" rx="2" fill="#fbf5ea" stroke="#cdbb9f" strokeWidth="1" />
      <path d="M96 137h8M96 141h8M96 145h5" stroke="#cdbb9f" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

function Ingest() {
  return (
    <>
      <Doll />
      {arm('M72 126q-16-2-22-18')}
      {arm('M128 126q16-2 22-18')}
      <Paper dx={-90} dy={-80} r={-25} delay={0} />
      <Paper dx={88} dy={-95} r={20} delay={0.7} />
      <Paper dx={-100} dy={-10} r={-12} delay={1.4} />
      <Paper dx={96} dy={-20} r={30} delay={2.1} />
      <Paper dx={-50} dy={-120} r={10} delay={2.8} />
    </>
  );
}

function Block({ x, y, c, dx, dy, delay }: { x: number; y: number; c: string; dx: number; dy: number; delay: number }) {
  return (
    <g className="sc-merge" style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${delay}s` } as V}>
      <rect x={x} y={y} width="24" height="22" rx="4" fill={c} stroke="#00000022" />
      <rect x={x + 4} y={y + 4} width="9" height="3" rx="1.5" fill="#fff" opacity=".6" />
    </g>
  );
}

function Unify() {
  return (
    <>
      <circle className="sc-pulse" cx="146" cy="140" r="30" fill="#f6c835" />
      <g transform="translate(-32 0)">
        <Doll />
        {arm('M128 126q14-6 24-4')}
      </g>
      <Block x={120} y={150} c="#7fb0d6" dx={-10} dy={-110} delay={0} />
      <Block x={148} y={150} c="#6fb8ae" dx={50} dy={-90} delay={0.2} />
      <Block x={134} y={127} c="#f6c835" dx={40} dy={-40} delay={0.4} />
    </>
  );
}

function Analyze() {
  const bars: [number, number, string][] = [[116, 34, '#6fb8ae'], [134, 56, '#7fb0d6'], [152, 44, '#f6c835'], [170, 76, '#e58a8a']];
  return (
    <>
      <line x1="108" y1="172" x2="188" y2="172" stroke="#b9a584" strokeWidth="2" strokeLinecap="round" />
      {bars.map(([x, h, c], i) => (
        <rect key={x} className="sc-bar" x={x} y={172 - h} width="12" height={h} rx="2" fill={c} style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      <g transform="translate(-34 0)">
        <Doll />
        {arm('M128 128q12-4 20-14')}
        <g className="sc-sway">
          <circle cx="156" cy="104" r="13" fill="#ffffff55" stroke={INK} strokeWidth="3" />
          <line x1="165" y1="113" x2="174" y2="124" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </>
  );
}

function Act() {
  const rows = [50, 80, 110];
  return (
    <>
      <rect x="106" y="30" width="86" height="120" rx="8" fill="#fbf5ea" stroke="#cdbb9f" />
      <rect x="118" y="38" width="30" height="5" rx="2.5" fill="#cdbb9f" />
      {rows.map((y, i) => (
        <g key={y}>
          <rect x="118" y={y} width="14" height="14" rx="3" fill="none" stroke="#b9a584" strokeWidth="1.6" />
          <rect x="138" y={y + 4.5} width="42" height="5" rx="2.5" fill={SKIN_D} />
          <path className="sc-check" d={`M120.5 ${y + 7.5}l3.5 3.5l6-7.5`} fill="none" stroke="#1b8a80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${i * 0.8}s` }} />
        </g>
      ))}
      <g transform="translate(-40 0)">
        <Doll />
        {arm('M128 126q18-12 28-8')}
      </g>
    </>
  );
}

const SCENES = [Ingest, Unify, Analyze, Act];

export function StepScene({ step }: { step: 0 | 1 | 2 | 3 }) {
  const Scene = SCENES[step]!;
  return (
    <div className="sc aspect-square w-full bg-gradient-to-b from-[#eee4d4] to-[#d9c7ab]">
      <style>{css}</style>
      <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={['Ingest', 'Unify', 'Analyze', 'Act'][step]}>
        <Scene />
      </svg>
    </div>
  );
}
