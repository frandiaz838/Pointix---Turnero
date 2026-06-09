import { prisma } from "@/lib/prisma"
import { sendBookingConfirmation } from "@/lib/email"
import { buildMensajeReserva, buildWhatsappUrl } from "@/lib/whatsapp"
import { sportLabel } from "@/lib/sports"

/**
 * Dispara el email de confirmación para una reserva (si tiene email del cliente).
 * Pensado para ser fire-and-forget: no tira excepciones, solo loguea.
 *
 * Se llama desde:
 * - webhook MP cuando un pago pasa a "approved"
 * - confirmarReserva (admin confirma manualmente)
 * - crearReservaManual (admin crea una reserva ya confirmada)
 */
export async function notificarReservaConfirmada(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: { select: { name: true, sport: true } },
        tenant: { select: { name: true, slug: true, whatsappNumber: true } },
        user: { select: { name: true, email: true } },
      },
    })
    if (!booking) {
      console.warn(`[notif] booking ${bookingId} no encontrado`)
      return
    }

    const toEmail = booking.guestEmail ?? booking.user?.email ?? null
    if (!toEmail) {
      // Reserva sin email del cliente — no podemos mandar nada
      return
    }

    const clienteNombre = booking.guestName ?? booking.user?.name ?? "Cliente"
    const sportLbl      = sportLabel(booking.court.sport as string)
    const paidOnline    = booking.status === "CONFIRMED" && !!booking.mpPaymentId

    const mensajeWsp = buildMensajeReserva({
      clienteNombre,
      clubNombre: booking.tenant.name,
      canchaName: booking.court.name,
      sport: sportLbl,
      startTime: booking.startTime,
      endTime: booking.endTime,
      precio: Number(booking.totalPrice),
      paidOnline,
    })
    const whatsappUrl = booking.tenant.whatsappNumber
      ? buildWhatsappUrl(booking.tenant.whatsappNumber, mensajeWsp)
      : null

    const res = await sendBookingConfirmation({
      toEmail,
      clienteNombre,
      clubNombre: booking.tenant.name,
      clubSlug:   booking.tenant.slug,
      canchaName: booking.court.name,
      sport:      sportLbl,
      fecha:      booking.startTime,
      endTime:    booking.endTime,
      precio:     Number(booking.totalPrice),
      paidOnline,
      whatsappUrl,
    })

    if (!res.ok) {
      console.warn(`[notif] email no enviado para ${bookingId}: ${res.error}`)
    }
  } catch (e) {
    console.error(`[notif] excepción al notificar ${bookingId}:`, e)
  }
}
