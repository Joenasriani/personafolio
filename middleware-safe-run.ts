import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = pathname.match(/^\/api\/jobs-live\/([^/]+)\/run$/);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/jobs-live/${match[1]}/run-safe`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/jobs-live/:jobId/run'],
};
