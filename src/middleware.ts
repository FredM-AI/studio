
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'app_session_active';
const LOGIN_PATH = '/login';
// Paths that guests can view. Actions (create/edit/delete) will be restricted at UI level.
const PUBLIC_VIEW_PATHS_PREFIXES = ['/dashboard', '/assistant', '/events', '/players', '/seasons']; 

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === 'true';
  const { pathname } = request.nextUrl;

  // If authenticated and tries to access login page, redirect to dashboard
  if (isAuthenticated && pathname === LOGIN_PATH) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If not authenticated
  if (!isAuthenticated) {
    // Allow access to the login page itself
    if (pathname === LOGIN_PATH) {
      return NextResponse.next();
    }

    // Check if the path is one of the publicly viewable paths or their sub-paths
    const isPublicViewPath = PUBLIC_VIEW_PATHS_PREFIXES.some(prefix => pathname.startsWith(prefix));
    if (isPublicViewPath) {
      return NextResponse.next();
    }

    // For any other path not explicitly allowed for guests, redirect to login
    // This will include direct access attempts to /new or /edit URLs if they are not covered by PUBLIC_VIEW_PATHS_PREFIXES
    return NextResponse.redirect(new URL(`${LOGIN_PATH}?redirectedFrom=${pathname}`, request.url));
  }

  // If authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|poker-bulls-club-logo.png|api/).*)'],
};
