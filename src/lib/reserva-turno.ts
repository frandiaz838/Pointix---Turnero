import { prisma } from "@/lib/prisma"
import { generarSlots } from "@/lib/slots"
import type { Prisma } from "@/generated/prisma/client"

// Reglas comunes para crear o mover una reserva (pública, manual del admin y
// edición). Vive fuera de los archivos "use server" porque exporta helpers
// que no son Server Actions.

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/
const RE_HORA = /^\d{2}:\d{2}$/

interface CanchaConHorarios {
  name: string
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[]
}

/**
 * Valida fecha/hora contra el horario real de la cancha y devuelve el rango
 * del turno. La duración sale del Schedule, nunca del cliente.
 */
export function resolverTurno(cancha: CanchaConHorarios, fecha: string, hora: string) {
  if (!RE_FECHA.test(fecha) || !RE_HORA.test(hora)) throw new Error("Fecha u horario inválido")

  const [y, m, d] = fecha.split("-").map(Number)
  const dia = new Date(Date.UTC(y, m - 1, d))
  if (Number.isNaN(dia.getTime()) || dia.getUTCDate() !== d) throw new Error("Fecha inválida")

  const schedule = cancha.schedules.find((s) => s.dayOfWeek === dia.getUTCDay())
  if (!schedule) throw new Error(`La cancha "${cancha.name}" no abre ese día`)

  const slotsValidos = generarSlots(schedule.openTime, schedule.closeTime, schedule.slotMinutes)
  if (!slotsValidos.includes(hora)) {
    throw new Error(`El horario ${hora} no es válido para "${cancha.name}" ese día (abre ${schedule.openTime} a ${schedule.closeTime})`)
  }

  // Convención del proyecto: hora AR guardada como UTC
  const startTime = new Date(`${fecha}T${hora}:00.000Z`)
  const endTime = new Date(startTime.getTime() + schedule.slotMinutes * 60 * 1000)
  return { startTime, endTime }
}

/**
 * Chequea conflicto (reservas activas y bloqueos) y ejecuta `escribir` en la
 * misma transacción, con un advisory lock por cancha: dos reservas simultáneas
 * del mismo turno se ejecutan en fila y la segunda ve el conflicto. Sin esto,
 * el findFirst + create de dos requests en paralelo podían pasar los dos.
 */
export async function reservarTurnoAtomico<T>(opts: {
  courtId: string
  startTime: Date
  endTime: Date
  /** Para editar: la propia reserva no cuenta como conflicto. */
  excluirBookingId?: string
  escribir: (tx: Prisma.TransactionClient) => Promise<T>
}): Promise<T> {
  const { courtId, startTime, endTime, excluirBookingId, escribir } = opts

  return prisma.$transaction(async (tx) => {
    // Se libera solo al terminar la transacción
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${courtId}))`

    const conflicto = await tx.booking.findFirst({
      where: {
        courtId,
        ...(excluirBookingId ? { id: { not: excluirBookingId } } : {}),
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    })
    if (conflicto) throw new Error("Ese horario ya está reservado")

    const bloqueo = await tx.courtBlock.findFirst({
      where: { courtId, startTime: { lt: endTime }, endTime: { gt: startTime } },
      select: { id: true },
    })
    if (bloqueo) throw new Error("Esa cancha no está disponible en ese horario")

    return escribir(tx)
  })
}
