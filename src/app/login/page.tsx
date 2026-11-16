import { redirect } from 'next/navigation';
import { useFirebase } from '@/lib/config';
import { getUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';
import { Logo } from '@/components/ui/Logo';
import { Silk } from '@/components/site/Silk';

export const metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
  if (await getUser()) redirect(safeNext);
  const providers = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS || 'password,microsoft').split(',').map((s) => s.trim());
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Logo />
        <div className="mx-auto w-full max-w-sm">
          <h1 className="h-display text-5xl">Team sign-in</h1>
          <p className="mt-2 text-sm text-muted">For the UBTI AI team, sales, marketing and managers.</p>
          <div className="mt-8">
            <LoginForm mode={useFirebase ? 'firebase' : 'local'} providers={providers} next={safeNext} />
          </div>
        </div>
        <p className="text-xs text-muted">Client links (/for/…) never need a login.</p>
      </div>
      <div className="relative hidden border-l border-line md:block">
        <Silk labels={['Microsoft Fabric', 'Dynamics 365', 'Salesforce', 'Oracle', 'ServiceNow', 'SAP']} />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="h-display text-4xl text-[#1d2340] dark:text-white">Your data could be anywhere.<br />We bring the AI to it.</p>
        </div>
      </div>
    </div>
  );
}
