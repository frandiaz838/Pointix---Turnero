"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export type EstadoFiltro = "todos" | "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

const OPCIONES: { key: EstadoFiltro; label: string; dot: string }[] = [
  { key: "todos",     label: "Todos",       dot: "bg-white/30" },
  { key: "PENDING",   label: "Pendientes",  dot: "bg-yellow-400" },
  { key: "CONFIRMED", label: "Confirmadas", dot: "bg-[#A3FF12]" },
  { key: "CANCELLED", label: "Canceladas",  dot: "bg-red-400" },
  { key: "NO_SHOW",   label: "No vino",     dot: "bg-orange-400" },
  { key: "COMPLETED", label: "Completadas", dot: "bg-white/40" },
]

interface Props {
  activo: EstadoFiltro
}

// Pills clickeables que filtran por estado. Sincronizan con ?estado= en la URL
// y resetean la paginación (?pagina=1) al cambiar de filtro.
export function ReservasEstadoFilter({ activo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function setEstado(estado: EstadoFiltro) {
    const params = new URLSearchParams(searchParams.toString())
    if (estado === "todos") {
      params.delete("estado")
    } else {
      params.set("estado", estado)
    }
    params.delete("pagina") // reset a página 1
    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `?${qs}` : "?", { scroll: false })
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map(({ key, label, dot }) => {
        const isActive = activo === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => setEstado(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "btn-lime-glow bg-[#A3FF12] text-black"
                : "glass-nav text-white/60 hover:text-white"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
