import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/shopify/install',
  '/api/shopify/callback',
  '/api/auth/callback',
  '/oauth/callback',  // Add OAuth callback path
  '/',
  '/faq',
  '/privacy',
  '/terms',
];

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/onboarding',
  '/settings',
  '/recommendations',
];

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Skip middleware for Next.js internal routes and webpack
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('webpack') ||
    pathname.includes('.hot-update.') ||
    pathname.includes('static')
  ) {
    return NextResponse.next();
  }

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    console.log('Allowing public path:', pathname);
    return NextResponse.next();
  }

  // Check for authentication only for protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    console.log('Checking auth for protected path:', pathname);
    const authToken = req.cookies.get('auth_token');
    console.log('Auth token present:', !!authToken);
    
    // Only redirect if there's no auth token
    if (!authToken) {
      console.log('No auth token found, redirecting to login from:', pathname);
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('reason', 'session_expired');
      return NextResponse.redirect(loginUrl);
    } else {
      console.log('Auth token found, allowing access to:', pathname);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api webhooks
    '/((?!api/webhooks|favicon.ico|sitemap.xml).*)',
  ],
}; 