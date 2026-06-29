import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma/client"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

type SessionUser = {
  id: string
  email: string
  name: string | null
  role: Role
  tenantId: string | null
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
    const token = cookieStore.get("pointix-session")?.value
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
      },
      expires: new Date((payload.exp as number) * 1000).toISOString(),
    }
  } catch {
    return null
  }
}

export const getSession = cache(getSessionRaw)
export const auth = getSession
