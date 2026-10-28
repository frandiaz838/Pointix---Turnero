// Qué medios de pago de seña tiene habilitados un club. Única fuente de verdad
// para la grilla pública, crearReserva y la pantalla de transferencia.

interface TenantPagos {
  mpAccessToken: string | null
  transferEnabled: boolean
  transferAlias: string | null
  transferCbu: string | null
  whatsappNumber: string | null
}

export interface MediosPago {
  mp: boolean
  /** Transferencia: activada, con alias o CBU, y con WhatsApp para recibir el comprobante. */
  transfer: boolean
}

export function mediosDePago(t: TenantPagos): MediosPago {
  return {
    mp: !!t.mpAccessToken,
    transfer: t.transferEnabled && !!(t.transferAlias || t.transferCbu) && !!t.whatsappNumber,
  }
}

export const TRANSFER_EXPIRY_OPCIONES = [
  { minutos: 30,   label: "30 minutos" },
  { minutos: 60,   label: "1 hora" },
  { minutos: 120,  label: "2 horas" },
  { minutos: 240,  label: "4 horas" },
  { minutos: 720,  label: "12 horas" },
  { minutos: 1440, label: "24 horas" },
]
