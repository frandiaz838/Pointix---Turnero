"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { generarSlots } from "@/lib/slots"
import { nowInArAsArtificialUtc } from "@/lib/timezone"

export async function cancelarReserva(bookingId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const reserva = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, court: { select: { tenant: { select: { slug: true } } } } },
  })
  if (!reserva || reserva.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  })

  revalidatePath(`/dashboard/${reserva.court.tenant.slug}/reservas`)
}

export async function confirmarReserva(bookingId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const reserva = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, court: { select: { tenant: { select: { slug: true } } } } },
  })
  if (!reserva || reserva.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
  })

  revalidatePath(`/dashboard/${reserva.court.tenant.slug}/reservas`)
}

// Editar una reserva existente: cambiar cancha, fecha, hora y/o datos del cliente.
// Valida disponibilidad del nuevo slot (ignorando la propia reserva en el conflict check).
export async function editarReserva(bookingId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const reservaExistente = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, court: { select: { tenant: { select: { slug: true } } } } },
  })
  if (!reservaExistente || reservaExistente.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  const courtId    = formData.get("courtId") as string
  const fecha      = formData.get("fecha") as string
  const hora       = formData.get("hora") as string
  const slug       = formData.get("slug") as string
  const guestName  = ((formData.get("guestName")  as string | null) ?? "").trim()
  const guestPhone = ((formData.get("guestPhone") as string | null) ?? "").trim() || null
  const guestEmail = ((formData.get("guestEmail") as string | null) ?? "").trim() || null

  if (!courtId || !fecha || !hora) throw new Error("Faltan datos de la reserva")
  if (!guestName) throw new Error("Ingresá el nombre del cliente")

  const cancha = await prisma.court.findUnique({
    where: { id: courtId },
    include: { schedules: true },
  })
  if (!cancha) throw new Error("Cancha no encontrada")
  if (cancha.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  const [y, m, d] = fecha.split("-").map(Number)
  const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const schedule = cancha.schedules.find(s => s.dayOfWeek === diaSemana)
  if (!schedule) throw new Error(`La cancha "${cancha.name}" no abre ese día`)

  const slotsValidos = generarSlots(schedule.openTime, schedule.closeTime, schedule.slotMinutes)
  if (!slotsValidos.includes(hora)) {
    throw new Error(`El horario ${hora} no es válido para "${cancha.name}" ese día (abre ${schedule.openTime} a ${schedule.closeTime})`)
  }

  const slotMinutes = schedule.slotMinutes
  const startTime = new Date(`${fecha}T${hora}:00.000Z`)
  const endTime   = new Date(startTime.getTime() + slotMinutes * 60 * 1000)

  // Excluimos la propia reserva del conflict check
  const conflicto = await prisma.booking.findFirst({
    where: {
      id: { not: bookingId },
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
  })
  if (conflicto) throw new Error("Ese horario ya está reservado")

  const bloqueo = await prisma.courtBlock.findFirst({
    where: {
      courtId,
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
  })
  if (bloqueo) throw new Error("Esa cancha está bloqueada en ese horario")

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      courtId,
      startTime,
      endTime,
      totalPrice: cancha.pricePerHour,
      guestName,
      guestPhone,
      guestEmail,
    },
  })

  revalidatePath(`/dashboard/${slug}/reservas`)
  redirect(`/dashboard/${slug}/reservas?fecha=${fecha}&editada=true`)
}

// Marca una reserva como NO_SHOW: el cliente confirmó pero no se presentó.
export async function marcarNoShow(bookingId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const reserva = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, endTime: true, status: true, court: { select: { tenant: { select: { slug: true } } } } },
  })
  if (!reserva || reserva.tenantId !== session.user.tenantId) throw new Error("No autorizado")
  if (reserva.endTime > new Date()) throw new Error("La reserva no terminó todavía")
  if (reserva.status !== "CONFIRMED" && reserva.status !== "PENDING") {
    throw new Error("Solo se pueden marcar como 'No vino' reservas confirmadas o pendientes")
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "NO_SHOW" },
  })

  revalidatePath(`/dashboard/${reserva.court.tenant.slug}/reservas`)
}

// Revierte una confirmación (CONFIRMED → PENDING). Para el undo del toast.
export async function revertirConfirmacion(bookingId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const reserva = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tenantId: true, status: true, court: { select: { tenant: { select: { slug: true } } } } },
  })
  if (!reserva || reserva.tenantId !== session.user.tenantId) throw new Error("No autorizado")
  if (reserva.status !== "CONFIRMED") throw new Error("Esa reserva no está confirmada")

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "PENDING" },
  })

  revalidatePath(`/dashboard/${reserva.court.tenant.slug}/reservas`)
}

// Devuelve los slots ya ocupados para una cancha en una fecha
export async function obtenerSlotsOcupados(courtId: string, fecha: string): Promise<string[]> {
  const inicio = new Date(`${fecha}T00:00:00.000Z`)
  const fin = new Date(`${fecha}T23:59:59.999Z`)

  const reservas = await prisma.booking.findMany({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { gte: inicio, lte: fin },
    },
    select: { startTime: true },
  })

  return reservas.map((r) => {
    const h = r.startTime.getUTCHours()
    return `${String(h).padStart(2, "0")}:00`
  })
}

export async function crearReserva(formData: FormData) {
  const session = await auth()

  const courtId = formData.get("courtId") as string
  const fecha = formData.get("fecha") as string
  const hora = formData.get("hora") as string
  const slug = formData.get("slug") as string
  const guestName = formData.get("guestName") as string | null
  const guestPhone = formData.get("guestPhone") as string | null

  // Si no hay sesión, nombre y teléfono son obligatorios
  if (!session?.user && (!guestName?.trim() || !guestPhone?.trim())) {
    throw new Error("Ingresá tu nombre y teléfono para reservar")
  }

  const cancha = await prisma.court.findUnique({
    where: { id: courtId },
    include: { tenant: true },
  })
  if (!cancha || !cancha.isActive) throw new Error("Cancha no disponible")

  const slotMinutes = parseInt((formData.get("slotMinutes") as string) || "60")
  const startTime = new Date(`${fecha}T${hora}:00.000Z`)
  const endTime = new Date(startTime.getTime() + slotMinutes * 60 * 1000)

  const conflicto = await prisma.booking.findFirst({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  })
  if (conflicto) throw new Error("Ese horario ya está reservado")

  const bloqueo = await prisma.courtBlock.findFirst({
    where: {
      courtId,
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
  })
  if (bloqueo) throw new Error("Ese horario no está disponible")

  const datosCliente = session?.user?.id
    ? { userId: session.user.id }
    : { guestName: guestName!, guestPhone: guestPhone! }

  await prisma.booking.create({
    data: {
      courtId,
      tenantId: cancha.tenantId,
      startTime,
      endTime,
      totalPrice: cancha.pricePerHour,
      status: "PENDING",
      ...datosCliente,
    },
  })

  revalidatePath(`/${slug}`)
  redirect(`/${slug}?reservado=true`)
}

// Crear reserva manual desde el admin (cliente llamó por teléfono, etc.)
// Se crea directamente como CONFIRMED — el admin la está confirmando al cargarla.
export async function crearReservaManual(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("No autorizado")

  const courtId   = formData.get("courtId") as string
  const fecha     = formData.get("fecha") as string
  const hora      = formData.get("hora") as string
  const slug      = formData.get("slug") as string
  const guestName  = ((formData.get("guestName")  as string | null) ?? "").trim()
  const guestPhone = ((formData.get("guestPhone") as string | null) ?? "").trim() || null
  const guestEmail = ((formData.get("guestEmail") as string | null) ?? "").trim() || null

  if (!guestName) throw new Error("Ingresá el nombre del cliente")
  if (!courtId || !fecha || !hora) throw new Error("Faltan datos de la reserva")

  const cancha = await prisma.court.findUnique({
    where: { id: courtId },
    include: { schedules: true },
  })
  if (!cancha) throw new Error("Cancha no encontrada")
  if (cancha.tenantId !== session.user.tenantId) throw new Error("No autorizado")

  const [y, m, d] = fecha.split("-").map(Number)
  const diaSemana = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const schedule = cancha.schedules.find(s => s.dayOfWeek === diaSemana)
  if (!schedule) throw new Error(`La cancha "${cancha.name}" no abre ese día`)

  const slotsValidos = generarSlots(schedule.openTime, schedule.closeTime, schedule.slotMinutes)
  if (!slotsValidos.includes(hora)) {
    throw new Error(`El horario ${hora} no es válido para "${cancha.name}" ese día (abre ${schedule.openTime} a ${schedule.closeTime})`)
  }

  const slotMinutes = schedule.slotMinutes
  const startTime = new Date(`${fecha}T${hora}:00.000Z`)
  const endTime   = new Date(startTime.getTime() + slotMinutes * 60 * 1000)

  if (startTime < nowInArAsArtificialUtc()) {
    throw new Error("Ese horario ya pasó")
  }

  const conflicto = await prisma.booking.findFirst({
    where: {
      courtId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
  })
  if (conflicto) throw new Error("Ese horario ya está reservado")

  const bloqueo = await prisma.courtBlock.findFirst({
    where: {
      courtId,
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
    },
  })
  if (bloqueo) throw new Error("Esa cancha está bloqueada en ese horario")

  await prisma.booking.create({
    data: {
      courtId,
      tenantId: cancha.tenantId,
      startTime,
      endTime,
      totalPrice: cancha.pricePerHour,
      status: "CONFIRMED",
      guestName,
      guestPhone,
      guestEmail,
    },
  })

  revalidatePath(`/dashboard/${slug}/reservas`)
  // Redirige a la fecha de la reserva con flag de éxito (toast)
  redirect(`/dashboard/${slug}/reservas?fecha=${fecha}&creada=true`)
}
