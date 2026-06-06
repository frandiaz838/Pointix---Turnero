"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"

// Crear un bloqueo: rango de tiempo en el que la cancha no acepta reservas.
// Si endTime <= startTime, se trata el día entero.
export async function crearBloqueo(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const courtId = formData.get("courtId") as string
  const slug    = formData.get("slug") as string
  const fecha   = formData.get("fecha") as string  // YYYY-MM-DD
  const desde   = (formData.get("desde") as string | null) ?? ""  // HH:MM
  const hasta   = (formData.get("hasta") as string | null) ?? ""  // HH:MM
  const dia     = formData.get("dia") === "on"  // checkbox "todo el día"
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

  await prisma.courtBlock.create({
    data: { courtId, startTime, endTime, reason },
  })

  revalidatePath(`/dashboard/${slug}/canchas/${courtId}/bloqueos`)
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
