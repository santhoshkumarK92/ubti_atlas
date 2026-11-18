'use client';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';

/** Friendly procedural 3D AI agent — follows the pointer, floats, blinks. No external model files. */
function Robot() {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const armL = useRef<Group>(null);

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.position.y = Math.sin(t * 1.4) * 0.08;
    if (head.current) {
      head.current.rotation.y += (pointer.x * 0.6 - head.current.rotation.y) * 0.08;
      head.current.rotation.x += (-pointer.y * 0.3 - head.current.rotation.x) * 0.08;
    }
    if (eyes.current) eyes.current.scale.y = Math.sin(t * 0.9) > 0.985 || (t % 4) > 3.9 ? 0.1 : 1;
    if (ring.current) ring.current.rotation.z = t * 0.8;
    if (armL.current) armL.current.rotation.z = -0.5 + Math.sin(t * 2.2) * 0.35;
  });

  const white = { color: '#f4f6ff', roughness: 0.25, metalness: 0.15 } as const;
  const glow = { color: '#5b6cff', emissive: '#5b6cff', emissiveIntensity: 1.6 } as const;

  return (
    <group ref={root} position={[0, -0.2, 0]}>
      {/* head */}
      <group ref={head} position={[0, 1.05, 0]}>
        <mesh><sphereGeometry args={[0.78, 48, 48]} /><meshStandardMaterial {...white} /></mesh>
        {/* visor */}
        <mesh position={[0, 0.02, 0.5]} scale={[1, 0.72, 0.55]}><sphereGeometry args={[0.62, 48, 48]} /><meshStandardMaterial color="#0b1020" roughness={0.1} metalness={0.6} /></mesh>
        <group ref={eyes} position={[0, 0.04, 0.9]}>
          <mesh position={[-0.22, 0, 0]}><capsuleGeometry args={[0.07, 0.1, 8, 16]} /><meshStandardMaterial {...glow} color="#7dd3fc" emissive="#38bdf8" /></mesh>
          <mesh position={[0.22, 0, 0]}><capsuleGeometry args={[0.07, 0.1, 8, 16]} /><meshStandardMaterial {...glow} color="#7dd3fc" emissive="#38bdf8" /></mesh>
        </group>
        {/* ear pods */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.2, 0.2, 0.14, 32]} /><meshStandardMaterial {...glow} /></mesh>
        ))}
        {/* antenna */}
        <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.025, 0.025, 0.3]} /><meshStandardMaterial {...white} /></mesh>
        <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.09, 24, 24]} /><meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} /></mesh>
      </group>

      {/* body */}
      <mesh position={[0, 0.05, 0]}><capsuleGeometry args={[0.5, 0.55, 16, 32]} /><meshStandardMaterial {...white} /></mesh>
      <mesh position={[0, 0.1, 0.49]}><circleGeometry args={[0.14, 32]} /><meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1.8} /></mesh>
      <mesh ref={ring} position={[0, 0.1, 0.495]}><torusGeometry args={[0.22, 0.015, 12, 48]} /><meshStandardMaterial {...glow} /></mesh>

      {/* arms */}
      <group ref={armL} position={[-0.62, 0.3, 0]}>
        <mesh position={[-0.12, -0.35, 0]} rotation={[0, 0, 0.2]}><capsuleGeometry args={[0.13, 0.5, 8, 16]} /><meshStandardMaterial {...white} /></mesh>
      </group>
      <group position={[0.62, 0.3, 0]} rotation={[0, 0, 0.45]}>
        <mesh position={[0.12, -0.35, 0]} rotation={[0, 0, -0.2]}><capsuleGeometry args={[0.13, 0.5, 8, 16]} /><meshStandardMaterial {...white} /></mesh>
      </group>

      {/* glow base */}
      <mesh position={[0, -1.15, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.03, 12, 64]} /><meshStandardMaterial {...glow} /></mesh>
    </group>
  );
}

export function Agent3D({ className }: { className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <div className={className} aria-label="3D AI agent" role="img">
      <Canvas
        camera={{ position: [0, 0.4, 7.4], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', () => setOk(false))}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} />
        <pointLight position={[-3, 1, 2]} intensity={14} color="#8b5cf6" />
        <pointLight position={[3, -1, 3]} intensity={10} color="#38bdf8" />
        <Robot />
      </Canvas>
    </div>
  );
}
