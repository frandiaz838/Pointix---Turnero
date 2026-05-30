"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { generarSlots } from "@/lib/slots"
import { crearReserva } from "@/actions/reservas"
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"

interface Cancha {
  id: string
  name: string
  sport: string
  pricePerHour: number
  schedules: {
    dayOfWeek: number
    openTime: string
    closeTime: string
    slotMinutes: number
  }[]
}

interface Reserva {
  courtId: string
  hora: string
}

interface SelectedSlot {
  courtId: string
  courtName: string
  sport: string
  hora: string
  slotMinutes: number
  precio: number
}

interface Props {
  slug: string
  canchas: Cancha[]
  reservas: Reserva[]
  fecha: string
  deporte: string
  deportesDisponibles: string[]
  isLoggedIn: boolean
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

function formatFecha(fecha: string) {
  const d = new Date(fecha + "T12:00:00Z")
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}

function capitalizarPrimera(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function offsetFecha(fecha: string, dias: number) {
  const d = new Date(fecha + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().split("T")[0]
}

function deporteLabel(sport: string) {
  return sport === "PADEL" ? "Pádel" : "Fútbol"
}

function calcHoraFin(hora: string, slotMinutes: number): string {
  const [h, m] = hora.split(":").map(Number)
  const totalMin = h * 60 + m + slotMinutes
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`
}

const deporteBadge: Record<string, string> = {
  PADEL: "bg-blue-50 text-blue-700 border-blue-200",
  FOOTBALL: "bg-green-50 text-green-700 border-green-200",
}

export function GrillaReservas({
  slug,
  canchas,
  reservas,
  fecha,
  deporte,
  deportesDisponibles,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedSlot) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedSlot])

  const ahora = new Date()
  const hoy = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-")
  const ahoraHour = ahora.getHours()

  function navigate(nuevaFecha: string, nuevoDeporte: string) {
    if (nuevaFecha < hoy) return
    const params = new URLSearchParams({ fecha: nuevaFecha, deporte: nuevoDeporte })
    router.push(`/${slug}/reservar?${params}`)
    setSelectedSlot(null)
    setError(null)
  }

  function slotEsPasado(hora: string) {
    if (fecha > hoy) return false
    if (fecha < hoy) return true
    return parseInt(hora.split(":")[0]) <= ahoraHour
  }

  const diaSemana = new Date(fecha + "T12:00:00Z").getUTCDay()

  const canchasFiltradas = canchas.filter(
    (c) => deporte === "todos" || c.sport === deporte
  )

  const todosLosSlots = new Set<string>()
  canchasFiltradas.forEach((c) => {
    const sch = c.schedules.find((s) => s.dayOfWeek === diaSemana)
    if (sch) generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).forEach((s) => todosLosSlots.add(s))
  })
  const slotsUnion = [...todosLosSlots].sort()

  const canchasConSlots = canchasFiltradas.filter((c) =>
    c.schedules.some((s) => s.dayOfWeek === diaSemana)
  ).map((c) => {
    const sch = c.schedules.find((s) => s.dayOfWeek === diaSemana)
    const slotsCancha = sch
      ? new Set(generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes))
      : new Set<string>()
    const slotsOcupados = new Set(
      reservas.filter((r) => r.courtId === c.id).map((r) => r.hora)
    )

    return {
      ...c,
      slotMinutes: sch?.slotMinutes ?? 60,
      slots: slotsUnion.map((hora) => {
        if (!slotsCancha.has(hora)) return { hora, estado: "cerrado" as const }
        if (slotEsPasado(hora)) return { hora, estado: "pasado" as const }
        if (slotsOcupados.has(hora)) return { hora, estado: "ocupado" as const }
        return { hora, estado: "disponible" as const }
      }),
    }
  })

  function handleConfirmar() {
    if (!selectedSlot) return
    if (!isLoggedIn && (!guestName.trim() || !guestPhone.trim())) {
      setError("Ingresá tu nombre y teléfono para continuar.")
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set("courtId", selectedSlot.courtId)
    formData.set("fecha", fecha)
    formData.set("hora", selectedSlot.hora)
    formData.set("slug", slug)
    formData.set("slotMinutes", String(selectedSlot.slotMinutes))
    if (!isLoggedIn) {
      formData.set("guestName", guestName)
      formData.set("guestPhone", guestPhone)
    }

    startTransition(async () => {
      try {
        await crearReserva(formData)
      } catch (e) {
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          setError(e.message)
        }
      }
    })
  }

  const fechaDate = new Date(fecha + "T12:00:00Z")
  const hoyDate = new Date(hoy + "T00:00:00")

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">

      {/* Controles: fecha + filtro de deporte */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(offsetFecha(fecha, -1), deporte)}
            disabled={fecha <= hoy}
            className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <Popover open={calendarOpen} onOpenChange={(open) => setCalendarOpen(open)}>
            <PopoverTrigger className="border rounded-lg px-3 py-2 flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800 cursor-pointer">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              {capitalizarPrimera(formatFecha(fecha))}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom" align="start">
              <Calendar
                mode="single"
                selected={fechaDate}
                onSelect={(date) => {
                  if (date) {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, "0")
                    const day = String(date.getDate()).padStart(2, "0")
                    navigate(`${year}-${month}-${day}`, deporte)
                    setCalendarOpen(false)
                  }
                }}
                disabled={{ before: hoyDate }}
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={() => navigate(offsetFecha(fecha, 1), deporte)}
            className="p-2 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Filtro de deporte */}
        {deportesDisponibles.length > 1 && (
          <div className="flex gap-2">
            {(["todos", ...deportesDisponibles] as string[]).map((dep) => (
              <button
                key={dep}
                onClick={() => navigate(fecha, dep)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  deporte === dep
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {dep === "todos" ? "Todos" : deporteLabel(dep)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leyenda encima de la grilla, alineada a la derecha */}
      {slotsUnion.length > 0 && (
        <div className="flex justify-end gap-5 text-xs font-medium text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-green-300 bg-[#dcfce7] inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-red-200 bg-[#fee2e2] inline-block" /> Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#d1d5db] inline-block" /> Pasado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#f3f4f6] border border-gray-200 inline-block" /> Sin horario
          </span>
        </div>
      )}

      {/* Grilla */}
      {slotsUnion.length === 0 ? (
        <div className="bg-white border rounded-lg p-10 text-center">
          <p className="text-gray-500 font-medium">No hay canchas con horarios para este día.</p>
          <p className="text-sm text-gray-400 mt-1">Probá con otra fecha.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm" style={{ WebkitOverflowScrolling: "touch" }}>
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap min-w-[150px]">
                  Cancha
                </th>
                {slotsUnion.map((hora) => (
                  <th key={hora} className="px-1 py-3 font-medium text-gray-400 text-center min-w-[52px]">
                    {hora}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {canchasConSlots.map((cancha, idx) => (
                <tr
                  key={cancha.id}
                  className={idx < canchasConSlots.length - 1 ? "border-b" : ""}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-gray-800">{cancha.name}</p>
                    <p className="text-xs font-medium text-gray-400">{deporteLabel(cancha.sport)}</p>
                  </td>
                  {cancha.slots.map(({ hora, estado }) => {
                    const isSelected =
                      selectedSlot?.courtId === cancha.id && selectedSlot?.hora === hora
                    return (
                      <td key={hora} className="px-1 py-2 text-center">
                        <button
                          disabled={estado !== "disponible"}
                          onClick={() => {
                            if (estado !== "disponible") return
                            setSelectedSlot({
                              courtId: cancha.id,
                              courtName: cancha.name,
                              sport: cancha.sport,
                              hora,
                              slotMinutes: cancha.slotMinutes,
                              precio: cancha.pricePerHour,
                            })
                            setError(null)
                          }}
                          className={
                            isSelected
                              ? "w-11 h-11 rounded-md text-xs font-semibold border-2 border-blue-500 bg-blue-50 text-blue-700 scale-105 shadow transition-all"
                              : estado === "disponible"
                              ? "w-11 h-11 rounded-md text-xs font-medium border border-green-300 bg-[#dcfce7] text-green-700 hover:bg-green-100 hover:scale-105 transition-all"
                              : estado === "ocupado"
                              ? "w-11 h-11 rounded-md text-xs font-medium border border-red-200 bg-[#fee2e2] text-red-400 cursor-not-allowed"
                              : estado === "pasado"
                              ? "w-11 h-11 rounded-md text-xs font-medium bg-[#d1d5db] text-[#6b7280] cursor-not-allowed"
                              : "w-11 h-11 rounded-sm bg-[#f3f4f6] border border-gray-200 outline-none cursor-default"
                          }
                        >
                          {estado === "cerrado" ? "" : estado === "disponible" ? "✓" : estado === "ocupado" ? "✗" : "–"}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Panel de confirmación */}
      {selectedSlot && (
        <div ref={panelRef} className="bg-white border-2 border-gray-900 rounded-xl p-6 space-y-5 shadow-md">

          {/* Encabezado */}
          <h3 className="text-base font-bold text-gray-900">Resumen de tu reserva</h3>

          {/* Cancha + deporte */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900">{selectedSlot.courtName}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${deporteBadge[selectedSlot.sport] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {deporteLabel(selectedSlot.sport)}
            </span>
          </div>

          {/* Detalles */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="font-medium">{capitalizarPrimera(formatFecha(fecha))}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Clock className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="font-medium">
                {selectedSlot.hora} — {calcHoraFin(selectedSlot.hora, selectedSlot.slotMinutes)} hs
              </span>
              <span className="text-xs text-gray-400">({selectedSlot.slotMinutes} min)</span>
            </div>
          </div>

          {/* Precio */}
          <div className="border-t pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-500">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                ${selectedSlot.precio.toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          {/* Datos del invitado */}
          {!isLoggedIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Tu nombre completo"
                className="border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 placeholder:text-gray-400"
              />
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Tu teléfono"
                type="tel"
                className="border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-black/20 placeholder:text-gray-400"
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-red-500">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => { setSelectedSlot(null); setError(null) }}
              disabled={isPending}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-3 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={isPending}
              className="flex-1 bg-black text-white rounded-lg py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Confirmando…" : "Confirmar reserva"}
            </button>
          </div>

        </div>
      )}

    </div>
  )
}
