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
