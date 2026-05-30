import { jwtVerify } from "jose"
import { cookies } from "next/headers"
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

export async function getSession(): Promise<Session> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("pointix-session")?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)

    return {
      user: {
        id: payload.sub as string,
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

export const auth = getSession
