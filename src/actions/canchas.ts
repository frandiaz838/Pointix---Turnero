"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Sport } from "@/generated/prisma/client"

// Verifica que el usuario sea ADMIN del tenant indicado
async function verificarAdmin(tenantId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenantId) {
    throw new Error("No autorizado")
  }
  return session
}

export async function crearCancha(tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  await prisma.court.create({
    data: {
      name: formData.get("name") as string,
      sport: formData.get("sport") as Sport,
      pricePerHour: parseFloat(formData.get("pricePerHour") as string),
      tenantId,
    },
  })

  revalidatePath(`/dashboard/${slug}`)
  redirect(`/dashboard/${slug}`)
}

export async function editarCancha(courtId: string, tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  await prisma.court.update({
    where: { id: courtId },
    data: {
      name: formData.get("name") as string,
      sport: formData.get("sport") as Sport,
      pricePerHour: parseFloat(formData.get("pricePerHour") as string),
    },
  })

  revalidatePath(`/dashboard/${slug}`)
  redirect(`/dashboard/${slug}`)
}

export async function toggleCanchaActiva(courtId: string, isActive: boolean, tenantId: string, slug: string) {
  await verificarAdmin(tenantId)

  await prisma.court.update({
    where: { id: courtId },
    data: { isActive: !isActive },
  })

  revalidatePath(`/dashboard/${slug}`)
}
