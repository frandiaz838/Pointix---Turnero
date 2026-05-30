"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { crearReserva } from "@/actions/reservas"

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="hora" value={horaSeleccionada ?? ""} />

      {/* Selector de fecha */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <label className="text-sm font-medium">Fecha</label>
        <input
          name="fecha"
          type="date"
          defaultValue={fechaSeleccionada}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleFechaChange}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
        <div className="flex gap-1">
          {DIAS_CORTOS.map((nombre, i) => (
            <span
              key={i}
              className={`flex-1 text-center text-xs py-1.5 rounded font-medium border ${
                diasAbiertos.includes(i)
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-500 border-red-200"
              }`}
            >
              {nombre}
            </span>
          ))}
        </div>
      </div>

      {/* Grilla de horarios */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Elegí un horario</p>

        {!canchaAbierta ? (
          <p className="text-sm text-gray-500">La cancha no tiene horarios configurados para este día.</p>
        ) : todosLosSlots.length === 0 ? (
          <p className="text-sm text-gray-500">No hay turnos disponibles para esta fecha.</p>
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
                    className={`
                      rounded-md py-2 text-sm font-medium border transition-colors
                      ${ocupado ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : ""}
                      ${seleccionado ? "bg-black text-white border-black" : ""}
                      ${!ocupado && !seleccionado ? "hover:bg-gray-50 border-gray-300" : ""}
                    `}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gray-100 border inline-block" /> Ocupado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-black inline-block" /> Seleccionado
              </span>
            </div>
          </>
        )}
      </div>

      {/* Datos del invitado — solo si no está logueado */}
      {!isLoggedIn && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">Tus datos</p>
          <div className="space-y-2">
            <input
              name="guestName"
              type="text"
              placeholder="Nombre completo"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <input
              name="guestPhone"
              type="tel"
              placeholder="Teléfono (ej: 11 1234-5678)"
              required
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {canchaAbierta && (
        <Button type="submit" className="w-full" disabled={!horaSeleccionada || pending}>
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
