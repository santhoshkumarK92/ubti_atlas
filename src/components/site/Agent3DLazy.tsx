'use client';
import dynamic from 'next/dynamic';

/** three.js is heavy — load it after the page has rendered so text and layout show up immediately. */
const Agent3D = dynamic(() => import('./Agent3D').then((m) => m.Agent3D), { ssr: false });

export function Agent3DLazy({ className }: { className?: string }) {
  return <Agent3D className={className} />;
}
