import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/client"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

export const SESSION_COOKIE = "pointix-session"

// Exp 7d (antes 30d): si el JWT se filtra, la ventana de exposición se
// reduce. Pointix es una herramienta admin de bajo volumen donde
// re-loguearse una vez por semana no genera fricción real.
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
}

type SessionUser = {
  id: string
  email: string
  name: string | null
  role: Role
  tenantId: string | null
  /**
   * True cuando un SUPER_ADMIN entró al panel de un club desde /admin. En ese
   * caso `role` es ADMIN y `tenantId` el del club, así todos los chequeos
   * existentes ("ADMIN de este tenant") funcionan sin cambios.
   */
  impersonating: boolean
}

interface TokenData {
  userId: string
  email: string
  name: string | null
  role: Role
  tenantId: string | null
  impersonating?: boolean
}

/** Firma el JWT de sesión. iat lo usa getSession contra sessionsRevokedAt. */
export async function signSessionToken(d: TokenData): Promise<string> {
  return new SignJWT({
    sub: d.userId,
    email: d.email,
    name: d.name,
    role: d.role,
    tenantId: d.tenantId,
    ...(d.impersonating ? { imp: true } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secret)
}

/** Firma y setea la cookie de sesión (para Server Actions / Route Handlers). */
export async function setSessionCookie(d: TokenData): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, await signSessionToken(d), SESSION_COOKIE_OPTIONS)
}

type Session = {
  user: SessionUser
  expires: string
} | null

/**
 * Devuelve la sesión actual a partir de la cookie `pointix-session`.
 *
 * Hace dos validaciones:
 *   1. JWT firmado válido y no expirado (`jwtVerify`).
 *   2. Revocación server-side: el `iat` del JWT debe ser >= `User.sessionsRevokedAt`.
 *      Esto permite que logout y password-change invaliden inmediatamente
 *      todos los tokens activos del usuario, no solo el del browser actual.
 *
 * Wrapped en `React.cache` para que múltiples llamadas a `auth()` durante el
 * mismo request server-component compartan el resultado (incluyendo la
 * query a User para chequear sessionsRevokedAt). Una sola DB hit por request.
 */
async function getSessionRaw(): Promise<Session> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)

    const userId = payload.sub as string
    const iatSec = payload.iat as number | undefined

    if (iatSec) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { sessionsRevokedAt: true },
      })
      // Si el usuario no existe ya, no hay sesión válida.
      if (!user) return null
      if (user.sessionsRevokedAt) {
        const iatMs = iatSec * 1000
        if (iatMs < user.sessionsRevokedAt.getTime()) return null
      }
    }

    return {
      user: {
        id: userId,
        email: payload.email as string,
        name: (payload.name as string) ?? null,
        role: payload.role as Role,
        tenantId: (payload.tenantId as string) ?? null,
        impersonating: payload.imp === true,
      },
      expires: new Date((payload.exp as number) * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

export const getSession = cache(getSessionRaw)
export const auth = getSession

/**
 * Devuelve la sesión solo si el usuario es SUPER_ADMIN según la DB (no según
 * el JWT: mientras está "dentro" de un club, el token dice ADMIN). Así una
 * baja de rol tiene efecto inmediato aunque el token siga vigente.
 */
export const getSuperAdminSession = cache(async () => {
  const session = await getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === "SUPER_ADMIN" ? session : null
})
