// Datos de contacto de Pointix (el negocio, no un club).

// Número del fundador para "Hablar con un humano" y pantallas de cuenta.
// Formato wa.me: dígitos, sin "+" ni espacios, con "9" para móvil AR.
export const WHATSAPP_FUNDADOR = "5493543697964"

export function waFundadorUrl(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_FUNDADOR}?text=${encodeURIComponent(mensaje)}`
}
