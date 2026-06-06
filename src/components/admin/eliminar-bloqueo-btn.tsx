"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { eliminarBloqueo } from "@/actions/bloqueos"

export function EliminarBloqueoBtn({ bloqueoId, slug, courtId }: { bloqueoId: string; slug: string; courtId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => eliminarBloqueo(bloqueoId, slug, courtId))
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Eliminar bloqueo"
      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
