"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

/**
 * Cierra la sesión en este dispositivo: solo borra la cookie local. Las
 * sesiones del usuario en otros browsers/celulares siguen activas. Es el
 * comportamiento esperado: que el dueño cierre sesión en la compu de su
 * casa no debe desloguear a quien esté trabajando en la compu del complejo.
 */
export async function cerrarSesion() {
  const cookieStore = await cookies()
  cookieStore.delete("pointix-session")
  redirect("/login")
}

/**
 * Cierra la sesión en TODOS los dispositivos del usuario. Es para
 * emergencias: te robaron el celu, sospechás que alguien tiene tu cookie,
 * cambiaste de password, etc. Actualiza `sessionsRevokedAt` así getSession
 * rechaza cualquier JWT emitido antes de este momento, en cualquier
 * dispositivo.
 */
export async function cerrarSesionEnTodosLados() {
  const cookieStore = await cookies()
  const token = cookieStore.get("pointix-session")?.value

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret)
      const userId = payload.sub as string | undefined
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { sessionsRevokedAt: new Date() },
        })
      }
    } catch {
      // Token inválido — nada para revocar, igual borramos cookie y redirigimos.
    }
  }

  cookieStore.delete("pointix-session")
  redirect("/login")
}
