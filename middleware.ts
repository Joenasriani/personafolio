import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/submit') {
    return NextResponse.redirect(new URL('/submit-live', request.url));
  }

  if (pathname === '/api/jobs') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/jobs-live';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/submit', '/api/jobs'],
};
