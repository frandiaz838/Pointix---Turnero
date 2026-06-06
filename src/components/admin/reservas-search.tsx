"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

// Input de búsqueda con debounce 250ms que actualiza ?q= en la URL.
// El server component re-rendea con la nueva query.
export function ReservasSearch({ initial }: { initial: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initial)
  const [, startTransition] = useTransition()

  // Sincroniza si el param cambia desde afuera (botones de período)
  useEffect(() => {
    setValue(initial)
  }, [initial])

  // Debounce: cada cambio de input → 250ms → push URL
  useEffect(() => {
    if (value === initial) return
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) {
        params.set("q", value.trim())
      } else {
        params.delete("q")
      }
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `?${qs}` : "?", { scroll: false })
      })
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function clear() {
    setValue("")
  }

  return (
    <div className="relative">
      <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar por nombre, teléfono o email…"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-full glass-nav rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[#A3FF12]/40 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/80 transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
