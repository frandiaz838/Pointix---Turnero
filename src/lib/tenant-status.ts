import type { SubscriptionStatus } from "@/generated/prisma/client"

// Ciclo de vida comercial de un complejo. Se deriva de los campos del Tenant
// en vez de guardarse, así "vencido" no necesita un cron que lo marque.

export const DIAS_PRUEBA = 30

export type EstadoTenant = "pendiente" | "prueba" | "activo" | "vencido" | "suspendido"

interface TenantComercial {
  pendingApproval: boolean
  subscriptionStatus: SubscriptionStatus
  subscriptionEndsAt: Date | null
}

export interface InfoEstado {
  estado: EstadoTenant
  /** Días hasta subscriptionEndsAt (redondeado hacia arriba). null = sin vencimiento. */
  diasRestantes: number | null
  /** El dueño puede usar el panel admin. */
  panelHabilitado: boolean
  /** La página pública acepta visitas y reservas. Un vencido sigue recibiendo reservas. */
  publicoHabilitado: boolean
}

export function estadoTenant(t: TenantComercial, ahora = new Date()): InfoEstado {
  const diasRestantes = t.subscriptionEndsAt
    ? Math.ceil((t.subscriptionEndsAt.getTime() - ahora.getTime()) / 86_400_000)
    : null

  let estado: EstadoTenant
  if (t.pendingApproval) estado = "pendiente"
  else if (t.subscriptionStatus === "CANCELLED") estado = "suspendido"
  else if (t.subscriptionStatus === "PAST_DUE" || (diasRestantes !== null && diasRestantes <= 0)) estado = "vencido"
  else if (t.subscriptionStatus === "ACTIVE") estado = "activo"
  else estado = "prueba"

  return {
    estado,
    diasRestantes,
    panelHabilitado: estado === "prueba" || estado === "activo",
    publicoHabilitado: estado !== "pendiente" && estado !== "suspendido",
  }
}

export const ESTADO_LABEL: Record<EstadoTenant, string> = {
  pendiente:  "Pendiente",
  prueba:     "En prueba",
  activo:     "Activo",
  vencido:    "Vencido",
  suspendido: "Suspendido",
}

export const ESTADO_BADGE: Record<EstadoTenant, string> = {
  pendiente:  "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  prueba:     "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  activo:     "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25",
  vencido:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  suspendido: "bg-red-500/10 text-red-400 border-red-500/20",
}
