"use client"

import { useState, useTransition } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guardarHorarios } from "@/actions/canchas"

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface ScheduleData {
  dayOfWeek: number
  openTime: string
  closeTime: string
  slotMinutes: number
}

interface DiaState {
  activo: boolean
  apertura: string
  cierre: string
  slots: number
}

interface Props {
  courtId: string
  tenantId: string
  slug: string
  horariosActuales: ScheduleData[]
}

const inputTimeClass =
  "border border-white/[0.1] bg-white/[0.05] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#A3FF12]/40 transition-colors [color-scheme:dark]"

const selectClass =
  "border border-white/[0.1] bg-white/[0.05] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#A3FF12]/40 transition-colors [color-scheme:dark]"

export function HorariosForm({ courtId, tenantId, slug, horariosActuales }: Props) {
  // Estado inicial: cada día con su config (o defaults si está cerrado)
  const [dias, setDias] = useState<DiaState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const existente = horariosActuales.find(h => h.dayOfWeek === i)
      return existente
        ? { activo: true, apertura: existente.openTime, cierre: existente.closeTime, slots: existente.slotMinutes }
        : { activo: false, apertura: "08:00", cierre: "22:00", slots: 60 }
    })
  )

  const [pending, startTransition] = useTransition()
  const [copyOpenFor, setCopyOpenFor] = useState<number | null>(null)
  const [copyTargets, setCopyTargets] = useState<Set<number>>(new Set())

  function updateDia(dia: number, patch: Partial<DiaState>) {
    setDias(prev => prev.map((d, i) => (i === dia ? { ...d, ...patch } : d)))
  }

  function abrirCopia(dia: number) {
    setCopyOpenFor(dia)
    setCopyTargets(new Set())
  }
  function cerrarCopia() {
    setCopyOpenFor(null)
    setCopyTargets(new Set())
  }
  function toggleTarget(dia: number) {
    setCopyTargets(prev => {
      const next = new Set(prev)
      if (next.has(dia)) next.delete(dia)
      else next.add(dia)
      return next
    })
  }
  function aplicarCopia() {
    if (copyOpenFor === null) return
    const origen = dias[copyOpenFor]
    setDias(prev =>
      prev.map((d, i) => (copyTargets.has(i) ? { activo: true, apertura: origen.apertura, cierre: origen.cierre, slots: origen.slots } : d))
    )
    cerrarCopia()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData()
    dias.forEach((d, i) => {
      if (d.activo) {
        formData.set(`activo_${i}`, "on")
        formData.set(`apertura_${i}`, d.apertura)
        formData.set(`cierre_${i}`, d.cierre)
        formData.set(`slots_${i}`, String(d.slots))
      }
    })
    startTransition(async () => {
      await guardarHorarios(courtId, tenantId, slug, formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass-card rounded-xl divide-y divide-white/[0.06]">
        {DIAS.map((nombre, dia) => {
          const d = dias[dia]
          const popoverAbierto = copyOpenFor === dia
          return (
            <div key={dia} className="px-4 py-3.5">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2.5 w-28 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.activo}
                    onChange={(e) => updateDia(dia, { activo: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#A3FF12] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-white/80">{nombre}</span>
                </label>

                {d.activo ? (
                  <>
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/35">Apertura</span>
                        <input
                          type="time"
                          value={d.apertura}
                          onChange={(e) => updateDia(dia, { apertura: e.target.value })}
                          className={inputTimeClass}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/35">Cierre</span>
                        <input
                          type="time"
                          value={d.cierre}
                          onChange={(e) => updateDia(dia, { cierre: e.target.value })}
                          className={inputTimeClass}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/35">Turno</span>
                        <select
                          value={d.slots}
                          onChange={(e) => updateDia(dia, { slots: parseInt(e.target.value) })}
                          className={selectClass}
                        >
                          <option value={30}>30 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => (popoverAbierto ? cerrarCopia() : abrirCopia(dia))}
                      className="flex items-center gap-1.5 text-xs font-medium text-white/45 hover:text-[#A3FF12] transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
                      title="Copiar este horario a otros días"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copiar a…
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-white/25">Cerrado</span>
                )}
              </div>

              {/* Popover de "Copiar a…" inline debajo del día */}
              {popoverAbierto && (
                <div className="mt-3 ml-32 p-3 rounded-lg bg-[#0F1218] border border-white/[0.08] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Aplicar el horario de {nombre} a:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAS.map((n, i) => {
                      if (i === dia) return null
                      const selected = copyTargets.has(i)
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleTarget(i)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            selected
                              ? "bg-[#A3FF12] text-black"
                              : "bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1]"
                          }`}
                        >
                          {DIAS_CORTOS[i]}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={aplicarCopia}
                      disabled={copyTargets.size === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A3FF12] hover:bg-[#d4ff1a] text-black text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <Check className="w-3 h-3" />
                      Aplicar {copyTargets.size > 0 && `(${copyTargets.size})`}
                    </button>
                    <button
                      type="button"
                      onClick={cerrarCopia}
                      className="text-xs text-white/40 hover:text-white/70 px-2 py-1 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Button type="submit" className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold" disabled={pending}>
        {pending ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  )
}
