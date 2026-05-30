import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("pointix-session")?.value
  let isLoggedIn = false

  if (token) {
    try {
      await jwtVerify(token, secret)
      isLoggedIn = true
    } catch {
      isLoggedIn = false
    }
  }

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
