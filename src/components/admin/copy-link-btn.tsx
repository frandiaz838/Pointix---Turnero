"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"

// Copia el link público del club. Pensado para el header del Inicio: compartir
// el link es la acción que más reservas genera.
export function CopyLinkBtn({ url, className }: { url: string; className: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button type="button" onClick={copiar} className={className}>
      {copiado ? <Check className="w-4 h-4 text-[#A3FF12]" /> : <Link2 className="w-4 h-4" />}
      {copiado ? "¡Link copiado!" : "Copiar link de reservas"}
    </button>
  )
}
