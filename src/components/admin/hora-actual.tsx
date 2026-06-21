"use client"

import { useEffect, useState } from "react"

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFecha(d: Date): string {
  const dia = DIAS[d.getDay()]
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

function formatHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/**
 * Muestra fecha y hora actual. Se actualiza cada 30s para mantener el
 * reloj al día sin spam de renders.
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

  if (!now) {
    return (
      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">
        Panel admin
      </p>
    )
  }

  return (
    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.18em] mt-0.5 tabular-nums">
      {formatFecha(now)}
      <span className="text-white/20 mx-1.5">·</span>
      <span className="text-[#A3FF12]/80">{formatHora(now)}</span>
    </p>
  )
}
