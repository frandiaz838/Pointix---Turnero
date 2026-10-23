"use client"

import { useEffect, useState } from "react"

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

const AR_TZ = "America/Argentina/Buenos_Aires"

// Tomamos un Date y devolvemos las partes (día, mes, hora, etc.) reinterpretadas
// en la zona horaria de Argentina, sin importar dónde esté el navegador.
function partesAr(d: Date) {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: AR_TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => partes.find(p => p.type === t)?.value ?? ""
  // weekday "short" en en-GB devuelve "Mon"/"Tue"/... — lo mapeamos al índice
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    dia: Number(get("day")),
    mes: Number(get("month")) - 1,
    hora: get("hour"),
    minuto: get("minute"),
    diaSemana: wdMap[get("weekday")] ?? 0,
  }
}

function formatFecha(p: ReturnType<typeof partesAr>): string {
  const dia = DIAS[p.diaSemana]
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${p.dia} de ${MESES[p.mes]}`
}

function formatHora(p: ReturnType<typeof partesAr>): string {
  return `${p.hora}:${p.minuto}`
}

/**
 * Muestra fecha y hora actual de Argentina. Se actualiza cada 30s para mantener
 * el reloj al día sin spam de renders. Forzamos timezone="America/Argentina/Buenos_Aires"
 * para que el admin vea siempre la hora del club, no la del SO (importante si
 * viaja o tiene la zona horaria del navegador mal seteada).
 *
 * Usa suppressHydrationWarning porque el primer render del server puede
 * tener un valor distinto al del cliente (zona horaria, segundo exacto)
 * y eso causaría un mismatch que ignoramos a propósito acá.
 */
export function HoraActual() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Dos líneas (fecha / hora) para que entre en el ancho del menú lateral
  // aunque sea "Miércoles 30 de septiembre".
  if (!now) {
    return <p className="mt-1 text-sm text-white/55 leading-snug">Panel del club</p>
  }

  const p = partesAr(now)

  return (
    <p className="mt-1 text-sm text-white/60 leading-snug">
      {formatFecha(p)}
      <span className="block text-[#A3FF12] font-bold tabular-nums">{formatHora(p)} hs</span>
    </p>
  )
}
