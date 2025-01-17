import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/shopify/install',
  '/api/shopify/callback',
  '/api/auth/callback',
  '/oauth/callback',
  '/',
  '/faq',
  '/privacy',
  '/terms',
];

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Skip middleware for Next.js internal routes and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('static') ||
    pathname.includes('favicon') ||
    pathname.includes('sitemap')
  ) {
    return NextResponse.next();
  }

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // For all other paths, check for auth token
  const authToken = req.cookies.get('auth_token') || req.headers.get('Authorization');
  if (!authToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|sitemap.xml).*)',
  ],
}; 