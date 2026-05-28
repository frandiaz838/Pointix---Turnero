import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
      const isPublicRoute = pathname === "/" || isAuthRoute

      if (!isLoggedIn && !isPublicRoute) return false
      if (isLoggedIn && isAuthRoute) return Response.redirect(new URL("/", nextUrl))

      return true
    },
  },
}
