'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Watches what is painted behind the transparent header and flips it between light-on-dark and dark-on-light. */
export function HeaderTone() {
  const path = usePathname();
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header[data-hd]');
    if (!header) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const y = header.offsetHeight / 2;
      // sections declare their tone (data-zone="dark", or the .navy-zone class); anything else is a light page
      let tone: 'dark' | 'light' = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      if (tone === 'light') {
        for (const z of document.querySelectorAll<HTMLElement>('[data-zone], .navy-zone')) {
          const r = z.getBoundingClientRect();
          if (r.top <= y && r.bottom > y) { tone = z.dataset.zone === 'light' ? 'light' : 'dark'; break; }
        }
      }
      header.dataset.tone = tone;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(measure); };
    measure();
    const t = setTimeout(measure, 400);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    const iv = setInterval(kick, 700); // catches theme toggles and late-loading content
    return () => { clearTimeout(t); clearInterval(iv); window.removeEventListener('scroll', kick); window.removeEventListener('resize', kick); if (raf) cancelAnimationFrame(raf); };
  }, [path]);
  return null;
}
