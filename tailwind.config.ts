import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: v('paper'),
        card: v('card'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        soft: v('soft'),
        accent: v('accent'),
        violet: v('violet'),
        good: v('good'),
        warn: v('warn'),
        bad: v('bad'),
      },
      fontFamily: {
        display: ['"Archivo Narrow"', 'Arial Narrow', 'sans-serif'],
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: { frame: '1320px' },
      keyframes: {
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(-4%,3%,0) scale(1.08)' },
        },
        dash: { to: { strokeDashoffset: '-24' } },
        marquee: { to: { transform: 'translateX(-50%)' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite reverse',
        dash: 'dash 1.2s linear infinite',
        marquee: 'marquee 40s linear infinite',
        'fade-up': 'fadeUp .5s ease both',
      },
    },
  },
  plugins: [],
} satisfies Config;
