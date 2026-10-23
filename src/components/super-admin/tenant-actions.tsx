"use client"

import { useState, useTransition } from "react"
import {
  aprobarComplejo,
  rechazarComplejo,
  extenderPrueba,
  registrarPago,
  suspenderComplejo,
  reactivarComplejo,
  guardarNotasAdmin,
  entrarComoComplejo,
} from "@/actions/super-admin"
import type { EstadoTenant } from "@/lib/tenant-status"

interface Props {
  tenantId: string
  estado: EstadoTenant
  notas: string | null
}

const btn = "text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors disabled:opacity-40"
const btnOutline = `${btn} border-white/10 text-white/70 hover:text-white hover:border-white/25`
const btnLime = `${btn} border-transparent bg-[#A3FF12] text-black hover:bg-[#d4ff1a]`
const btnDanger = `${btn} border-red-500/30 text-red-400 hover:bg-red-500/10`
const selectCls = "text-xs bg-[#1A1E2A] border border-white/10 rounded-lg px-2 py-1.5 text-white/80"

// Acciones del super admin sobre un complejo. Las destructivas piden un
// segundo click de confirmación inline.
export function TenantActions({ tenantId, estado, notas }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<"rechazar" | "suspender" | null>(null)
  const [diasPrueba, setDiasPrueba] = useState(15)
  const [mesesPago, setMesesPago] = useState(1)
  const [editandoNotas, setEditandoNotas] = useState(false)
  const [textoNotas, setTextoNotas] = useState(notas ?? "")

  function run(fn: () => Promise<unknown>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setConfirmando(null)
        setEditandoNotas(false)
      } catch (e) {
        // redirect() de Next tira una excepción especial: dejarla pasar
        if (typeof (e as { digest?: unknown })?.digest === "string" &&
            (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw e
        setError(e instanceof Error ? e.message : "Ocurrió un error")
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {estado === "pendiente" && (
          <>
            <button className={btnLime} disabled={pending} onClick={() => run(() => aprobarComplejo(tenantId))}>
              Aprobar
            </button>
            {confirmando === "rechazar" ? (
              <button className={btnDanger} disabled={pending} onClick={() => run(() => rechazarComplejo(tenantId))}>
                ¿Borrar club y cuenta? Confirmar
              </button>
            ) : (
              <button className={btnDanger} disabled={pending} onClick={() => setConfirmando("rechazar")}>
                Rechazar
              </button>
            )}
          </>
        )}

        {estado !== "pendiente" && (
          <>
            <span className="inline-flex items-center gap-1">
              <select className={selectCls} value={mesesPago} onChange={(e) => setMesesPago(Number(e.target.value))}>
                {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "mes" : "meses"}</option>)}
              </select>
              <button className={btnLime} disabled={pending} onClick={() => run(() => registrarPago(tenantId, mesesPago))}>
                Registrar pago
              </button>
            </span>
            <span className="inline-flex items-center gap-1">
              <select className={selectCls} value={diasPrueba} onChange={(e) => setDiasPrueba(Number(e.target.value))}>
                {[7, 15, 30].map((d) => <option key={d} value={d}>+{d} días</option>)}
              </select>
              <button className={btnOutline} disabled={pending} onClick={() => run(() => extenderPrueba(tenantId, diasPrueba))}>
                Extender prueba
              </button>
            </span>
            {estado === "suspendido" ? (
              <button className={btnOutline} disabled={pending} onClick={() => run(() => reactivarComplejo(tenantId))}>
                Reactivar
              </button>
            ) : confirmando === "suspender" ? (
              <button className={btnDanger} disabled={pending} onClick={() => run(() => suspenderComplejo(tenantId))}>
                ¿Ocultar panel y página? Confirmar
              </button>
            ) : (
              <button className={btnDanger} disabled={pending} onClick={() => setConfirmando("suspender")}>
                Suspender
              </button>
            )}
          </>
        )}

        <button className={btnOutline} disabled={pending} onClick={() => run(() => entrarComoComplejo(tenantId))}>
          Entrar al panel →
        </button>
        <button className={btnOutline} disabled={pending} onClick={() => setEditandoNotas((v) => !v)}>
          {notas ? "Editar notas" : "Agregar nota"}
        </button>
        {confirmando && (
          <button className="text-xs text-white/40 hover:text-white" onClick={() => setConfirmando(null)}>
            Cancelar
          </button>
        )}
      </div>

      {editandoNotas && (
        <div className="space-y-2">
          <textarea
            value={textoNotas}
            onChange={(e) => setTextoNotas(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Notas internas: cómo llegó, qué precio se acordó, recordatorios…"
            className="w-full text-sm bg-[#1A1E2A] border border-white/10 rounded-lg p-2.5 text-white/85 placeholder:text-white/25"
          />
          <button className={btnLime} disabled={pending} onClick={() => run(() => guardarNotasAdmin(tenantId, textoNotas))}>
            Guardar nota
          </button>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
