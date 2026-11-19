'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function LoginForm({ mode, providers, next }: { mode: 'firebase' | 'local'; providers: string[]; next: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'' | 'pw' | 'ms'>('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  async function finish(payload: Record<string, string>) {
    const r = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || 'Sign-in failed');
    window.location.href = next;
  }

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setBusy('pw');
    try {
      if (mode === 'local') await finish({ email, password });
      else {
        const { signInPassword } = await import('@/lib/firebase-client');
        await finish({ idToken: await signInPassword(email, password) });
      }
    } catch (e) {
      setErr(prettify((e as Error).message));
      setBusy('');
    }
  }

  async function withMicrosoft() {
    setErr(''); setBusy('ms');
    try {
      const { signInMicrosoft } = await import('@/lib/firebase-client');
      await finish({ idToken: await signInMicrosoft() });
    } catch (e) {
      setErr(prettify((e as Error).message));
      setBusy('');
    }
  }

  async function reset() {
    if (!email) { setErr('Enter your email first'); return; }
    const { resetPassword } = await import('@/lib/firebase-client');
    await resetPassword(email).catch(() => {});
    setInfo('If that account exists, a reset link is on its way.');
  }

  return (
    <div className="space-y-4">
      {mode === 'firebase' && providers.includes('microsoft') && (
        <>
          <button onClick={withMicrosoft} disabled={!!busy} className="btn-ghost w-full py-3">
            {busy === 'ms' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MsSquares />} Sign in with Microsoft
          </button>
          {providers.includes('password') && <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" /></div>}
        </>
      )}
      {(mode === 'local' || providers.includes('password')) && (
        <form onSubmit={withPassword} className="space-y-3">
          <div><label className="label">Work email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
          <div><label className="label">Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button disabled={!!busy} className="btn-dark w-full py-3">{busy === 'pw' && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
          {mode === 'firebase' && <button type="button" onClick={reset} className="text-xs text-muted hover:text-ink">Forgot password?</button>}
        </form>
      )}
      {mode === 'local' && (
        <p className="rounded-sm border border-dashed border-line bg-card p-3 text-xs text-muted">
          <b className="text-ink">Local mode</b> — Firebase isn&apos;t configured. Use any email and the <code>DEMO_ADMIN_PASSWORD</code> from <code>.env.local</code> (default <code>atlas-demo</code>). The first person to sign in becomes Admin.
        </p>
      )}
      {err && <p className="text-sm text-bad">{err}</p>}
      {info && <p className="text-sm text-good">{info}</p>}
    </div>
  );
}

function prettify(m: string) {
  if (m.includes('auth/invalid-credential') || m.includes('auth/wrong-password')) return 'Wrong email or password.';
  if (m.includes('auth/popup-closed')) return 'Sign-in window was closed.';
  if (m.includes('auth/user-not-found')) return 'No account for that email.';
  return m.replace('Firebase: ', '');
}

// Neutral four-square glyph (not the Microsoft logo) for the SSO button
function MsSquares() {
  return (
    <span className="grid h-4 w-4 grid-cols-2 gap-[2px]" aria-hidden>
      <span className="bg-ink/70" /><span className="bg-ink/50" /><span className="bg-ink/50" /><span className="bg-ink/70" />
    </span>
  );
}
