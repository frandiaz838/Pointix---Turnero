import { prisma } from "@/lib/prisma"

/**
 * Marca como EXPIRED todas las reservas PENDING del tenant cuyo expiresAt ya pasó.
 * Devuelve cuántas fueron actualizadas.
 *
 * Idempotente y barato (un solo updateMany indexado por tenantId+status). Llamarlo
 * al inicio de cualquier server component admin que muestre KPIs de ingresos o
 * listados de reservas, así un PENDING que nunca se pagó no sigue inflando los
 * totales para siempre.
 *
 * Es la misma lógica que ya corría inline en /[slug]/page.tsx (página pública del
 * club): la pasamos a helper para usarla también desde el panel admin, donde
 * antes no se ejecutaba y dejaba reservas vencidas sumando como "Pendiente".
 */
export async function expireStalePendings(tenantId: string): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: {
      tenantId,
      status: "PENDING",
      expiresAt: { lt: new Date(), not: null },
    },
    data: { status: "EXPIRED" },
  })
  return result.count
}
