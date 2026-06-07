"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  pagina: number
  totalPaginas: number
  totalItems: number
  itemsPorPagina: number
}

// Paginación clásica con prev/next + indicador "X de Y" + rango visible.
// Sincroniza con ?pagina= en la URL.
export function Paginacion({ pagina, totalPaginas, totalItems, itemsPorPagina }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPaginas <= 1) return null

  function goTo(nuevaPagina: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nuevaPagina <= 1) {
      params.delete("pagina")
    } else {
      params.set("pagina", String(nuevaPagina))
    }
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  const desde = (pagina - 1) * itemsPorPagina + 1
  const hasta = Math.min(pagina * itemsPorPagina, totalItems)

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-white/40">
        <span className="font-semibold text-white/70 tabular-nums">{desde}–{hasta}</span>
        <span className="mx-1">de</span>
        <span className="font-semibold text-white/70 tabular-nums">{totalItems}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(pagina - 1)}
          disabled={pagina <= 1}
          className="p-2 rounded-lg glass-nav hover:bg-white/[0.1] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>

        <span className="text-xs font-medium text-white/50 tabular-nums px-2">
          {pagina} / {totalPaginas}
        </span>

        <button
          type="button"
          onClick={() => goTo(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="p-2 rounded-lg glass-nav hover:bg-white/[0.1] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4 text-white/70" />
        </button>
      </div>
    </div>
  )
}
