"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { nowInArAsArtificialUtc } from "@/lib/timezone"
import { ERROR_BLOQUEO_CONFLICTO } from "@/lib/bloqueos-errors"

// Crear un bloqueo: rango de tiempo en el que la cancha no acepta reservas.
// Si endTime <= startTime, se trata el día entero.
//
// Comportamiento ante reservas existentes en el rango:
//   - Si NO se pasa `forzar=on`: aborta y devuelve un error parseable por la
//     UI ("BLOQUEO_TIENE_RESERVAS:N") para que el admin confirme.
//   - Si se pasa `forzar=on`: cancela en una sola transacción todas las
//     reservas PENDING/CONFIRMED que se solapen, dejando el motivo en
//     `mpStatus` como rastro ("CANCELLED_POR_BLOQUEO"). No mandamos
//     notificación automática (el admin debe avisar al cliente).
export async function crearBloqueo(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const courtId = formData.get("courtId") as string
  const slug    = formData.get("slug") as string
  const fecha   = formData.get("fecha") as string  // YYYY-MM-DD
  const desde   = (formData.get("desde") as string | null) ?? ""  // HH:MM
  const hasta   = (formData.get("hasta") as string | null) ?? ""  // HH:MM
  const dia     = formData.get("dia") === "on"  // checkbox "todo el día"
  const forzar  = formData.get("forzar") === "on"  // confirmación para cancelar reservas existentes
  const reason  = ((formData.get("reason") as string | null) ?? "").trim() || null

  if (!courtId || !fecha) throw new Error("Faltan datos del bloqueo")

  const cancha = await prisma.court.findUnique({ where: { id: courtId } })
  if (!cancha) throw new Error("Cancha no encontrada")
  if (cancha.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  let startTime: Date
  let endTime: Date

  if (dia || !desde || !hasta) {
    startTime = new Date(`${fecha}T00:00:00.000Z`)
    endTime   = new Date(`${fecha}T23:59:59.999Z`)
  } else {
    startTime = new Date(`${fecha}T${desde}:00.000Z`)
    endTime   = new Date(`${fecha}T${hasta}:00.000Z`)
    if (endTime <= startTime) throw new Error("La hora 'hasta' tiene que ser posterior a la hora 'desde'")
  }

  // No permitir bloqueos en el pasado (el final del bloqueo ya ocurrió)
  if (endTime < nowInArAsArtificialUtc()) {
    throw new Error("No podés crear un bloqueo en una fecha o horario que ya pasó")
  }

  // Buscar reservas activas que se solapen con el bloqueo. Una reserva se
  // solapa si su startTime < endTime del bloqueo y su endTime > startTime del
  // bloqueo (intervalos abiertos).
  const reservasEnConflicto = await prisma.booking.findMany({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
    select: { id: true },
  })

  if (reservasEnConflicto.length > 0 && !forzar) {
    // Mensaje parseable por la UI — incluimos la cantidad para mostrarla.
    throw new Error(`${ERROR_BLOQUEO_CONFLICTO}:${reservasEnConflicto.length}`)
  }

  await prisma.$transaction(async (tx) => {
    if (reservasEnConflicto.length > 0) {
      await tx.booking.updateMany({
        where: { id: { in: reservasEnConflicto.map(r => r.id) } },
        data: { status: "CANCELLED", mpStatus: "CANCELLED_POR_BLOQUEO" },
      })
    }
    await tx.courtBlock.create({
      data: { courtId, startTime, endTime, reason },
    })
  })

  revalidatePath(`/dashboard/${slug}/canchas/${courtId}/bloqueos`)
  revalidatePath(`/dashboard/${slug}`)
  revalidatePath(`/${slug}`)
}

export async function eliminarBloqueo(bloqueoId: string, slug: string, courtId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const bloqueo = await prisma.courtBlock.findUnique({
    where: { id: bloqueoId },
    include: { court: true },
  })
  if (!bloqueo) throw new Error("Bloqueo no encontrado")
  if (bloqueo.court.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  await prisma.courtBlock.delete({ where: { id: bloqueoId } })

  revalidatePath(`/dashboard/${slug}/canchas/${courtId}/bloqueos`)
}
