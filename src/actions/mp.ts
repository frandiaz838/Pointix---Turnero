"use server"

import { MercadoPagoConfig, Preference, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { calcularDesglose } from "@/lib/pricing"
import { decryptToken } from "@/lib/crypto"
import { notificarReservaConfirmada } from "@/lib/booking-notifications"

/**
 * Crea una Preference en MercadoPago para pagar una reserva.
 * Devuelve la URL del Checkout (init_point) a la que hay que redirigir al cliente.
 *
 * Si el tenant tiene `mpSenaPercentage` seteado, cobra solo ese porcentaje
 * del precio total como seña (con piso de $5). El resto se paga en el
 * complejo. Si no, cobra el 100%.
 *
 * No requiere auth: esta acción se llama desde la página /{slug}/pagar/{bookingId}
 * que es pública para el cliente que está pagando.
 */
export async function crearPreferenciaParaReserva(
  bookingId: string,
  appUrl: string,
): Promise<{ initPoint: string; preferenceId: string }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      court: { select: { name: true } },
      tenant: { select: { id: true, slug: true, name: true, mpAccessToken: true, mpSenaPercentage: true } },
    },
  })
  if (!booking) throw new Error("Reserva no encontrada")
  if (booking.status !== "PENDING") throw new Error("Esta reserva ya no se puede pagar")
  if (!booking.tenant.mpAccessToken) {
    throw new Error("Este complejo no tiene MercadoPago conectado")
  }

  // El token se guarda cifrado en la DB — lo descifra una sola vez para
  // pasárselo al SDK. Si era legacy plaintext, decryptToken lo deja pasar.
  const accessTokenPlano = decryptToken(booking.tenant.mpAccessToken)
  const desglose = calcularDesglose(Number(booking.totalPrice), booking.tenant.mpSenaPercentage)

  // Si la reserva ya tiene una preference creada, reusala (evita generar
  // múltiples preferences si el cliente recarga la página de pago).
  if (booking.mpPreferenceId) {
    // Intentamos reutilizar; si MP la rechaza, generamos una nueva más abajo.
    try {
      const config = new MercadoPagoConfig({ accessToken: accessTokenPlano })
      const prefClient = new Preference(config)
      const existente = await prefClient.get({ preferenceId: booking.mpPreferenceId })
      if (existente && existente.init_point) {
        return { initPoint: existente.init_point, preferenceId: booking.mpPreferenceId }
      }
    } catch {
      // Caer al flujo de crear una nueva
    }
  }

  const config = new MercadoPagoConfig({ accessToken: accessTokenPlano })
  const prefClient = new Preference(config)

  const horaInicio = `${String(booking.startTime.getUTCHours()).padStart(2, "0")}:${String(booking.startTime.getUTCMinutes()).padStart(2, "0")}`
  const fechaIso = booking.startTime.toISOString().split("T")[0]

  const tituloItem = desglose.esSeña
    ? `Seña ${desglose.porcentajeSeña}% · ${booking.court.name} · ${fechaIso} ${horaInicio}hs`
    : `${booking.court.name} · ${fechaIso} ${horaInicio}hs`
  const descripcionItem = desglose.esSeña
    ? `Seña de reserva en ${booking.tenant.name} — resto en el complejo: $${desglose.enComplejo.toLocaleString("es-AR")}`
    : `Reserva en ${booking.tenant.name}`

  const resp = await prefClient.create({
    body: {
      items: [
        {
          id: booking.id,
          title: tituloItem,
          description: descripcionItem,
          quantity: 1,
          unit_price: desglose.online,
          currency_id: "ARS",
        },
      ],
      external_reference: booking.id,
      back_urls: {
        success: `${appUrl}/${booking.tenant.slug}?reservado=${booking.id}`,
        failure: `${appUrl}/${booking.tenant.slug}/pagar/${booking.id}?status=failure`,
        pending: `${appUrl}/${booking.tenant.slug}/pagar/${booking.id}?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/mp/webhook`,
      // Expira automáticamente cuando el slot pasa
      expires: true,
      expiration_date_to: booking.expiresAt?.toISOString(),
    },
  })

  if (!resp.id || !resp.init_point) {
    throw new Error("MercadoPago no devolvió un Checkout válido")
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { mpPreferenceId: resp.id },
  })

  return { initPoint: resp.init_point, preferenceId: resp.id }
}

/**
 * Verifica sincrónicamente el estado de pago de una reserva contra MP.
 *
 * Es el fallback al webhook: si MP no nos avisó (o tardó), cuando el cliente
 * vuelve a la URL de éxito le consultamos directo a MP qué pasó con el pago
 * usando `external_reference` (que es nuestro bookingId).
 *
 * Comportamiento:
 *   - Si la reserva no está PENDING, no hace nada.
 *   - Si hay un pago `approved` para ese bookingId, la marca CONFIRMED y
 *     dispara el email de confirmación (igual que haría el webhook).
 *   - Errores se loguean pero no se propagan: la página de éxito tiene que
 *     renderizar igual aunque MP esté caído.
 *
 * Devuelve true si la verificación cambió el estado.
 */
export async function verificarPagoReserva(bookingId: string): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        tenant: { select: { mpAccessToken: true } },
      },
    })
    if (!booking) return false
    if (booking.status !== "PENDING") return false
    if (!booking.tenant.mpAccessToken) return false

    const accessTokenPlano = decryptToken(booking.tenant.mpAccessToken)
    const config = new MercadoPagoConfig({ accessToken: accessTokenPlano })
    const paymentClient = new Payment(config)

    const search = await paymentClient.search({
      options: {
        external_reference: bookingId,
        sort: "date_created",
        criteria: "desc",
      },
    })

    const results = search?.results ?? []
    const approved = results.find(p => p.status === "approved")
    if (!approved) return false

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        mpPaymentId: String(approved.id ?? ""),
        mpStatus: "approved",
      },
    })

    // Email de confirmación — el webhook hace lo mismo si llega.
    // notificarReservaConfirmada es idempotente respecto a duplicados de envío:
    // ya hubo "race conditions" en el pasado, pero no envía 2 mails seguidos
    // si la reserva ya estaba CONFIRMED antes de este path.
    await notificarReservaConfirmada(bookingId)

    return true
  } catch (e) {
    console.error("[verificarPagoReserva] error:", e)
    return false
  }
}
