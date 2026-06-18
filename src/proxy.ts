import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  const isNovaHost = hostname.includes('fineshit.anand-dev.tech') || hostname.includes('fineshit.localhost');
  const isNovaPath = url.pathname.startsWith('/nova') || url.pathname === '/companion' || url.pathname === '/ai';
  
  const requestHeaders = new Headers(request.headers)
  
  if (isNovaHost || isNovaPath) {
    requestHeaders.set('x-is-nova', 'true')
  }

  // If on the companion host and hitting the root, rewrite to /nova silently
  if (isNovaHost && url.pathname === '/') {
    return NextResponse.rewrite(new URL('/nova', request.url), {
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
