'use client';
import { useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import type { StoredFile } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Ask the server for an upload URL, then PUT the file straight to storage with progress. */
export async function uploadFile(file: File, folder: string, onProgress?: (pct: number) => void): Promise<StoredFile> {
  const r = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', folder, size: file.size }),
  });
  const ticket = await r.json();
  if (!r.ok) throw new Error(ticket.error || 'Upload refused');
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', ticket.uploadUrl);
    for (const [k, v] of Object.entries(ticket.headers as Record<string, string>)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}). If using Firebase, apply storage.cors.json to the bucket.`)));
    xhr.onerror = () => reject(new Error('Network error during upload. If using Firebase, apply storage.cors.json to the bucket.'));
    xhr.send(file);
  });
  return { ...ticket.file, name: file.name } as StoredFile;
}

export function Uploader({
  folder, accept, onUploaded, label = 'Upload a file', hint, multiple, className, compact,
}: {
  folder: string;
  accept?: string;
  onUploaded: (f: StoredFile) => void | Promise<void>;
  label?: string;
  hint?: string;
  multiple?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setErr('');
    try {
      for (const f of Array.from(files)) {
        setPct(0);
        const stored = await uploadFile(f, folder, setPct);
        await onUploaded(stored);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPct(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
        disabled={pct !== null}
        className={cn(
          'flex w-full items-center justify-center gap-3 rounded-md border border-dashed border-line bg-card text-sm text-muted transition hover:border-accent hover:text-ink',
          compact ? 'px-4 py-3' : 'flex-col px-6 py-10',
          drag && 'border-accent bg-accent/5',
        )}
      >
        {pct !== null ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className={compact ? 'h-4 w-4' : 'h-7 w-7'} strokeWidth={1.5} />}
        <span className="font-medium text-ink">{pct !== null ? `Uploading… ${pct}%` : label}</span>
        {hint && !compact && <span className="text-xs">{hint}</span>}
      </button>
      {pct !== null && <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft"><div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>}
      {err && <p className="mt-2 text-xs text-bad">{err}</p>}
      <input ref={input} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => handle(e.target.files)} />
    </div>
  );
}
