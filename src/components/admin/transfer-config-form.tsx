"use client"

import { useState, useTransition } from "react"
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guardarConfigTransfer } from "@/actions/tenant-config"
import { TRANSFER_EXPIRY_OPCIONES } from "@/lib/medios-pago"

interface Props {
  tenantId: string
  slug: string
  tieneWhatsapp: boolean
  inicial: {
    enabled: boolean
    alias: string
    cbu: string
    holder: string
    bank: string
    expiryMinutes: number
  }
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-3 text-base text-white placeholder:text-white/45 outline-none focus:border-[#A3FF12]/40 transition-colors"

export function TransferConfigForm({ tenantId, slug, tieneWhatsapp, inicial }: Props) {
  const [pending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(inicial.enabled)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setOk(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await guardarConfigTransfer(tenantId, slug, formData)
        setOk(true)
        setTimeout(() => setOk(false), 3500)
      } catch (err) {
        if (err instanceof Error) setError(err.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Interruptor principal */}
      <label className="flex items-start justify-between gap-4 cursor-pointer">
        <span className="min-w-0">
          <span className="block text-base font-semibold text-white">Aceptar transferencias</span>
          <span className="block text-sm text-white/60 mt-0.5 leading-relaxed">
            El cliente transfiere la seña a tu alias y te manda el comprobante por WhatsApp. Vos confirmás la reserva desde el panel.
          </span>
        </span>
        <span className="relative shrink-0 mt-1">
          <input
            type="checkbox"
            name="transferEnabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <span className="block w-12 h-7 rounded-full bg-white/15 peer-checked:bg-[#A3FF12] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#A3FF12]/50" />
          <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white peer-checked:translate-x-5 peer-checked:bg-black transition-transform" />
        </span>
      </label>

      {!tieneWhatsapp && (
        <div className="flex items-start gap-2 rounded-xl bg-yellow-400/[0.08] border border-yellow-400/25 px-4 py-3 text-sm text-yellow-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Para activarlo, primero cargá el WhatsApp del complejo en <strong>Datos del club</strong>: ahí te llegan los comprobantes.</span>
        </div>
      )}

      {/* Los datos se muestran siempre para poder cargarlos antes de activar */}
      <div className={`space-y-4 border-t border-white/[0.07] pt-5 ${enabled ? "" : "opacity-60"}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="transferAlias" className="text-sm font-medium text-white/80">Alias</label>
            <input id="transferAlias" name="transferAlias" defaultValue={inicial.alias} placeholder="club.atletico.mp" autoCapitalize="none" autoCorrect="off" className={inputBase} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferCbu" className="text-sm font-medium text-white/80">CBU / CVU <span className="text-white/45 font-normal">(opcional)</span></label>
            <input id="transferCbu" name="transferCbu" defaultValue={inicial.cbu} inputMode="numeric" placeholder="22 números" className={inputBase} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferHolder" className="text-sm font-medium text-white/80">Titular de la cuenta</label>
            <input id="transferHolder" name="transferHolder" defaultValue={inicial.holder} placeholder="Juan Pérez" className={inputBase} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="transferBank" className="text-sm font-medium text-white/80">Banco o billetera</label>
            <input id="transferBank" name="transferBank" defaultValue={inicial.bank} placeholder="Banco Nación, Ualá…" className={inputBase} />
          </div>
        </div>
        <p className="text-sm text-white/55">El titular y el banco ayudan al cliente a verificar que transfiere a la cuenta correcta.</p>

        <div className="space-y-1.5">
          <label htmlFor="transferExpiryMinutes" className="text-sm font-medium text-white/80">Tiempo para confirmar el pago</label>
          <select
            id="transferExpiryMinutes"
            name="transferExpiryMinutes"
            defaultValue={String(inicial.expiryMinutes)}
            className={`${inputBase} sm:max-w-[240px] bg-[#1A1E2A]`}
          >
            {TRANSFER_EXPIRY_OPCIONES.map((o) => (
              <option key={o.minutos} value={o.minutos}>{o.label}</option>
            ))}
          </select>
          <p className="text-sm text-white/55">
            El turno queda apartado este tiempo. Si no lo confirmás antes, se libera solo para que otro lo pueda reservar.
          </p>
        </div>
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
          Transferencias guardadas
        </div>
      )}

      <Button type="submit" disabled={pending} className="btn-lime-glow w-full h-11 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold">
        {pending ? "Guardando…" : "Guardar transferencias"}
      </Button>
    </form>
  )
}
