"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
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

// Devuelve cuántas reservas futuras (PENDING/CONFIRMED) tiene una cancha.
// Útil para mostrar warning antes de desactivar.
export async function contarReservasFuturasCancha(courtId: string, tenantId: string): Promise<number> {
  await verificarAdmin(tenantId)
  return prisma.booking.count({
    where: {
      courtId,
      startTime: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  })
}

export async function toggleCanchaActiva(courtId: string, isActive: boolean, tenantId: string, slug: string) {
  await verificarAdmin(tenantId)

  await prisma.court.update({
    where: { id: courtId },
    data: { isActive: !isActive },
  })

  revalidatePath(`/dashboard/${slug}`)
}

/**
 * Elimina una cancha en cascada: borra su Schedule, CourtBlock y Booking
 * asociados, y después la cancha. Requiere que el cliente confirme tipeando
 * el nombre exacto de la cancha (validado server-side).
 *
 * Devuelve un objeto con conteos de lo eliminado para mostrar feedback.
 */
export async function eliminarCancha(
  courtId: string,
  tenantId: string,
  slug: string,
  confirmName: string,
) {
  await verificarAdmin(tenantId)

  const cancha = await prisma.court.findFirst({
    where: { id: courtId, tenantId },
    select: { id: true, name: true },
  })
  if (!cancha) throw new Error("Cancha no encontrada")

  // Doble confirmación: nombre exacto tipeado (case-sensitive, sin espacios extra)
  if (confirmName.trim() !== cancha.name) {
    throw new Error("El nombre no coincide. Tipealo igual al de la cancha.")
  }

  const [reservas, bloqueos, horarios] = await prisma.$transaction([
    prisma.booking.count({ where: { courtId } }),
    prisma.courtBlock.count({ where: { courtId } }),
    prisma.schedule.count({ where: { courtId } }),
  ])

  await prisma.$transaction([
    prisma.booking.deleteMany({ where: { courtId } }),
    prisma.courtBlock.deleteMany({ where: { courtId } }),
    prisma.schedule.deleteMany({ where: { courtId } }),
    prisma.court.delete({ where: { id: courtId } }),
  ])

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath(`/${slug}`)
  return { reservas, bloqueos, horarios }
}

export async function guardarHorarios(courtId: string, tenantId: string, slug: string, formData: FormData) {
  await verificarAdmin(tenantId)

  const schedules: { courtId: string; dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[] = []
  for (let dia = 0; dia < 7; dia++) {
    if (formData.get(`activo_${dia}`) !== "on") continue
    schedules.push({
      courtId,
      dayOfWeek: dia,
      openTime: formData.get(`apertura_${dia}`) as string,
      closeTime: formData.get(`cierre_${dia}`) as string,
      slotMinutes: parseInt(formData.get(`slots_${dia}`) as string),
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.schedule.deleteMany({ where: { courtId } })
    if (schedules.length > 0) {
      await tx.schedule.createMany({ data: schedules })
    }
  })

  revalidatePath(`/dashboard/${slug}`)
  redirect(`/dashboard/${slug}`)
}
