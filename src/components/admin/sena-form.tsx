"use client"

import { useState, useTransition } from "react"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guardarSena } from "@/actions/tenant-config"
import { calcularDesglose } from "@/lib/pricing"

interface Props {
  tenantId: string
  slug: string
  senaActual: number | null
  /** Precio de una cancha real para el ejemplo (o un valor de referencia). */
  precioEjemplo: number
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-3 text-base text-white placeholder:text-white/50 outline-none focus:border-[#A3FF12]/40 transition-colors"

// % de seña que se paga por adelantado (MP o transferencia). El resto se paga
// en el complejo con el medio que el club tenga.
export function SenaForm({ tenantId, slug, senaActual, precioEjemplo }: Props) {
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState(senaActual != null ? String(senaActual) : "")
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const pct = parseInt(valor, 10)
  const ejemplo = calcularDesglose(precioEjemplo, Number.isFinite(pct) ? pct : null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setOk(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await guardarSena(tenantId, slug, formData)
        setOk(true)
        setTimeout(() => setOk(false), 3500)
      } catch (err) {
        if (err instanceof Error) setError(err.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
      <p className="text-sm text-white/65 leading-relaxed">
        Cuánto paga el cliente por adelantado para reservar (por MercadoPago o transferencia). El resto lo paga en el complejo, con el medio que quiera.
      </p>

      <div className="space-y-2">
        <label htmlFor="senaPercentage" className="text-sm font-medium text-white/80">Seña (%)</label>
        <div className="flex items-center gap-2 max-w-[200px]">
          <input
            id="senaPercentage"
            name="senaPercentage"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            placeholder="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputBase}
          />
          <span className="text-white/60 font-bold">%</span>
        </div>
        <p className="text-sm text-white/55">Vacío o 0 = se cobra el total por adelantado.</p>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3 text-sm space-y-1">
        <p className="text-white/50">Ejemplo con un turno de ${ejemplo.total.toLocaleString("es-AR")}:</p>
        <p className="text-white/85">
          Paga ahora <span className="font-bold text-[#A3FF12]">${ejemplo.online.toLocaleString("es-AR")}</span>
          {ejemplo.esSeña && <> · en el complejo <span className="font-bold text-white">${ejemplo.enComplejo.toLocaleString("es-AR")}</span></>}
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {ok && (
        <div role="status" className="flex items-center gap-2 bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Seña guardada
        </div>
      )}

      <Button type="submit" disabled={pending} className="btn-lime-glow w-full h-11 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold">
        {pending ? "Guardando…" : "Guardar seña"}
      </Button>
    </form>
  )
}
