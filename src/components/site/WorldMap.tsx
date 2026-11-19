import fs from 'node:fs';
import path from 'node:path';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { Reveal } from '@/components/site/Reveal';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

const W = 1000;
const H = 500;

type Region = 'US' | 'India' | 'UAE';
const COLORS: Record<Region, string> = { US: '#337cb7', India: '#2b857c', UAE: '#dc3f4a' };

// [name, lon, lat, size, region]
const SITES: [string, number, number, number, Region][] = [
  ['New York', -74.0, 40.7, 1.2, 'US'], ['Washington DC', -77.0, 38.9, 0.9, 'US'], ['Atlanta', -84.4, 33.7, 0.9, 'US'],
  ['Chicago', -87.6, 41.9, 1, 'US'], ['Dallas', -96.8, 32.8, 1, 'US'], ['Houston', -95.4, 29.8, 0.8, 'US'],
  ['Denver', -105.0, 39.7, 0.8, 'US'], ['Seattle', -122.3, 47.6, 1, 'US'], ['San Francisco', -122.4, 37.8, 1.2, 'US'],
  ['Los Angeles', -118.2, 34.1, 1, 'US'], ['Boston', -71.1, 42.4, 0.8, 'US'], ['Miami', -80.2, 25.8, 0.8, 'US'],
  ['Bengaluru', 77.6, 12.97, 1.3, 'India'], ['Mumbai', 72.9, 19.1, 1.1, 'India'], ['Delhi', 77.2, 28.6, 1.1, 'India'],
  ['Chennai', 80.3, 13.1, 1, 'India'], ['Hyderabad', 78.5, 17.4, 1, 'India'], ['Pune', 73.9, 18.5, 0.8, 'India'],
  ['Dubai', 55.3, 25.2, 1.3, 'UAE'], ['Abu Dhabi', 54.4, 24.5, 1, 'UAE'],
];

function build() {
  const topo = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'node_modules/world-atlas/countries-110m.json'), 'utf8')) as Topology;
  const countries = topo.objects.countries as GeometryCollection<{ name: string }>;
  const keep: GeometryCollection<{ name: string }> = { ...countries, geometries: countries.geometries.filter((g) => (g.properties as { name?: string } | undefined)?.name !== 'Antarctica') };
  const land = feature(topo, keep);
  const proj = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], land);
  const gp = geoPath(proj);
  const borders = mesh(topo, keep, (a, b) => a !== b);
  const dots = SITES.map(([name, lon, lat, size, region], i) => {
    const [x, y] = proj([lon, lat])!;
    return { name, x, y, size, region, delay: (i * 0.37) % 3 };
  });
  return { land: gp(land) ?? '', borders: gp(borders) ?? '', dots };
}

/** World map with pulsing dots where our AI agents run — flat parchment land, white borders. */
export function WorldMap() {
  const { land, borders, dots } = build();
  return (
    <section className="relative border-b border-ink bg-[#f8f6f2] dark:bg-card">
      <i aria-hidden className="rail-seg" style={{ ['--c' as string]: '#337cb7' }} />
      <div className="rail-pad pt-16 md:pt-24">
        <Reveal as="p" className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">Around the world</Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal as="h2" delay={80} className="max-w-3xl text-[clamp(2.4rem,5vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
            AI agents at work in the <mark className="bg-transparent text-accent">US, India &amp; UAE.</mark>
          </Reveal>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {(Object.keys(COLORS) as Region[]).map((r) => (
              <li key={r} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[r] }} />{r === 'US' ? 'United States' : r === 'UAE' ? 'United Arab Emirates' : 'India'}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rail-pad relative mt-8 pb-14"><Reveal delay={100} className="max-w-4xl">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="World map showing UBTI AI deployments in the United States, India and the UAE">
          <style>{`
            @keyframes wm-ring{0%{transform:scale(.4);opacity:.85}100%{transform:scale(3.2);opacity:0}}
            @keyframes wm-blink{0%,100%{opacity:1}50%{opacity:.25}}
            .wm-ring{transform-box:fill-box;transform-origin:center;animation:wm-ring 2.8s ease-out infinite}
            .wm-core{animation:wm-blink 1.8s ease-in-out infinite}
            @media (prefers-reduced-motion:reduce){.wm-ring,.wm-core{animation:none}.wm-ring{opacity:.35}}
          `}</style>
          <path d={land} className="fill-[#e3dac9] dark:fill-[#26302e]" />
          <path d={borders} fill="none" stroke="#fefffa" strokeWidth={0.6} className="dark:stroke-[#10201e]" />
          {dots.map((d) => (
            <g key={d.name}>
              <title>{d.name}</title>
              <circle className="wm-ring" cx={d.x} cy={d.y} r={7 * d.size} fill={COLORS[d.region]} fillOpacity={0.45} style={{ animationDelay: `${d.delay}s` }} />
              <circle className="wm-ring" cx={d.x} cy={d.y} r={7 * d.size} fill="none" stroke={COLORS[d.region]} strokeWidth={1.2} style={{ animationDelay: `${d.delay + 0.9}s` }} />
              <circle className="wm-core" cx={d.x} cy={d.y} r={2.6 * d.size} fill="#0c0f14" stroke="#fefffa" strokeWidth={1} style={{ animationDelay: `${d.delay}s` }} />
            </g>
          ))}
        </svg>
      </Reveal></div>
    </section>
  );
}
