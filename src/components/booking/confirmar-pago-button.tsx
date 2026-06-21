"use client"

import { useState } from "react"
import { ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { crearPreferenciaParaReserva } from "@/actions/mp"

interface Props {
  bookingId: string
  appUrl: string
}

export function ConfirmarPagoButton({ bookingId, appUrl }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const { initPoint } = await crearPreferenciaParaReserva(bookingId, appUrl)
      window.location.href = initPoint
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error inesperado"
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-base rounded-xl px-6 py-4 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generando pago…
          </>
        ) : (
          <>
            Continuar a MercadoPago
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
