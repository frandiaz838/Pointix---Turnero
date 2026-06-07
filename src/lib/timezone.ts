// Utilidades de timezone para Argentina.
//
// CONVENCIÓN del codebase: todos los startTime/endTime de reservas y bloqueos
// se guardan como `YYYY-MM-DDTHH:00:00.000Z` (es decir, hora local AR
// interpretada como UTC). Eso simplifica la query/lectura pero rompe las
// comparaciones contra `new Date()` del server (que está en UTC real).
//
// La solución es construir un "ahora ficticio" expresado de la misma forma:
// tomamos la hora AR actual y la escribimos como si fuera UTC.

export const AR_TIMEZONE = "America/Argentina/Buenos_Aires"

/**
 * "Ahora" en Argentina, expresado como UTC ficticio.
 * Comparable directamente contra startTime/endTime guardados en la DB.
 */
export function nowInArAsArtificialUtc(): Date {
  const ahora = new Date()
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: AR_TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(ahora)
  const get = (t: string) => partes.find(p => p.type === t)?.value ?? "00"
  return new Date(`${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}.000Z`)
}

/**
 * Fecha de hoy en Argentina, en formato YYYY-MM-DD.
 */
export function todayInArIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AR_TIMEZONE }).format(new Date())
}

/**
 * Día de la semana (0=domingo … 6=sábado) del día actual en Argentina.
 */
export function todayInArDayOfWeek(): number {
  const iso = todayInArIso()
  return new Date(iso + "T12:00:00Z").getUTCDay()
}
