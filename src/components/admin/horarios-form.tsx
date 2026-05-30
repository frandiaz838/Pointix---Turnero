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
      <div className="bg-white border rounded-lg divide-y">
        {DIAS.map((nombre, dia) => {
          const h = getHorario(dia)
          return (
            <div key={dia} className="p-4 flex items-center gap-4">
              <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  name={`activo_${dia}`}
                  checked={activos[dia]}
                  onChange={(e) => setActivos((prev) => ({ ...prev, [dia]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm font-medium">{nombre}</span>
              </label>

              {activos[dia] ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Apertura</span>
                    <input
                      type="time"
                      name={`apertura_${dia}`}
                      defaultValue={h?.openTime ?? "08:00"}
                      required
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Cierre</span>
                    <input
                      type="time"
                      name={`cierre_${dia}`}
                      defaultValue={h?.closeTime ?? "22:00"}
                      required
                      className="border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Turno</span>
                    <select
                      name={`slots_${dia}`}
                      defaultValue={h?.slotMinutes ?? 60}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                    </select>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : "Guardar horarios"}
      </Button>
    </form>
  )
}
