import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token') || (typeof window !== 'undefined' && localStorage.getItem('token'));

  // Защищаем маршруты /auth/login и /auth/register
  if (token && (request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/login', '/auth/register'],
};