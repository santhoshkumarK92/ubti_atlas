import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session';

// Routes that never need a login, even when SITE_REQUIRE_LOGIN=true
const OPEN = [/^\/login/, /^\/for\//, /^\/api\/auth\//, /^\/api\/track/, /^\/api\/files\//, /^\/api\/cron\//, /^\/api\/leads/];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const siteLocked = process.env.SITE_REQUIRE_LOGIN === 'true' && !OPEN.some((r) => r.test(pathname));

  if (!session && (isAdmin || siteLocked)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)'],
};
