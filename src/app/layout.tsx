import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'UBTI AI Atlas', template: '%s · UBTI AI Atlas' },
  description: 'Your data could be anywhere. We bring the AI to it. Ready-to-deploy AI agents for every industry, from the UBTI AI team.',
  robots: { index: false, follow: false }, // internal site
};

export const viewport: Viewport = { themeColor: '#0B1020' };

// Sets the theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('atlas-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
