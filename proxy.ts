import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*', '/chat'],
}
