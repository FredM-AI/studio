
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'app_session_active';
const GUEST_ALLOWED_PATHS = ['/login', '/dashboard', '/assistant']; // Paths accessible to guests
const ADMIN_ONLY_PATHS_PREFIX = ['/events', '/players', '/seasons']; // Prefixes for admin-only sections

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === 'true';
  const { pathname } = request.nextUrl;

  if (isAuthenticated) {
    // If authenticated user tries to access login page, redirect to dashboard
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else { // Not authenticated
    // Allow access to guest-allowed paths
    if (GUEST_ALLOWED_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    // If trying to access an admin-only path or any other path not explicitly allowed for guests, redirect to login
    const isAdminPath = ADMIN_ONLY_PATHS_PREFIX.some(prefix => pathname.startsWith(prefix));
    if (isAdminPath || !GUEST_ALLOWED_PATHS.includes(pathname)) {
       return NextResponse.redirect(new URL('/login?redirectedFrom=' + pathname, request.url));
    }
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
