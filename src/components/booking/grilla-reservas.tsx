"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { generarSlots } from "@/lib/slots"
import { crearReserva } from "@/actions/reservas"
import { ChevronLeft, ChevronRight, CalendarDays, Clock, AlertCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"
import { getSport, sportLabel } from "@/lib/sports"

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

function calcHoraFin(hora: string, slotMinutes: number): string {
  const [h, m] = hora.split(":").map(Number)
  const totalMin = h * 60 + m + slotMinutes
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`
}

type Estado = "disponible" | "ocupado" | "pasado" | "cerrado"

function slotClass(estado: Estado, isSelected: boolean): string {
  if (isSelected) {
    return "border-2 border-[#CAFF00] bg-[#CAFF00]/15 text-[#CAFF00] scale-105 shadow-[0_0_12px_rgba(202,255,0,0.2)]"
  }
  if (estado === "disponible") {
    return "border border-[#CAFF00]/25 bg-[#CAFF00]/[0.07] text-[#CAFF00]/70 hover:bg-[#CAFF00]/[0.15] hover:text-[#CAFF00] hover:scale-105"
  }
  if (estado === "ocupado") {
    return "border border-red-500/15 bg-red-500/[0.07] text-red-400/40 cursor-not-allowed"
  }
  if (estado === "pasado") {
    return "bg-white/[0.04] text-white/15 cursor-not-allowed"
  }
  return "bg-white/[0.02] cursor-default"
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

  function handleSelectSlot(cancha: typeof canchasConSlots[0], hora: string, estado: Estado) {
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
  }

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

  const inputClass = "w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#CAFF00]/50 focus:ring-2 focus:ring-[#CAFF00]/20 transition-colors"

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Controles: fecha + filtro de deporte */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(offsetFecha(fecha, -1), deporte)}
            disabled={fecha <= hoy}
            className="p-2 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.09] transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>

          <Popover open={calendarOpen} onOpenChange={(open) => setCalendarOpen(open)}>
            <PopoverTrigger className="border border-white/[0.1] rounded-lg px-3 py-2 flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] transition-colors text-sm font-medium text-white cursor-pointer">
              <CalendarDays className="w-4 h-4 text-white/40" />
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
            className="p-2 rounded-lg border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.09] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Filtro de deporte */}
        {deportesDisponibles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {(["todos", ...deportesDisponibles] as string[]).map((dep) => (
              <button
                key={dep}
                onClick={() => navigate(fecha, dep)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  deporte === dep
                    ? "bg-[#CAFF00] text-black border-[#CAFF00]"
                    : "bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.1] text-white/60 hover:text-white"
                }`}
              >
                {dep === "todos" ? "Todos" : sportLabel(dep)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sin horarios */}
      {slotsUnion.length === 0 ? (
        <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-10 text-center">
          <p className="text-white/40 font-medium">No hay canchas con horarios para este día.</p>
          <p className="text-sm text-white/25 mt-1">Probá con otra fecha.</p>
        </div>
      ) : (
        <>
          {/* ── MOBILE — cards por cancha ─────────────────────── */}
          <div className="block sm:hidden space-y-4">
            {canchasConSlots.map((cancha) => {
              const slotsVisibles = cancha.slots.filter((s) => s.estado !== "cerrado")
              return (
                <div
                  key={cancha.id}
                  className="bg-[#14171F] border border-white/[0.07] rounded-xl p-4 space-y-3"
                >
                  {/* Header cancha */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{cancha.name}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${getSport(cancha.sport).badgeClassSolid}`}>
                      {sportLabel(cancha.sport)}
                    </span>
                    <span className="text-xs text-white/30 ml-auto">
                      ${cancha.pricePerHour.toLocaleString("es-AR")}/h
                    </span>
                  </div>

                  {/* Grid 3 columnas */}
                  <div className="grid grid-cols-3 gap-2">
                    {slotsVisibles.map(({ hora, estado }) => {
                      const isSelected =
                        selectedSlot?.courtId === cancha.id && selectedSlot?.hora === hora
                      return (
                        <button
                          key={hora}
                          disabled={estado !== "disponible"}
                          onClick={() => handleSelectSlot(cancha, hora, estado)}
                          className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${slotClass(estado, isSelected)}`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── DESKTOP — tabla dark ──────────────────────────── */}
          <div className="hidden sm:block">
            {/* Leyenda */}
            <div className="flex justify-end gap-5 text-xs font-medium text-white/30 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-[#CAFF00]/30 bg-[#CAFF00]/[0.08] inline-block" />
                Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-red-500/20 bg-red-500/[0.07] inline-block" />
                Ocupado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-white/[0.04] inline-block" />
                Pasado
              </span>
            </div>

            <div
              className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#14171F]"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="text-left px-4 py-3 font-semibold text-white/50 whitespace-nowrap min-w-[160px]">
                      Cancha
                    </th>
                    {slotsUnion.map((hora) => (
                      <th key={hora} className="px-1 py-3 font-medium text-white/30 text-center min-w-[52px] whitespace-nowrap">
                        {hora}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {canchasConSlots.map((cancha, idx) => (
                    <tr
                      key={cancha.id}
                      className={idx < canchasConSlots.length - 1 ? "border-b border-white/[0.05]" : ""}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-semibold text-white">{cancha.name}</p>
                        <p className="text-xs text-white/30">{sportLabel(cancha.sport)}</p>
                      </td>
                      {cancha.slots.map(({ hora, estado }) => {
                        const isSelected =
                          selectedSlot?.courtId === cancha.id && selectedSlot?.hora === hora
                        return (
                          <td key={hora} className="px-1 py-2 text-center">
                            <button
                              disabled={estado !== "disponible"}
                              onClick={() => handleSelectSlot(cancha, hora, estado)}
                              className={`w-11 h-11 rounded-lg text-xs font-semibold transition-all ${slotClass(estado, isSelected)}`}
                            >
                              {estado === "cerrado"
                                ? ""
                                : estado === "disponible"
                                ? "✓"
                                : estado === "ocupado"
                                ? "✗"
                                : "–"}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Panel de confirmación */}
      {selectedSlot && (
        <div
          ref={panelRef}
          className="bg-[#14171F] border border-[#CAFF00]/20 rounded-2xl p-6 space-y-5"
        >
          <h3 className="font-display text-xl font-black uppercase text-white tracking-tight leading-none">
            Tu reserva
          </h3>

          {/* Cancha + deporte */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-white">{selectedSlot.courtName}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${getSport(selectedSlot.sport).badgeClassSolid}`}>
              {sportLabel(selectedSlot.sport)}
            </span>
          </div>

          {/* Detalles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm text-white/60">
              <CalendarDays className="w-4 h-4 shrink-0 text-white/30" />
              <span className="font-medium">{capitalizarPrimera(formatFecha(fecha))}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-white/60">
              <Clock className="w-4 h-4 shrink-0 text-white/30" />
              <span className="font-medium">
                {selectedSlot.hora} — {calcHoraFin(selectedSlot.hora, selectedSlot.slotMinutes)} hs
              </span>
              <span className="text-xs text-white/25">({selectedSlot.slotMinutes} min)</span>
            </div>
          </div>

          {/* Precio */}
          <div className="border-t border-white/[0.07] pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-white/40">Total</span>
              <span className="font-display text-3xl font-black text-[#CAFF00]">
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
                autoComplete="name"
                className={inputClass}
              />
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Tu teléfono"
                type="tel"
                autoComplete="tel"
                className={inputClass}
              />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => { setSelectedSlot(null); setError(null) }}
              disabled={isPending}
              className="flex-1 border border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={isPending}
              className="flex-1 bg-[#CAFF00] hover:bg-[#d4ff1a] active:scale-[0.98] text-black rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
            >
              {isPending ? "Confirmando…" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
