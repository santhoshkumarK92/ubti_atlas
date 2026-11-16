'use client';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('atlas-theme', dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className={className ?? 'grid h-9 w-9 place-items-center rounded-full border border-line bg-card hover:border-ink/40'}>
      <Sun className="hidden h-4 w-4 dark:block" />
      <Moon className="h-4 w-4 dark:hidden" />
    </button>
  );
}
