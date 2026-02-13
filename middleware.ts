import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('ape-auth-token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname !== '/login' && authToken !== 'Apedashboard') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname === '/login' && authToken === 'Apedashboard') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
