"use client"

import { useState, useTransition } from "react"
import { AlertCircle, CheckCircle, ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { guardarConfigMp, eliminarConfigMp, probarConexionMp } from "@/actions/mp-config"

interface Props {
  tenantId: string
  slug: string
  configActual: {
    accessTokenConfigurado: boolean
    accessTokenUltimos4: string | null  // últimos 4 chars del token guardado
    expiryMinutes: number
    senaPercentage: number | null  // null o 0 = cobra 100%
  }
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors"

export function MpConfigForm({ tenantId, slug, configActual }: Props) {
  const [pending, startTransition] = useTransition()
  const [reemplazando, setReemplazando] = useState(!configActual.accessTokenConfigurado)
  const [accessToken, setAccessToken] = useState("")
  const [expiryMinutes, setExpiryMinutes] = useState(String(configActual.expiryMinutes))
  const [senaPercentage, setSenaPercentage] = useState(
    configActual.senaPercentage != null ? String(configActual.senaPercentage) : "",
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ nickname?: string } | null>(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [probando, setProbando] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; mensaje: string } | null>(null)

  async function handleProbar() {
    if (!accessToken.trim()) {
      setTestResult({ ok: false, mensaje: "Pegá el token primero" })
      return
    }
    setProbando(true)
    setTestResult(null)
    const result = await probarConexionMp(accessToken.trim())
    if (result.ok && result.userInfo) {
      setTestResult({ ok: true, mensaje: `Conectado a ${result.userInfo.nickname} (${result.userInfo.site_id})` })
    } else {
      setTestResult({ ok: false, mensaje: result.error ?? "Error desconocido" })
    }
    setProbando(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)
    if (!reemplazando && configActual.accessTokenConfigurado) {
      // Si no estamos reemplazando, no pisar el token con vacío.
      formData.delete("accessToken")
    }
    startTransition(async () => {
      try {
        await guardarConfigMp(tenantId, slug, formData)
        setSuccess({})
        setReemplazando(false)
        setAccessToken("")
        setTestResult(null)
      } catch (err) {
        if (err instanceof Error) setError(err.message)
      }
    })
  }

  function handleEliminar() {
    startTransition(async () => {
      await eliminarConfigMp(tenantId, slug)
      setOpenDelete(false)
      setReemplazando(true)
      setSuccess(null)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">

      {/* Estado actual */}
      {configActual.accessTokenConfigurado && !reemplazando ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#A3FF12]/[0.06] border border-[#A3FF12]/20">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#A3FF12]/15 border border-[#A3FF12]/30 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-[#A3FF12]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">MercadoPago conectado</p>
            <p className="text-xs text-white/45 mt-0.5">
              Token guardado: <code className="text-[#A3FF12]/70">...{configActual.accessTokenUltimos4}</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setReemplazando(true); setAccessToken("") }}
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reemplazar
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center justify-between">
              <span>Access Token</span>
              <a
                href="https://www.mercadopago.com.ar/developers/panel/app"
                target="_blank"
                rel="noopener"
                className="text-xs text-[#A3FF12]/70 hover:text-[#A3FF12] flex items-center gap-1"
              >
                Obtener mi token <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              name="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="APP_USR-1234567890123456-..."
              autoComplete="off"
              spellCheck={false}
              className={inputBase}
              required={reemplazando || !configActual.accessTokenConfigurado}
            />
            <p className="text-xs text-white/35 leading-relaxed">
              Tu Access Token de producción de MercadoPago. Se guarda solo en nuestra base — los clientes nunca lo ven.
            </p>
          </div>

          <button
            type="button"
            onClick={handleProbar}
            disabled={probando || !accessToken.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-white/65 hover:text-[#A3FF12] disabled:opacity-40 px-2.5 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors"
          >
            {probando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Probar conexión
          </button>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${
              testResult.ok
                ? "bg-[#A3FF12]/10 border-[#A3FF12]/25 text-[#A3FF12]"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {testResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.mensaje}</span>
            </div>
          )}
        </>
      )}

      {/* Expiración */}
      <div className="border-t border-white/[0.07] pt-5 space-y-2">
        <label className="text-sm font-medium text-white/65">
          Tiempo para pagar (minutos)
        </label>
        <input
          name="expiryMinutes"
          type="number"
          min={5}
          max={120}
          value={expiryMinutes}
          onChange={(e) => setExpiryMinutes(e.target.value)}
          className={inputBase}
        />
        <p className="text-xs text-white/35 leading-relaxed">
          Si el cliente no termina el pago en este tiempo, la reserva expira y el slot vuelve a estar disponible.
        </p>
      </div>

      {/* % de seña */}
      <div className="border-t border-white/[0.07] pt-5 space-y-2">
        <label className="text-sm font-medium text-white/65">
          Cobrar como seña (%)
        </label>
        <div className="flex items-center gap-2">
          <input
            name="senaPercentage"
            type="number"
            min={0}
            max={100}
            placeholder="0"
            value={senaPercentage}
            onChange={(e) => setSenaPercentage(e.target.value)}
            className={inputBase}
          />
          <span className="text-white/40 text-sm font-bold">%</span>
        </div>
        <p className="text-xs text-white/35 leading-relaxed">
          Vacío o <span className="text-white/55 font-semibold">0</span> = el cliente paga el <span className="text-white/55 font-semibold">total</span> online.
          Ej. <span className="text-[#A3FF12]/80 font-semibold">20</span> = cobra solo el <span className="text-white/55 font-semibold">20%</span> como seña, el resto se paga en el complejo.
          Mínimo $5 por reserva (límite de MP).
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Configuración guardada
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {configActual.accessTokenConfigurado && (
          <button
            type="button"
            onClick={() => setOpenDelete(true)}
            disabled={pending}
            className="flex items-center gap-1.5 text-xs font-medium text-red-400/80 hover:text-red-400 px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Desconectar
          </button>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="btn-lime-glow ml-auto bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-6"
        >
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {/* Dialog de desconexión */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent
          showCloseButton={false}
          className="!bg-[#14171F]/95 backdrop-blur-xl !ring-white/[0.08] sm:max-w-md !p-6"
        >
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-white font-display font-black uppercase tracking-tight text-base">
                ¿Desconectar MercadoPago?
              </DialogTitle>
              <DialogDescription className="text-white/55 text-sm leading-relaxed">
                Los clientes nuevos ya no van a poder pagar online. Las reservas volverán al modo &ldquo;Pago en el complejo&rdquo;.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <DialogClose render={<Button variant="outline" size="sm" disabled={pending}>Volver</Button>} />
            <Button variant="destructive" size="sm" disabled={pending} onClick={handleEliminar}>
              {pending ? "Desconectando…" : "Sí, desconectar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
