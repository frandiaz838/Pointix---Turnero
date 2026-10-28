import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { notificarReservaConfirmada } from "@/lib/booking-notifications"
import { decryptToken } from "@/lib/crypto"
import { MP_STATUS_APROBADO_TARDE } from "@/lib/medios-pago"


// MercadoPago llama a este endpoint cuando hay novedades de pago.
// Body típico:
// { action: "payment.created" | "payment.updated", data: { id: "12345" } }
//
// No confiamos en el body: con el paymentId consultamos el pago a la API de MP
// con el token del club, y de ahí sale el external_reference (= bookingId) y
// el estado real. Así una notificación falsa no puede confirmar nada.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 })

    const paymentId = body?.data?.id ?? body?.resource
    if (!paymentId) {
      // Notification de tipo distinto (merchant_order, etc), aceptamos sin hacer nada
      return NextResponse.json({ ok: true })
    }

    // Las Preferences nuevas mandan ?t=<tenantId> en notification_url: así
    // consultamos solo con el token de ese club. Las viejas (sin ?t) caen al
    // recorrido de todos los clubes con MP.
    const tenantParam = req.nextUrl.searchParams.get("t")
    const tenantsConMp = await prisma.tenant.findMany({
      where: { mpAccessToken: { not: null }, ...(tenantParam ? { id: tenantParam } : {}) },
      select: { id: true, mpAccessToken: true, slug: true },
    })

    let paymentData: { external_reference?: string; status?: string; id?: number; status_detail?: string } | null = null
    let tenantUsado: { id: string; slug: string } | null = null

    for (const tenant of tenantsConMp) {
      if (!tenant.mpAccessToken) continue
      try {
        // Token cifrado en DB → descifrado solo para esta llamada al SDK.
        const accessTokenPlano = decryptToken(tenant.mpAccessToken)
        const config = new MercadoPagoConfig({ accessToken: accessTokenPlano })
        const payment = new Payment(config)
        const data = await payment.get({ id: String(paymentId) })
        if (data && data.external_reference) {
          paymentData = data
          tenantUsado = { id: tenant.id, slug: tenant.slug }
          break
        }
      } catch {
        // Token de este tenant no autoriza este payment — siguiente
      }
    }

    if (!paymentData || !tenantUsado || !paymentData.external_reference) {
      // No pudimos identificar la reserva. Respondemos 200 igual para que MP no reintente eternamente.
      return NextResponse.json({ ok: true, note: "no matched" })
    }

    const bookingId = paymentData.external_reference
    const tenantId  = tenantUsado.id
    const mpStatus  = paymentData.status ?? "unknown"
    const pagoId    = String(paymentData.id ?? paymentId)

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      select: { status: true, mpPaymentId: true },
    })
    if (!booking) return NextResponse.json({ ok: true, note: "booking not found" })

    // Regla: el webhook solo mueve reservas PENDING. Los updates son
    // condicionales (status: "PENDING") para que dos notificaciones
    // simultáneas no pisen un estado que otra ya resolvió.
    let resultado = "unchanged"

    if (mpStatus === "approved") {
      if (booking.status === "PENDING") {
        const { count } = await prisma.booking.updateMany({
          where: { id: bookingId, tenantId, status: "PENDING" },
          data: { status: "CONFIRMED", mpPaymentId: pagoId, mpStatus },
        })
        // Solo quien hizo la transición manda el mail (idempotente ante reintentos de MP)
        if (count === 1) {
          await notificarReservaConfirmada(bookingId)
          resultado = "CONFIRMED"
        }
      } else if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
        if (booking.mpPaymentId && booking.mpPaymentId !== pagoId) {
          console.warn(`[mp-webhook] reserva ${bookingId} ya confirmada con otro pago (${booking.mpPaymentId}); nuevo pago aprobado ${pagoId}: posible doble cobro`)
        }
      } else {
        // EXPIRED / CANCELLED / NO_SHOW: pagó tarde. No confirmamos (el turno
        // pudo haberse reservado por otra persona); dejamos rastro para que el
        // club lo vea y devuelva la plata.
        await prisma.booking.updateMany({
          where: { id: bookingId, tenantId, status: booking.status },
          data: { mpPaymentId: pagoId, mpStatus: MP_STATUS_APROBADO_TARDE },
        })
        console.warn(`[mp-webhook] pago ${pagoId} aprobado sobre reserva ${bookingId} en estado ${booking.status}: requiere devolución manual`)
        resultado = "approved_late"
      }
    } else if (booking.status === "PENDING") {
      // pending / in_process / rejected / cancelled: solo registramos el estado.
      // Un rechazo NO cancela la reserva: el cliente puede reintentar el pago
      // y el turno se libera solo cuando vence (expiresAt).
      await prisma.booking.updateMany({
        where: { id: bookingId, tenantId, status: "PENDING" },
        data: { mpPaymentId: pagoId, mpStatus },
      })
    }

    revalidatePath(`/dashboard/${tenantUsado.slug}/reservas`)
    revalidatePath(`/${tenantUsado.slug}`)

    return NextResponse.json({ ok: true, bookingId, resultado })
  } catch (e) {
    console.error("[mp-webhook] error:", e)
    // Devolvemos 200 igual para evitar reintentos en bucle de MP
    return NextResponse.json({ ok: true, error: e instanceof Error ? e.message : "unknown" })
  }
}

export async function GET() {
  return NextResponse.json({ status: "MercadoPago webhook endpoint" })
}
