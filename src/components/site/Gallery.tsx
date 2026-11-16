'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { StoredFile } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Zoomable image (architecture diagram) */
export function ZoomImage({ file, alt, className }: { file: StoredFile; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={cn('group relative block w-full overflow-hidden rounded-2xl border border-line bg-white', className)}>
        <img src={file.url} alt={alt} className="mx-auto max-h-[560px] w-full object-contain p-3" />
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-paper opacity-0 transition group-hover:opacity-100"><Maximize2 className="h-4 w-4" /></span>
      </button>
      {open && <Lightbox files={[file]} start={0} onClose={() => setOpen(false)} />}
    </>
  );
}

export function Gallery({ files }: { files: StoredFile[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  if (!files.length) return null;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f, i) => (
          <button key={f.path || f.url} onClick={() => setIdx(i)} className="group overflow-hidden rounded-xl border border-line bg-card text-left">
            <img src={f.url} alt={f.caption || `Screenshot ${i + 1}`} loading="lazy" className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            {f.caption && <div className="border-t border-line px-3 py-2 text-xs text-muted">{f.caption}</div>}
          </button>
        ))}
      </div>
      {idx !== null && <Lightbox files={files} start={idx} onClose={() => setIdx(null)} />}
    </>
  );
}

function Lightbox({ files, start, onClose }: { files: StoredFile[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % files.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + files.length) % files.length);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [files.length, onClose]);
  const f = files[i]!;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#05070f]/90 p-4 backdrop-blur" onClick={onClose}>
      <button aria-label="Close" className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><X className="h-5 w-5" /></button>
      {files.length > 1 && (
        <>
          <button aria-label="Previous" onClick={(e) => { e.stopPropagation(); setI((x) => (x - 1 + files.length) % files.length); }} className="absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><ChevronLeft /></button>
          <button aria-label="Next" onClick={(e) => { e.stopPropagation(); setI((x) => (x + 1) % files.length); }} className="absolute right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><ChevronRight /></button>
        </>
      )}
      <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-6xl">
        <img src={f.url} alt={f.caption || ''} className="max-h-[85vh] rounded-xl bg-white object-contain" />
        {f.caption && <figcaption className="mt-3 text-center text-sm text-white/70">{f.caption}</figcaption>}
      </figure>
    </div>
  );
}
