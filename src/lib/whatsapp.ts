// Utilidades para armar links wa.me de "confirmar reserva por WhatsApp"
// que abren WhatsApp del cliente con un mensaje prearmado al complejo.

import type { DesgloseSeña } from "@/lib/pricing"

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
function formatFecha(d: Date): string {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}
function formatHora(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`
}

/**
 * Normaliza un número de teléfono a formato wa.me (solo dígitos, con código país).
 * Acepta formatos como "11 1234-5678", "+54 9 11 1234-5678", "5491155555555", etc.
 * Si el número parece argentino sin código país, agrega 54.
 */
export function normalizeWhatsappNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 0) return null
  // Si ya empieza con 54 (AR) o tiene más de 11 dígitos, asumir formato internacional
  if (digits.startsWith("54") || digits.length >= 12) return digits
  // Argentino sin código: agregar 549 (móvil internacional)
  if (digits.length === 10) return `549${digits}`
  if (digits.length === 11 && digits.startsWith("9")) return `54${digits}`
  return digits
}

interface ReservaParaWhatsapp {
  clienteNombre: string
  clubNombre: string
  canchaName: string
  sport: string
  startTime: Date
  endTime: Date
  precio: number
  paidOnline: boolean
  /** Si hay seña parcial (esSeña true), se muestra el desglose en el mensaje. */
  desglose?: DesgloseSeña | null
}

/**
 * Arma el mensaje prearmado que el cliente va a enviarle al complejo.
 * Usa formato de WhatsApp (*negrita*) en vez de emojis para evitar problemas
 * de renderizado en distintos clientes.
 */
export function buildMensajeReserva(d: ReservaParaWhatsapp): string {
  const fecha = formatFecha(d.startTime)
  const horaInicio = formatHora(d.startTime)
  const horaFin    = formatHora(d.endTime)
  const precio = `$${d.precio.toLocaleString("es-AR")}`

  const lineas = [
    `¡Hola! Acabo de reservar en *${d.clubNombre}*.`,
    ``,
    `*Cancha:* ${d.canchaName} (${d.sport})`,
    `*Día:* ${fecha}`,
    `*Horario:* ${horaInicio} a ${horaFin} hs`,
  ]

  if (d.desglose && d.desglose.esSeña) {
    lineas.push(
      `*Total:* ${precio}`,
      `*Seña pagada online:* $${d.desglose.online.toLocaleString("es-AR")} (${d.desglose.porcentajeSeña}%)`,
      `*A pagar en el complejo:* $${d.desglose.enComplejo.toLocaleString("es-AR")}`,
    )
  } else {
    const estadoPago = d.paidOnline ? "pagado online" : "pago en el complejo"
    lineas.push(`*Total:* ${precio} (${estadoPago})`)
  }

  lineas.push(
    ``,
    `— ${d.clienteNombre}`,
    ``,
    `¿Me confirmás que llegó? ¡Gracias!`,
  )

  return lineas.join("\n")
}

/**
 * Devuelve un link wa.me que abre WhatsApp con el mensaje prearmado.
 */
export function buildWhatsappUrl(rawPhone: string, mensaje: string): string | null {
  const phone = normalizeWhatsappNumber(rawPhone)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`
}
