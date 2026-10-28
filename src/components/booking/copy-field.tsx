"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface Props {
  label: string
  valor: string
  /** Texto a copiar si difiere de lo mostrado (ej. monto sin "$" ni puntos). */
  copiar?: string
  destacado?: boolean
}

// Fila "etiqueta / valor + botón copiar" para datos de transferencia.
// El botón ocupa toda la altura de la fila: área táctil cómoda en mobile.
export function CopyField({ label, valor, copiar, destacado = false }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function handleCopy() {
    const texto = copiar ?? valor
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex items-stretch gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <div className="min-w-0 flex-1 px-4 py-3">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</p>
        <p className={`break-all ${destacado ? "font-display font-black text-2xl text-[#A3FF12]" : "text-base font-semibold text-white"}`}>
          {valor}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className={`shrink-0 min-w-[84px] px-3 flex flex-col items-center justify-center gap-1 rounded-r-xl border-l border-white/[0.08] text-xs font-semibold transition-colors ${
          copiado ? "text-[#A3FF12] bg-[#A3FF12]/10" : "text-white/70 hover:text-white hover:bg-white/[0.05]"
        }`}
        aria-label={`Copiar ${label}`}
      >
        {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  )
}
