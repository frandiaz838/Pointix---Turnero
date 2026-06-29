import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarPagoReserva } from "@/actions/mp"

// Cron de verificación de pagos pendientes — tercera capa de defensa después
// del webhook MP y del fallback sincrónico en la URL de éxito.
//
// Corre periódicamente (configurado en vercel.json). Para cada reserva PENDING
// que ya tiene un `mpPreferenceId` (= el cliente arrancó el checkout), consulta
// a MP por external_reference para ver si se aprobó el pago. Si sí, confirma
// la reserva y dispara el email — exactamente lo que haría el webhook.
//
// Idempotente: si la reserva ya está CONFIRMED, verificarPagoReserva no hace
// nada. Si no hay pago aprobado todavía, tampoco. La función es safe de correr
// múltiples veces.
//
// Protegido por CRON_SECRET en producción. Vercel Cron lo manda en el header
// `Authorization: Bearer <CRON_SECRET>` cuando lo configurás en su dashboard.

export const dynamic = "force-dynamic"

// Solo verificamos reservas con expiresAt en el futuro o sin expiresAt — las
// que ya expiraron las maneja `expireStalePendings`.
// Y filtramos a las últimas 24h para evitar escanear histórico viejo.
const VENTANA_HORAS = 24

export async function GET(req: NextRequest) {
  // Auth opcional pero recomendado: si CRON_SECRET está seteado, exigirlo.
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const desde = new Date(Date.now() - VENTANA_HORAS * 60 * 60 * 1000)

  const pendientes = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      mpPreferenceId: { not: null },
      createdAt: { gte: desde },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 100,  // límite defensivo por corrida
  })

  let confirmadas = 0
  const errores: string[] = []

  for (const b of pendientes) {
    try {
      const cambio = await verificarPagoReserva(b.id)
      if (cambio) confirmadas++
    } catch (e) {
      errores.push(`${b.id}: ${e instanceof Error ? e.message : "unknown"}`)
    }
  }

  return NextResponse.json({
    ok: true,
    revisadas: pendientes.length,
    confirmadas,
    errores: errores.length > 0 ? errores : undefined,
  })
}
