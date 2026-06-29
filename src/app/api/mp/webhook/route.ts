import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { notificarReservaConfirmada } from "@/lib/booking-notifications"
import { decryptToken } from "@/lib/crypto"

// MercadoPago llama a este endpoint cuando hay novedades de pago.
// Body típico:
// { action: "payment.created" | "payment.updated", data: { id: "12345" } }
//
// El paymentId nos sirve para consultar el detalle a la API de MP y obtener
// el external_reference (que es el id de la reserva en nuestra DB).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 })

    const paymentId = body?.data?.id ?? body?.resource
    if (!paymentId) {
      // Notification de tipo distinto (merchant_order, etc), aceptamos sin hacer nada
      return NextResponse.json({ ok: true })
    }

    // Para consultar el pago necesitamos un accessToken. Pero hasta no buscar
    // por preferenceId no sabemos qué tenant es. Estrategia: buscamos en TODOS los
    // bookings que tengan ese paymentId, y si no encontramos, hacemos una primera
    // consulta sin auth para obtener el external_reference.
    //
    // En realidad MP no permite consultar payments sin token. Lo que hacemos:
    // 1. Recorremos tenants con MP configurado e intentamos consultar el payment
    //    hasta que alguno responda 200.
    // 2. Una vez identificado el tenant y obtenido el external_reference, actualizamos
    //    el booking correspondiente.
    //
    // Esto funciona para tenants pocos. Para escalar habría que armar un mapping
    // explícito payment → tenant, pero por ahora el cliente sigue siendo este.

    const tenantsConMp = await prisma.tenant.findMany({
      where: { mpAccessToken: { not: null } },
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
    const mpStatus  = paymentData.status ?? "unknown"

    // Estados MP: approved / pending / in_process / rejected / cancelled / refunded / charged_back
    let nuevoStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | null = null
    if (mpStatus === "approved")  nuevoStatus = "CONFIRMED"
    else if (mpStatus === "rejected" || mpStatus === "cancelled") nuevoStatus = "CANCELLED"
    // "pending" / "in_process" → no cambiamos (sigue PENDING)

    const updateData: Record<string, unknown> = {
      mpPaymentId: String(paymentData.id ?? paymentId),
      mpStatus,
    }
    if (nuevoStatus) updateData.status = nuevoStatus

    await prisma.booking.update({
      where: { id: bookingId, tenantId: tenantUsado.id },
      data: updateData,
    })

    revalidatePath(`/dashboard/${tenantUsado.slug}/reservas`)
    revalidatePath(`/${tenantUsado.slug}`)

    // Si el pago se acreditó, mandar email de confirmación al cliente
    if (nuevoStatus === "CONFIRMED") {
      await notificarReservaConfirmada(bookingId)
    }

    return NextResponse.json({ ok: true, bookingId, newStatus: nuevoStatus ?? "unchanged" })
  } catch (e) {
    console.error("[mp-webhook] error:", e)
    // Devolvemos 200 igual para evitar reintentos en bucle de MP
    return NextResponse.json({ ok: true, error: e instanceof Error ? e.message : "unknown" })
  }
}

export async function GET() {
  return NextResponse.json({ status: "MercadoPago webhook endpoint" })
}
