"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"

// Verifica que el usuario sea ADMIN del tenant
async function verificarAdmin(tenantId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenantId) {
    throw new Error("No autorizado")
  }
}

// Valida que un token sea aparentemente válido (formato APP_USR-* o TEST-*)
// llamando al endpoint de MP de información del usuario.
async function validarToken(token: string): Promise<{ ok: boolean; error?: string; userInfo?: { id: number; nickname: string; site_id: string } }> {
  if (!token.trim()) return { ok: false, error: "El token está vacío" }
  if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
    return { ok: false, error: "El token no parece de MercadoPago (debería empezar con APP_USR- o TEST-)" }
  }

  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401) return { ok: false, error: "El token no es válido (MP responde 401)" }
      return { ok: false, error: `MP respondió ${res.status}` }
    }
    const data = await res.json()
    return { ok: true, userInfo: { id: data.id, nickname: data.nickname, site_id: data.site_id } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error consultando MP" }
  }
}

export async function guardarConfigMp(tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  const accessToken    = ((formData.get("accessToken")    as string | null) ?? "").trim()
  const expiryMinutes  = parseInt((formData.get("expiryMinutes") as string | null) ?? "30", 10)

  if (accessToken) {
    const validacion = await validarToken(accessToken)
    if (!validacion.ok) throw new Error(validacion.error ?? "Token inválido")
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      mpAccessToken: accessToken || null,
      mpExpiryMinutes: Number.isFinite(expiryMinutes) && expiryMinutes > 0 ? expiryMinutes : 30,
    },
  })

  revalidatePath(`/dashboard/${slug}/mp-config`)
}

export async function eliminarConfigMp(tenantId: string, slug: string) {
  await verificarAdmin(tenantId)
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { mpAccessToken: null, mpPublicKey: null },
  })
  revalidatePath(`/dashboard/${slug}/mp-config`)
}

// Server action para usar como onClick: valida token sin guardarlo todavía.
// Útil para "test connection" en el form.
export async function probarConexionMp(token: string) {
  const validacion = await validarToken(token)
  return validacion
}
