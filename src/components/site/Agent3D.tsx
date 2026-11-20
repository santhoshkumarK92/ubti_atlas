'use client';
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, DoubleSide, EdgesGeometry, PlaneGeometry, Quaternion, Vector3 } from 'three';
import type { Group, Mesh, MeshBasicMaterial, PointLight } from 'three';

type Act = 'wave' | 'jump' | 'dance' | 'look' | 'spin' | 'nod' | 'holo';
const DUR: Record<Act, number> = { wave: 2.8, jump: 1.1, dance: 3.2, look: 2.8, spin: 1.3, nod: 1.6, holo: 8 };
const IDLE: Act[] = ['holo', 'wave', 'look', 'jump', 'holo', 'dance', 'nod', 'wave'];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const env = (u: number) => Math.sin(Math.PI * clamp01(u)); // 0 → 1 → 0 over an action


const HW = 1.9, HH = 1.2; // hologram plane size (world units)
const smooth = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c); };

/** Draws one frame of the holographic dashboard (Jarvis-style) onto a 2D canvas. `k` = how "open" the screen is (0-1). */
function drawHolo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, k: number) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(8,28,70,.82)'); g.addColorStop(1, 'rgba(4,14,40,.72)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,220,255,.10)'; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  const cy = '#7fe9ff', am = '#f6c835';
  ctx.fillStyle = cy; ctx.font = '700 17px ui-monospace, Consolas, monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText('ATLAS // LIVE ANALYSIS', 20, 26);
  ctx.fillStyle = (Math.floor(t * 2) % 2) ? am : 'rgba(246,200,53,.25)'; ctx.beginPath(); ctx.arc(w - 26, 26, 6, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(127,233,255,.5)'; ctx.beginPath(); ctx.moveTo(16, 48); ctx.lineTo(w - 16, 48); ctx.stroke();
  // bars
  const bars = 7, bx = 24, by = h - 70, bh = 120;
  for (let i = 0; i < bars; i++) {
    const v = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.1 + i * 0.9))) * k;
    ctx.fillStyle = i % 3 === 0 ? am : cy; ctx.globalAlpha = 0.85;
    ctx.fillRect(bx + i * 24, by - bh * v, 15, bh * v);
  }
  ctx.globalAlpha = 1;
  // line chart
  const lx = 215, lw = 170, ly = 120, lh = 90;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const x = lx + (lw * i) / 40;
    const y = ly + lh - (0.45 + 0.28 * Math.sin(i * 0.35 + t * 2) + 0.14 * Math.sin(i * 0.9 - t * 3)) * lh * k;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = cy; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.lineTo(lx + lw, ly + lh); ctx.lineTo(lx, ly + lh); ctx.closePath();
  const ag = ctx.createLinearGradient(0, ly, 0, ly + lh); ag.addColorStop(0, 'rgba(127,233,255,.35)'); ag.addColorStop(1, 'rgba(127,233,255,0)');
  ctx.fillStyle = ag; ctx.fill();
  // gauge
  const gx = w - 82, gy = 150, pct = 0.94 * k;
  ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(127,233,255,.18)'; ctx.beginPath(); ctx.arc(gx, gy, 40, 0, 7); ctx.stroke();
  ctx.strokeStyle = am; ctx.beginPath(); ctx.arc(gx, gy, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '700 22px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(94 * k)}%`, gx, gy + 1); ctx.textAlign = 'left';
  // status lines
  ctx.font = '600 13px ui-monospace, Consolas, monospace';
  const rows = ['INGEST  > 12 sources connected', 'UNIFY   > semantic layer ready', 'ANALYZE > 3 anomalies found', 'ACT     > 5 tasks created'];
  rows.forEach((r, i) => {
    const shown = Math.floor(clamp01((k * 4 - i) * 0.9) * r.length);
    ctx.fillStyle = i === 3 ? am : 'rgba(200,245,255,.9)';
    ctx.fillText(r.slice(0, shown) + (shown < r.length && shown > 0 ? '_' : ''), 210, h - 78 + i * 18);
  });
  // scanline sweep + corner ticks
  const sy = ((t * 90) % (h + 40)) - 20;
  const sg = ctx.createLinearGradient(0, sy - 18, 0, sy + 18); sg.addColorStop(0, 'rgba(127,233,255,0)'); sg.addColorStop(0.5, 'rgba(127,233,255,.28)'); sg.addColorStop(1, 'rgba(127,233,255,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, sy - 18, w, 36);
  ctx.strokeStyle = cy; ctx.lineWidth = 3;
  const corners: [number, number, number, number][] = [[4, 4, 1, 1], [w - 4, 4, -1, 1], [4, h - 4, 1, -1], [w - 4, h - 4, -1, -1]];
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath(); ctx.moveTo(x, y + dy * 22); ctx.lineTo(x, y); ctx.lineTo(x + dx * 22, y); ctx.stroke();
  }
}

/** Friendly procedural 3D AI agent — idles with a rotating set of actions (wave, jump, dance, look around, nod),
 *  follows the pointer with head and eyes, reacts to hover, and spins + jumps when clicked. No external model files. */
function Robot({ wrap }: { wrap: React.RefObject<HTMLDivElement | null> }) {
  const root = useRef<Group>(null);
  const spinG = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const ant = useRef<Mesh>(null);
  const act = useRef<{ name: Act; at: number } | null>(null);
  const nextAt = useRef(0);
  const pick = useRef(0);
  const hover = useRef(0);
  const hovered = useRef(false);
  const holoG = useRef<Group>(null);
  const panelMat = useRef<MeshBasicMaterial>(null);
  const beam = useRef<Mesh>(null);
  const beamMat = useRef<MeshBasicMaterial>(null);
  const hand = useRef<Mesh>(null);
  const holoLight = useRef<PointLight>(null);
  const holo = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 512; c.height = 324;
    return { c, ctx: c.getContext('2d')!, tex: new CanvasTexture(c), edges: new EdgesGeometry(new PlaneGeometry(HW, HH)) };
  }, []);
  const tmp = useMemo(() => ({ a: new Vector3(), b: new Vector3(), d: new Vector3(), q: new Quaternion(), up: new Vector3(0, 1, 0) }), []);
  const gl = useThree((st) => st.gl);
  const clock = useThree((st) => st.clock);

  const start = (name: Act, t: number) => { act.current = { name, at: t }; };

  useFrame(({ clock, pointer, viewport, camera }) => {
    const t = clock.elapsedTime;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // intro: spin ~2.5 turns while falling, locked to the CSS drop animation so they stay in sync
    const anim = wrap.current?.getAnimations?.().find((x) => (x as CSSAnimation).animationName === 'agent-drop');
    const ct = anim ? Number(anim.currentTime ?? 0) : 1e9;
    const intro = clamp01((ct - 350) / 1500);
    const introDone = ct >= 2100;
    const introSpin = reduce ? 0 : Math.pow(1 - intro, 2.2) * Math.PI * 5;

    // pick the next idle action every few seconds once the intro has finished
    if (introDone && !reduce) {
      if (nextAt.current === 0) nextAt.current = t + 1.2;
      const cur = act.current;
      if (cur && t - cur.at > DUR[cur.name]) { act.current = null; nextAt.current = t + 2.2 + (pick.current % 3) * 0.8; }
      if (!act.current && t > nextAt.current) start(IDLE[pick.current++ % IDLE.length]!, t);
    }
    const a = act.current;
    const u = a ? (t - a.at) / DUR[a.name] : 0;
    const e = a ? env(u) : 0;
    const is = (n: Act) => a?.name === n;
    const ht = a && is('holo') ? t - a.at : 0;
    const he = a && is('holo') ? smooth(ht / 0.7) * smooth((DUR.holo - ht) / 0.7) : 0; // how open the screen is
    const vw = viewport.getCurrentViewport(camera, [0, 0, 0.9]).width;
    const pw = Math.min(HW, vw * 0.5 * 1.05); // panel width that fits the canvas
    const pcx = vw * 0.5 - pw * 0.5 - 0.03; // panel centre x (world)
    const shift = Math.min(0.9, pw * 0.5 + 0.1);

    // hover blend
    hover.current += ((hovered.current ? 1 : 0) - hover.current) * 0.12;
    const h = hover.current;

    // body: float + action offsets
    let y = Math.sin(t * 1.4) * 0.08, x = 0, rz = 0, sy = 1;
    if (is('jump') || is('spin')) {
      const j = Math.sin(Math.PI * clamp01(u));
      y += j * (is('jump') ? 0.75 : 0.45);
      sy = 1 - 0.12 * Math.max(0, 1 - Math.abs(u - 0.05) * 14) + 0.06 * j;
    }
    if (is('dance')) { x = Math.sin((t - a!.at) * 3) * 0.16 * e; rz = Math.sin((t - a!.at) * 6) * 0.13 * e; y += Math.abs(Math.sin((t - a!.at) * 6)) * 0.12 * e; }
    x -= shift * he;
    y += h * 0.06;
    if (root.current) {
      root.current.position.set(x, y - 0.2, 0);
      root.current.rotation.z = rz + pointer.x * 0.04;
      root.current.scale.set(1 + (1 - sy) * 0.6, sy, 1 + (1 - sy) * 0.6);
    }
    if (spinG.current) {
      // click / spin action: one full, eased turn
      const turn = is('spin') ? (1 - Math.pow(1 - clamp01(u), 3)) * Math.PI * 2 : 0;
      spinG.current.rotation.y = introSpin + turn;
    }

    // head: follows the pointer; actions layer on top
    if (head.current) {
      let ty = pointer.x * 0.6, tx = -pointer.y * 0.3, tz = 0;
      if (is('look')) ty = Math.sin((t - a!.at) * 2.6) * 0.85 * e;
      if (is('nod')) tx = 0.25 + Math.sin((t - a!.at) * 9) * 0.22 * e;
      if (is('wave')) tz = 0.16 * e;
      if (is('dance')) { tz = Math.sin((t - a!.at) * 6) * 0.2 * e; tx = Math.sin((t - a!.at) * 12) * 0.1 * e; }
      if (is('holo')) { ty = ty * 0.3 + 0.45 * he; tx = -0.05 * he; tz = 0.06 * he; }
      tx += h * -0.12;
      const k = 0.1;
      head.current.rotation.y += (ty - head.current.rotation.y) * k;
      head.current.rotation.x += (tx - head.current.rotation.x) * k;
      head.current.rotation.z += (tz - head.current.rotation.z) * k;
    }
    // eyes: track the cursor inside the visor, blink, widen when hovered
    if (eyes.current) {
      eyes.current.position.x += (pointer.x * 0.07 - eyes.current.position.x) * 0.15;
      eyes.current.position.y += (0.04 + pointer.y * 0.04 - eyes.current.position.y) * 0.15;
      const blink = (t % 4) > 3.88 || (is('nod') && (t - a!.at) % 0.8 > 0.7) ? 0.1 : 1;
      eyes.current.scale.set(1 + h * 0.2, blink * (1 + h * 0.35), 1);
    }
    if (ring.current) ring.current.rotation.z = t * (0.8 + h * 2.5);
    if (ant.current) ant.current.position.x = Math.sin(t * 3) * 0.04 + (is('dance') ? Math.sin(t * 9) * 0.07 : 0);

    // arms
    const raiseJump = is('jump') || is('spin') ? e * 2.4 : 0;
    if (armL.current) {
      let z = -0.5 + Math.sin(t * 2.2) * 0.35;
      if (is('dance')) z = -1.2 + Math.sin((t - a!.at) * 6) * 0.9 * e - (1 - e) * 0;
      z = z * (1 - raiseJump / 2.4) + -raiseJump;
      z += h * -0.6;
      armL.current.rotation.z += (z - armL.current.rotation.z) * 0.25;
    }
    if (armR.current) {
      let z = 0.45 + Math.sin(t * 2.2 + 1) * 0.08;
      if (is('wave')) z = 0.45 + (2.6 - 0.45) * clamp01(e * 1.6) + Math.sin((t - a!.at) * 10) * 0.28 * clamp01(e * 2);
      if (is('dance')) z = 1.2 - Math.sin((t - a!.at) * 6) * 0.9 * e;
      if (is('holo')) z = 0.45 + (1.95 - 0.45) * he + Math.sin(t * 2.4) * 0.04 * he;
      z = z * (1 - raiseJump / 2.4) + raiseJump;
      z += h * 0.6;
      armR.current.rotation.z += (z - armR.current.rotation.z) * 0.25;
    }

    // hologram screen: flickers open from the raised hand, shows an animated dashboard, folds away
    if (holoG.current && holo) {
      const live = he > 0.001;
      const stage = wrap.current?.closest<HTMLElement>('[data-hero-stage]');
      const hide = he > 0.02;
      if (stage && (stage.dataset.holo === 'on') !== hide) stage.dataset.holo = hide ? 'on' : 'off';
      holoG.current.visible = live;
      if (beam.current) beam.current.visible = live;
      if (hand.current) hand.current.visible = live;
      if (live) {
        const unfold = smooth(he * 1.15);
        const flick = he < 0.98 ? 0.75 + 0.25 * Math.sin(t * 60) : 1;
        const lx = pcx - (root.current?.position.x ?? 0);
        holoG.current.position.set(lx, 1.2 + Math.sin(t * 1.6) * 0.04, 0.9);
        holoG.current.rotation.y = -0.18 + pointer.x * 0.08;
        holoG.current.scale.set((pw / HW) * unfold, (pw / HW) * Math.max(0.03, unfold), 1);
        drawHolo(holo.ctx, holo.c.width, holo.c.height, t, smooth((he - 0.35) / 0.65));
        holo.tex.needsUpdate = true;
        if (panelMat.current) panelMat.current.opacity = 0.96 * flick * he;
        tmp.a.set(1.24, 0.64, 0.12); tmp.b.set(lx, 1.2, 0.9);
        const L = tmp.a.distanceTo(tmp.b);
        if (beam.current) {
          beam.current.position.copy(tmp.a).add(tmp.b).multiplyScalar(0.5);
          tmp.d.copy(tmp.a).sub(tmp.b).normalize();
          tmp.q.setFromUnitVectors(tmp.up, tmp.d);
          beam.current.quaternion.copy(tmp.q);
          beam.current.scale.set(pw * 0.62, L, pw * 0.62);
        }
        if (beamMat.current) beamMat.current.opacity = 0.16 * he * flick;
        if (hand.current) { hand.current.position.copy(tmp.a); hand.current.scale.setScalar(0.6 + he * (1 + Math.sin(t * 8) * 0.25)); }
        if (holoLight.current) { holoLight.current.intensity = 9 * he; holoLight.current.position.set(lx, 1.2, 1.4); }
      }
    }
  });

  const white = { color: '#f4f6ff', roughness: 0.25, metalness: 0.15 } as const;
  const glow = { color: '#2b857c', emissive: '#2b857c', emissiveIntensity: 1.6 } as const;

  return (
    <group
      ref={root}
      position={[0, -0.2, 0]}
      onPointerOver={() => { hovered.current = true; gl.domElement.style.cursor = 'pointer'; }}
      onPointerOut={() => { hovered.current = false; gl.domElement.style.cursor = ''; }}
      onClick={() => start(act.current?.name === 'spin' ? 'jump' : 'spin', clock.elapsedTime)}
    >
    <group ref={spinG}>
      {/* head */}
      <group ref={head} position={[0, 1.05, 0]}>
        <mesh><sphereGeometry args={[0.78, 48, 48]} /><meshStandardMaterial {...white} /></mesh>
        {/* visor */}
        <mesh position={[0, 0.02, 0.5]} scale={[1, 0.72, 0.55]}><sphereGeometry args={[0.62, 48, 48]} /><meshStandardMaterial color="#0b1020" roughness={0.1} metalness={0.6} /></mesh>
        <group ref={eyes} position={[0, 0.04, 0.9]}>
          <mesh position={[-0.22, 0, 0]}><capsuleGeometry args={[0.07, 0.1, 8, 16]} /><meshStandardMaterial {...glow} color="#bdf2e9" emissive="#2dd4bf" /></mesh>
          <mesh position={[0.22, 0, 0]}><capsuleGeometry args={[0.07, 0.1, 8, 16]} /><meshStandardMaterial {...glow} color="#bdf2e9" emissive="#2dd4bf" /></mesh>
        </group>
        {/* ear pods */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 0.14, 32]} /><meshStandardMaterial {...glow} /></mesh>
        ))}
        {/* antenna */}
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.025, 0.025, 0.3]} /><meshStandardMaterial {...white} /></mesh>
        <mesh ref={ant} position={[0, 1.1, 0]}><sphereGeometry args={[0.09, 24, 24]} /><meshStandardMaterial color="#f6c835" emissive="#f6c835" emissiveIntensity={2} /></mesh>
      </group>

      {/* body */}
      <mesh position={[0, 0.05, 0]}><capsuleGeometry args={[0.5, 0.55, 16, 32]} /><meshStandardMaterial {...white} /></mesh>
      <mesh position={[0, 0.1, 0.49]}><circleGeometry args={[0.14, 32]} /><meshStandardMaterial color="#f6c835" emissive="#f6c835" emissiveIntensity={1.8} /></mesh>
      <mesh ref={ring} position={[0, 0.1, 0.495]}><torusGeometry args={[0.22, 0.015, 12, 48]} /><meshStandardMaterial {...glow} /></mesh>

      {/* arms */}
      <group ref={armL} position={[-0.62, 0.3, 0]}>
        <mesh position={[-0.12, -0.35, 0]} rotation={[0, 0, 0.2]}><capsuleGeometry args={[0.13, 0.5, 8, 16]} /><meshStandardMaterial {...white} /></mesh>
      </group>
      <group ref={armR} position={[0.62, 0.3, 0]} rotation={[0, 0, 0.45]}>
        <mesh position={[0.12, -0.35, 0]} rotation={[0, 0, -0.2]}><capsuleGeometry args={[0.13, 0.5, 8, 16]} /><meshStandardMaterial {...white} /></mesh>
      </group>

      {/* glow base */}
      <mesh position={[0, -1.15, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.03, 12, 64]} /><meshStandardMaterial {...glow} /></mesh>
    </group>

      {/* holographic screen projected from the raised hand */}
      {holo && (
        <>
          <mesh ref={beam} visible={false}>
            <coneGeometry args={[0.5, 1, 32, 1, true]} />
            <meshBasicMaterial ref={beamMat} color="#7fe9ff" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
          </mesh>
          <mesh ref={hand} visible={false}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#bdf6ff" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          <group ref={holoG} visible={false}>
            <mesh>
              <planeGeometry args={[HW, HH]} />
              <meshBasicMaterial ref={panelMat} map={holo.tex} transparent opacity={0} side={DoubleSide} depthWrite={false} toneMapped={false} />
            </mesh>
            <lineSegments geometry={holo.edges}>
              <lineBasicMaterial color="#9cf0ff" transparent opacity={0.9} toneMapped={false} />
            </lineSegments>
            <pointLight ref={holoLight} color="#7fe9ff" intensity={0} distance={6} />
          </group>
        </>
      )}
    </group>
  );
}

export function Agent3D({ className }: { className?: string }) {
  const [ok, setOk] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);
  if (!ok) return null;
  return (
    <div ref={wrap} className={className} aria-label="3D AI agent" role="img">
      <Canvas
        camera={{ position: [0, 0.4, 7.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', () => setOk(false))}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, 1, 2]} intensity={14} color="#f6c835" />
        <pointLight position={[3, -1, 3]} intensity={10} color="#2dd4bf" />
        <Robot wrap={wrap} />
      </Canvas>
    </div>
  );
}
