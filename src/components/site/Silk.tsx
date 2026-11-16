// Animated "silk" hero art — flowing lines over drifting gradients. Pure SVG/CSS.
const lines = Array.from({ length: 26 }, (_, k) => {
  const y = 40 + k * 17;
  const a = 70 + (k % 5) * 14;
  return `M-60 ${y} C 180 ${y - a}, 360 ${y + a * 1.3}, 620 ${y - 10} S 1060 ${y - a * 0.9}, 1320 ${y + 20}`;
});

export function Silk({ labels = [] }: { labels?: string[] }) {
  return (
    <div className="silk">
      <i className="left-[-10%] top-[-20%] h-[70%] w-[60%] animate-drift bg-[#c7cdff]" />
      <i className="right-[-10%] top-[10%] h-[80%] w-[55%] animate-drift-slow bg-[#ddd0ff]" />
      <i className="bottom-[-30%] left-[20%] h-[70%] w-[60%] animate-drift bg-[#cfe0ff]" />
      <svg viewBox="0 0 1240 520" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="silk-stroke" x1="0" x2="1">
            <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity=".05" />
            <stop offset=".45" stopColor="rgb(var(--accent))" stopOpacity=".55" />
            <stop offset="1" stopColor="rgb(var(--violet))" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <g className="origin-center animate-drift-slow">
          {lines.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="url(#silk-stroke)" strokeWidth={i % 4 === 0 ? 1.6 : 0.8} />
          ))}
        </g>
      </svg>
      {labels.slice(0, 8).map((l, i) => {
        const pos = [
          'left-[7%] top-[16%]', 'left-[38%] top-[9%]', 'right-[10%] top-[20%]', 'left-[16%] top-[52%]',
          'right-[26%] top-[46%]', 'left-[46%] bottom-[16%]', 'right-[6%] bottom-[22%]', 'left-[5%] bottom-[12%]',
        ][i];
        return (
          <span key={l} className={`absolute ${pos} animate-fade-up rounded-full border border-white/60 bg-white/60 px-3 py-1 text-xs font-medium text-[#1d2340] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-white`} style={{ animationDelay: `${i * 120}ms` }}>
            {l}
          </span>
        );
      })}
    </div>
  );
}
