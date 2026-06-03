"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { crearReserva } from "@/actions/reservas"
import { AlertCircle } from "lucide-react"

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface Props {
  courtId: string
  slug: string
  fechaSeleccionada: string
  todosLosSlots: string[]
  slotsDisponibles: string[]
  slotsOcupados: string[]
  isLoggedIn: boolean
  canchaAbierta: boolean
  diasAbiertos: number[]
}

const inputClass =
  "w-full border border-white/[0.1] bg-white/[0.04] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#CAFF00]/40 transition-colors [color-scheme:dark]"

export function ReservaForm({
  courtId,
  slug,
  fechaSeleccionada,
  todosLosSlots,
  slotsDisponibles,
  slotsOcupados,
  isLoggedIn,
  canchaAbierta,
  diasAbiertos,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHoraSeleccionada(null)
    router.push(`/${slug}/canchas/${courtId}/reservar?fecha=${e.target.value}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!horaSeleccionada) return
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await crearReserva(formData)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="hora" value={horaSeleccionada ?? ""} />

      {/* Selector de fecha */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <label className="text-sm font-medium text-white/60">Fecha</label>
        <input
          name="fecha"
          type="date"
          defaultValue={fechaSeleccionada}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleFechaChange}
          className={inputClass}
        />
        <div className="flex gap-1">
          {DIAS_CORTOS.map((nombre, i) => (
            <span
              key={i}
              className={`flex-1 text-center text-xs py-1.5 rounded-lg font-semibold border ${
                diasAbiertos.includes(i)
                  ? "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25"
                  : "bg-white/[0.03] text-white/20 border-white/[0.06]"
              }`}
            >
              {nombre}
            </span>
          ))}
        </div>
      </div>

      {/* Grilla de horarios */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-white/60">Elegí un horario</p>

        {!canchaAbierta ? (
          <p className="text-sm text-white/30">La cancha no tiene horarios configurados para este día.</p>
        ) : todosLosSlots.length === 0 ? (
          <p className="text-sm text-white/30">No hay turnos disponibles para esta fecha.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {todosLosSlots.map((slot) => {
                const ocupado = slotsOcupados.includes(slot)
                const seleccionado = horaSeleccionada === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={ocupado}
                    onClick={() => setHoraSeleccionada(slot)}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                      seleccionado
                        ? "slot-selected"
                        : ocupado
                        ? "slot-occupied"
                        : "slot-available"
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 text-xs text-white/25 mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-white/[0.04] border border-white/[0.08] inline-block" />
                Ocupado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#CAFF00] inline-block" />
                Seleccionado
              </span>
            </div>
          </>
        )}
      </div>

      {/* Datos del invitado */}
      {!isLoggedIn && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-white/60">Tus datos</p>
          <div className="space-y-2">
            <input
              name="guestName"
              type="text"
              placeholder="Nombre completo"
              autoComplete="name"
              required
              className={inputClass}
            />
            <input
              name="guestPhone"
              type="tel"
              placeholder="Teléfono (ej: 11 1234-5678)"
              autoComplete="tel"
              required
              className={inputClass}
            />
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {canchaAbierta && (
        <Button
          type="submit"
          className="btn-lime-glow w-full h-11 bg-[#CAFF00] hover:bg-[#d4ff1a] active:scale-[0.98] text-black font-bold"
          disabled={!horaSeleccionada || pending}
        >
          {pending
            ? "Confirmando..."
            : horaSeleccionada
            ? `Confirmar reserva a las ${horaSeleccionada}`
            : "Seleccioná un horario"}
        </Button>
      )}
    </form>
  )
}
