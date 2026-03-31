import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'auth_token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (pathname === '/admin/login') {
    if (token) {
      return NextResponse.redirect(new URL('/admin/meetings', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
