// Cálculo del monto a cobrar online cuando el complejo usa el sistema de seña.
//
// - Si el tenant NO tiene seña configurada (null o 0), se cobra el 100% del
//   precio total (comportamiento default).
// - Si tiene seña configurada (1-100), se cobra ese porcentaje del total.
// - El monto online tiene un piso de $1 ARS. Si el % calculado da menos,
//   redondea hacia arriba al piso. $1 es el mínimo que acepta MP y nos
//   permite hacer pruebas sin gastar plata.

const MONTO_MINIMO_ONLINE = 1

export interface DesgloseSeña {
  /** Monto total que sale alquilar la cancha (precio entero del slot). */
  total: number
  /** Monto que el cliente paga online por MercadoPago. */
  online: number
  /** Monto que el cliente paga en el complejo al llegar. */
  enComplejo: number
  /** Porcentaje aplicado (0 si no hay seña). */
  porcentajeSeña: number
  /** True si el cobro online es una seña parcial (no el total). */
  esSeña: boolean
}

export function calcularDesglose(
  precioTotal: number,
  senaPercentage: number | null | undefined,
): DesgloseSeña {
  const total = Math.max(0, Math.round(precioTotal))
  const pct = senaPercentage ?? 0

  if (pct <= 0 || pct >= 100) {
    return {
      total,
      online: total,
      enComplejo: 0,
      porcentajeSeña: 0,
      esSeña: false,
    }
  }

  const calculado = Math.round((total * pct) / 100)
  const online = Math.max(MONTO_MINIMO_ONLINE, calculado)
  const enComplejo = Math.max(0, total - online)

  return {
    total,
    online,
    enComplejo,
    porcentajeSeña: pct,
    esSeña: true,
  }
}
