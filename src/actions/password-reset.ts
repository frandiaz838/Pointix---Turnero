"use server"

import { createHash, randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/ratelimit"
import { sendResetPassword } from "@/lib/email"

// Recuperación de contraseña con token de un solo uso (tabla VerificationToken).
//
// - En la DB guardamos el SHA-256 del token, no el token: si alguien leyera la
//   tabla no podría usar los links.
// - identifier = "reset:<userId>": pedir un link nuevo invalida los anteriores.
// - Al cambiar la contraseña se revocan todas las sesiones (sessionsRevokedAt).

const MINUTOS_VALIDEZ = 30
const VENTANA_MS = 15 * 60 * 1000

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Manda el mail con el link si el email existe. Siempre responde igual para no
 * revelar qué emails están registrados.
 */
export async function solicitarResetPassword(emailRaw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailRaw.trim().toLowerCase()
  if (!email || !email.includes("@")) return { ok: false, error: "Ingresá un email válido." }

  const ip = await getClientIp()
  if (!checkRateLimit(`reset-ip:${ip}`, 5, VENTANA_MS).ok || !checkRateLimit(`reset-email:${email}`, 3, VENTANA_MS).ok) {
    return { ok: false, error: "Pediste demasiados links. Probá de nuevo en unos minutos." }
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, name: true, password: true },
  })
  // Cuentas sin contraseña (no debería haber) tampoco reciben link
  if (!user?.password) return { ok: true }

  const token = randomBytes(32).toString("hex")
  const identifier = `reset:${user.id}`

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(token), expires: new Date(Date.now() + MINUTOS_VALIDEZ * 60 * 1000) },
    }),
  ])

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pointix.com.ar"
  await sendResetPassword({
    to: user.email,
    nombre: user.name?.trim().split(/\s+/)[0] ?? null,
    url: `${appUrl}/recuperar/${token}`,
    minutos: MINUTOS_VALIDEZ,
  })

  return { ok: true }
}

/** Busca el token vigente. Lo usa la página para mostrar "link vencido" antes de pedir la contraseña. */
export async function tokenResetValido(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false
  const vt = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } })
  return !!vt && vt.identifier.startsWith("reset:") && vt.expires > new Date()
}

export async function restablecerPassword(
  token: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (password.length < 8) return { ok: false, error: "La contraseña tiene que tener al menos 8 caracteres." }
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, error: "El link no es válido. Pedí uno nuevo." }

  const ip = await getClientIp()
  if (!checkRateLimit(`reset-uso-ip:${ip}`, 10, VENTANA_MS).ok) {
    return { ok: false, error: "Demasiados intentos. Probá de nuevo en unos minutos." }
  }

  const vt = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } })
  if (!vt || !vt.identifier.startsWith("reset:") || vt.expires < new Date()) {
    return { ok: false, error: "El link venció o ya se usó. Pedí uno nuevo." }
  }
  const userId = vt.identifier.slice("reset:".length)

  const hash = await bcrypt.hash(password, 12)
  // Borrar el token y cambiar la contraseña juntos: si dos requests usan el
  // mismo link a la vez, solo el que borra el token cambia la contraseña.
  const cambiado = await prisma.$transaction(async (tx) => {
    const { count } = await tx.verificationToken.deleteMany({ where: { token: vt.token } })
    if (count === 0) return false
    await tx.verificationToken.deleteMany({ where: { identifier: vt.identifier } })
    await tx.user.update({
      where: { id: userId },
      // Cierra las sesiones abiertas en todos los dispositivos
      data: { password: hash, sessionsRevokedAt: new Date() },
    })
    return true
  })
  if (!cambiado) return { ok: false, error: "El link venció o ya se usó. Pedí uno nuevo." }

  return { ok: true }
}
