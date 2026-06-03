"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { guardarHorarios } from "@/actions/canchas"

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

interface ScheduleData {
  dayOfWeek: number
  openTime: string
  closeTime: string
  slotMinutes: number
}

interface Props {
  courtId: string
  tenantId: string
  slug: string
  horariosActuales: ScheduleData[]
}

const inputTimeClass =
  "border border-white/[0.1] bg-white/[0.05] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#CAFF00]/40 transition-colors [color-scheme:dark]"

const selectClass =
  "border border-white/[0.1] bg-white/[0.05] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#CAFF00]/40 transition-colors [color-scheme:dark]"

export function HorariosForm({ courtId, tenantId, slug, horariosActuales }: Props) {
  const [activos, setActivos] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(
      Array.from({ length: 7 }, (_, i) => [i, horariosActuales.some((h) => h.dayOfWeek === i)])
    )
  )
  const [pending, setPending] = useState(false)

  function getHorario(dia: number) {
    return horariosActuales.find((h) => h.dayOfWeek === dia)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    await guardarHorarios(courtId, tenantId, slug, formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass-card rounded-xl divide-y divide-white/[0.06]">
        {DIAS.map((nombre, dia) => {
          const h = getHorario(dia)
          return (
            <div key={dia} className="px-4 py-3.5 flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2.5 w-28 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  name={`activo_${dia}`}
                  checked={activos[dia]}
                  onChange={(e) => setActivos((prev) => ({ ...prev, [dia]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#CAFF00] cursor-pointer"
                />
                <span className="text-sm font-medium text-white/80">{nombre}</span>
              </label>

              {activos[dia] ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/35">Apertura</span>
                    <input
                      type="time"
                      name={`apertura_${dia}`}
                      defaultValue={h?.openTime ?? "08:00"}
                      required
                      className={inputTimeClass}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/35">Cierre</span>
                    <input
                      type="time"
                      name={`cierre_${dia}`}
                      defaultValue={h?.closeTime ?? "22:00"}
                      required
                      className={inputTimeClass}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white/35">Turno</span>
                    <select
                      name={`slots_${dia}`}
                      defaultValue={h?.slotMinutes ?? 60}
                      className={selectClass}
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-white/25">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>

      <Button type="submit" className="btn-lime-glow w-full bg-[#CAFF00] hover:bg-[#d4ff1a] text-black font-bold" disabled={pending}>
        {pending ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  )
}
