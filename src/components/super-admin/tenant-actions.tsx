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
  /** subscriptionEndsAt en ISO, o null si no vence. */
  venceIso: string | null
  notas: string | null
}

type Panel = "pago" | "prueba" | "notas" | "rechazar" | "suspender" | null

const btn = "text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors disabled:opacity-40"
const btnOutline = `${btn} border-white/10 text-white/70 hover:text-white hover:border-white/25`
const btnLime = `${btn} border-transparent bg-[#A3FF12] text-black hover:bg-[#d4ff1a]`
const btnDanger = `${btn} border-red-500/30 text-red-400 hover:bg-red-500/10`
const chip = "text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors"

const OPCIONES_MESES = [1, 3, 6, 12]
const OPCIONES_DIAS = [7, 15, 30]

// Misma regla que el server (actions/super-admin.ts): si todavía no venció,
// se suma desde la fecha de vencimiento; si ya venció o no tiene, desde hoy.
function nuevaFecha(venceIso: string | null, dias: number): string {
  const vence = venceIso ? new Date(venceIso).getTime() : 0
  const base = vence > Date.now() ? vence : Date.now()
  return new Date(base + dias * 86_400_000).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires",
  })
}

// Acciones del super admin sobre un complejo. Pago y prueba abren un mini
// panel que muestra hasta qué fecha queda antes de confirmar.
export function TenantActions({ tenantId, estado, venceIso, notas }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [meses, setMeses] = useState(1)
  const [dias, setDias] = useState(15)
  const [textoNotas, setTextoNotas] = useState(notas ?? "")

  function abrir(p: Panel) {
    setError(null)
    setPanel((actual) => (actual === p ? null : p))
  }

  function run(fn: () => Promise<unknown>) {
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setPanel(null)
      } catch (e) {
        // redirect() de Next tira una excepción especial: dejarla pasar
        if (typeof (e as { digest?: unknown })?.digest === "string" &&
            (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw e
        setError(e instanceof Error ? e.message : "Ocurrió un error")
      }
    })
  }

  const yaVencio = estado === "vencido"

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center gap-2">
        {estado === "pendiente" ? (
          <>
            <button className={btnLime} disabled={pending} onClick={() => run(() => aprobarComplejo(tenantId))}>
              Aprobar y empezar prueba
            </button>
            <button className={btnDanger} disabled={pending} onClick={() => abrir("rechazar")}>
              Rechazar
            </button>
          </>
        ) : (
          <>
            <button className={panel === "pago" ? btnLime : btnOutline} disabled={pending} onClick={() => abrir("pago")}>
              Registrar pago
            </button>
            <button className={panel === "prueba" ? btnLime : btnOutline} disabled={pending} onClick={() => abrir("prueba")}>
              Extender prueba
            </button>
            {estado === "suspendido" ? (
              <button className={btnOutline} disabled={pending} onClick={() => run(() => reactivarComplejo(tenantId))}>
                Reactivar
              </button>
            ) : (
              <button className={btnDanger} disabled={pending} onClick={() => abrir("suspender")}>
                Suspender
              </button>
            )}
          </>
        )}
        <button className={btnOutline} disabled={pending} onClick={() => run(() => entrarComoComplejo(tenantId))}>
          Entrar al panel →
        </button>
        <button className={btnOutline} disabled={pending} onClick={() => abrir("notas")}>
          {notas ? "Editar nota" : "Agregar nota"}
        </button>
      </div>

      {panel === "pago" && (
        <PanelBox>
          <p className="text-sm text-white/80 font-semibold">¿Cuántos meses te pagó?</p>
          <div className="flex flex-wrap gap-1.5">
            {OPCIONES_MESES.map((m) => (
              <button
                key={m}
                onClick={() => setMeses(m)}
                className={`${chip} ${meses === m ? "bg-[#A3FF12] text-black border-transparent" : "border-white/10 text-white/60 hover:text-white"}`}
              >
                {m} {m === 1 ? "mes" : "meses"}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/50">
            El club pasa a <span className="text-[#A3FF12] font-semibold">Activo</span> hasta el{" "}
            <span className="text-white font-semibold">{nuevaFecha(venceIso, meses * 30)}</span>
            {yaVencio || !venceIso ? " (contando desde hoy)." : " (se suma a lo que le quedaba)."}
          </p>
          <div className="flex gap-2">
            <button className={btnLime} disabled={pending} onClick={() => run(() => registrarPago(tenantId, meses))}>
              Confirmar pago
            </button>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </PanelBox>
      )}

      {panel === "prueba" && (
        <PanelBox>
          <p className="text-sm text-white/80 font-semibold">¿Cuántos días más de prueba gratis?</p>
          <div className="flex flex-wrap gap-1.5">
            {OPCIONES_DIAS.map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`${chip} ${dias === d ? "bg-[#A3FF12] text-black border-transparent" : "border-white/10 text-white/60 hover:text-white"}`}
              >
                +{d} días
              </button>
            ))}
          </div>
          <p className="text-xs text-white/50">
            Queda <span className="text-cyan-300 font-semibold">En prueba</span> hasta el{" "}
            <span className="text-white font-semibold">{nuevaFecha(venceIso, dias)}</span>. Útil si necesita más tiempo para decidir.
          </p>
          <div className="flex gap-2">
            <button className={btnLime} disabled={pending} onClick={() => run(() => extenderPrueba(tenantId, dias))}>
              Confirmar
            </button>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </PanelBox>
      )}

      {panel === "suspender" && (
        <PanelBox>
          <p className="text-sm text-white/80">
            Se bloquea el panel del club <strong>y su página pública</strong> (no puede recibir reservas). Las reservas ya hechas no se tocan. Se puede reactivar cuando quieras.
          </p>
          <div className="flex gap-2">
            <button className={btnDanger} disabled={pending} onClick={() => run(() => suspenderComplejo(tenantId))}>
              Sí, suspender
            </button>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </PanelBox>
      )}

      {panel === "rechazar" && (
        <PanelBox>
          <p className="text-sm text-white/80">
            Se <strong>borran</strong> el club y la cuenta del dueño. No se puede deshacer.
          </p>
          <div className="flex gap-2">
            <button className={btnDanger} disabled={pending} onClick={() => run(() => rechazarComplejo(tenantId))}>
              Sí, rechazar y borrar
            </button>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </PanelBox>
      )}

      {panel === "notas" && (
        <PanelBox>
          <textarea
            value={textoNotas}
            onChange={(e) => setTextoNotas(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Notas internas: cómo llegó, qué precio se acordó, recordatorios…"
            className="w-full text-sm bg-[#1A1E2A] border border-white/10 rounded-lg p-2.5 text-white/85 placeholder:text-white/25"
          />
          <div className="flex gap-2">
            <button className={btnLime} disabled={pending} onClick={() => run(() => guardarNotasAdmin(tenantId, textoNotas))}>
              Guardar nota
            </button>
            <button className="text-xs text-white/40 hover:text-white" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </PanelBox>
      )}

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

function PanelBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3 max-w-lg">
      {children}
    </div>
  )
}
