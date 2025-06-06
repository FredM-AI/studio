
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'app_session_active';

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === 'true';
  const { pathname } = request.nextUrl;

  // If trying to access login page and already authenticated, redirect to dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If trying to access a protected route and not authenticated, redirect to login
  if (!isAuthenticated && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - poker-bulls-club-logo.png (logo file, assuming it's in /public)
  // - any other public assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|poker-bulls-club-logo.png|api/).*)'],
};
