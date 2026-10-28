"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { normalizeWhatsappNumber } from "@/lib/whatsapp"

async function verificarAdmin(tenantId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenantId) {
    throw new Error("No autorizado")
  }
}

export async function guardarDatosClub(tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  const description    = ((formData.get("description")    as string | null) ?? "").trim() || null
  const address        = ((formData.get("address")        as string | null) ?? "").trim() || null
  const whatsappRaw    = ((formData.get("whatsappNumber") as string | null) ?? "").trim()
  const whatsappNumber = whatsappRaw ? normalizeWhatsappNumber(whatsappRaw) : null

  if (whatsappRaw && !whatsappNumber) {
    throw new Error("El número de WhatsApp no parece válido")
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { description, address, whatsappNumber },
  })

  revalidatePath(`/dashboard/${slug}/configuracion`)
  revalidatePath(`/${slug}`)
}

/**
 * % de seña que se cobra por adelantado (por MercadoPago o transferencia).
 * Vacío o 0 → se cobra el total. 1 a 99 → ese %. 100 → total.
 */
export async function guardarSena(tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  const raw = ((formData.get("senaPercentage") as string | null) ?? "").trim()
  let mpSenaPercentage: number | null = null
  if (raw) {
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("El porcentaje tiene que estar entre 0 y 100")
    mpSenaPercentage = n > 0 && n < 100 ? n : null
  }

  await prisma.tenant.update({ where: { id: tenantId }, data: { mpSenaPercentage } })
  revalidatePath(`/dashboard/${slug}/configuracion`)
  revalidatePath(`/${slug}`)
}

const TRANSFER_EXPIRY_MIN = 30
const TRANSFER_EXPIRY_MAX = 1440

/** Datos para cobrar la seña por transferencia (alias/CBU) y tiempo de espera. */
export async function guardarConfigTransfer(tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  const transferEnabled = formData.get("transferEnabled") === "on"
  const limpiar = (k: string) => ((formData.get(k) as string | null) ?? "").trim() || null
  const transferAlias  = limpiar("transferAlias")
  const transferCbu    = limpiar("transferCbu")?.replace(/\s+/g, "") ?? null
  const transferHolder = limpiar("transferHolder")
  const transferBank   = limpiar("transferBank")
  const expiry = parseInt((formData.get("transferExpiryMinutes") as string | null) ?? "120", 10)

  if (transferCbu && !/^\d{22}$/.test(transferCbu)) {
    throw new Error("El CBU/CVU tiene que tener 22 números")
  }
  if (transferAlias && !/^[a-zA-Z0-9.-]{6,20}$/.test(transferAlias)) {
    throw new Error("El alias tiene que tener entre 6 y 20 caracteres (letras, números, puntos o guiones)")
  }

  if (transferEnabled) {
    if (!transferAlias && !transferCbu) throw new Error("Cargá un alias o un CBU/CVU para recibir transferencias")
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { whatsappNumber: true } })
    if (!tenant?.whatsappNumber) {
      throw new Error("Primero cargá el WhatsApp del complejo en Datos del club: ahí te van a mandar los comprobantes")
    }
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      transferEnabled,
      transferAlias,
      transferCbu,
      transferHolder,
      transferBank,
      transferExpiryMinutes: Number.isFinite(expiry)
        ? Math.min(TRANSFER_EXPIRY_MAX, Math.max(TRANSFER_EXPIRY_MIN, expiry))
        : 120,
    },
  })
  revalidatePath(`/dashboard/${slug}/configuracion`)
  revalidatePath(`/${slug}`)
}
