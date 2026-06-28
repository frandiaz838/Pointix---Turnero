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
 * Archiva una cancha (soft delete) marcando `archivedAt`. Requiere que el
 * admin confirme tipeando el nombre exacto de la cancha (validado server-side).
 *
 * Preserva el histórico:
 *   - Las reservas COMPLETED/CANCELLED/CONFIRMED del pasado siguen existiendo
 *     y siguen contando en los reportes de ingresos históricos.
 *   - Los Schedule y CourtBlock asociados también se conservan.
 *
 * Limpia el futuro:
 *   - Cancela las reservas PENDING/CONFIRMED futuras para que no queden
 *     clientes esperando una cancha que ya no existe.
 *
 * La cancha queda excluida automáticamente de listados, selectors y del
 * sitio público vía el filtro `archivedAt: null`.
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

  const ahora = new Date()
  const [reservasFuturas, bloqueos, horarios] = await prisma.$transaction([
    prisma.booking.count({
      where: { courtId, startTime: { gte: ahora }, status: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.courtBlock.count({ where: { courtId } }),
    prisma.schedule.count({ where: { courtId } }),
  ])

  await prisma.$transaction([
    // Cancelar reservas futuras activas para liberar a los clientes.
    prisma.booking.updateMany({
      where: { courtId, startTime: { gte: ahora }, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED", mpStatus: "CANCELLED_POR_ARCHIVAR_CANCHA" },
    }),
    // Soft delete: archivedAt + isActive=false. No borramos reservas históricas
    // ni schedules/blocks, así los reportes de ingresos pasados quedan intactos.
    prisma.court.update({
      where: { id: courtId },
      data: { archivedAt: ahora, isActive: false },
    }),
  ])

  revalidatePath(`/dashboard/${slug}`)
  revalidatePath(`/${slug}`)
  return { reservas: reservasFuturas, bloqueos, horarios }
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
