"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { generarSlots } from "@/lib/slots"
import { crearReserva } from "@/actions/reservas"
import { ChevronLeft, ChevronRight, CalendarDays, Clock, AlertCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"
import { sportLabel } from "@/lib/sports"

interface Cancha {
  id: string
  name: string
  sport: string
  pricePerHour: number
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[]
}

interface Reserva { courtId: string; hora: string }

interface SelectedSlot {
  courtId: string; courtName: string; sport: string
  hora: string; slotMinutes: number; precio: number
}

interface Props {
  slug: string; canchas: Cancha[]; reservas: Reserva[]
  fecha: string
  /** "Hoy" calculado en el server con timezone AR, evita desfases por
   * cliente con la pestaña abierta cruzando medianoche o con TZ distinto. */
  hoyAr: string
  deporte: string; deportesDisponibles: string[]; isLoggedIn: boolean
}

const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFecha(f: string) {
  const d = new Date(f + "T12:00:00Z")
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}
function capitalizarPrimera(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function offsetFecha(f: string, dias: number) {
  const d = new Date(f + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().split("T")[0]
}
function calcHoraFin(hora: string, mins: number) {
  const [h, m] = hora.split(":").map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2,"0")}:${String(t % 60).padStart(2,"0")}`
}

// Agrupa por momento del día. < 12 mañana, 12-18 tarde, 19+ noche.
function momentoDelDia(hora: string): "manana" | "tarde" | "noche" {
  const h = parseInt(hora.split(":")[0], 10)
  if (h < 12) return "manana"
  if (h < 19) return "tarde"
  return "noche"
}

// Formato de teléfono argentino: agrupa últimos 8 dígitos como ####-####.
function formatPhoneArg(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 13)
  if (digits.length === 0) return ""
  if (digits.length <= 4) return digits
  if (digits.length <= 8) return `${digits.slice(0, -4)}-${digits.slice(-4)}`
  const last8 = digits.slice(-8)
  const area = digits.slice(0, -8)
  return `${area} ${last8.slice(0, 4)}-${last8.slice(4)}`
}

const MOMENTO_LABEL: Record<"manana" | "tarde" | "noche", string> = {
  manana: "Mañana",
  tarde:  "Tarde",
  noche:  "Noche",
}

type Estado = "disponible" | "ocupado" | "pasado" | "cerrado"

export function GrillaReservas({ slug, canchas, reservas, fecha, hoyAr, deporte, deportesDisponibles, isLoggedIn }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservado = searchParams.get("reservado")

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [guestName, setGuestName] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Cuando llega ?reservado=true (post-confirmación), limpiar el panel
  // y los inputs para que no quede el formulario abierto.
  useEffect(() => {
    if (!reservado) return
    setSelectedSlot(null)
    setError(null)
    setGuestName("")
    setGuestPhone("")
    setGuestEmail("")
  }, [reservado])

  useEffect(() => {
    if (selectedSlot) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedSlot])

  // "hoy" lo recibimos del server calculado con timezone AR. Eso evita
  // que cuando un cliente deja la pestaña abierta cruzando medianoche
  // siga viendo la fecha de ayer como "hoy" (caso reportado).
  const hoy = hoyAr
  const ahora = new Date()
  const ahoraHour = ahora.getHours()

  function navigate(nuevaFecha: string, nuevoDeporte: string) {
    if (nuevaFecha < hoy) return
    router.push(`/${slug}?${new URLSearchParams({ fecha: nuevaFecha, deporte: nuevoDeporte })}`)
    setSelectedSlot(null); setError(null)
  }

  function slotEsPasado(hora: string) {
    if (fecha > hoy) return false
    if (fecha < hoy) return true
    return parseInt(hora.split(":")[0]) <= ahoraHour
  }

  const diaSemana = new Date(fecha + "T12:00:00Z").getUTCDay()
  const canchasFiltradas = canchas.filter(c => deporte === "todos" || c.sport === deporte)

  const todosLosSlots = new Set<string>()
  canchasFiltradas.forEach(c => {
    const sch = c.schedules.find(s => s.dayOfWeek === diaSemana)
    if (sch) generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).forEach(s => todosLosSlots.add(s))
  })
  const slotsUnion = [...todosLosSlots].sort()

  const canchasConSlots = canchasFiltradas
    .filter(c => c.schedules.some(s => s.dayOfWeek === diaSemana))
    .map(c => {
      const sch = c.schedules.find(s => s.dayOfWeek === diaSemana)
      const slotsCancha = sch ? new Set(generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes)) : new Set<string>()
      const slotsOcupados = new Set(reservas.filter(r => r.courtId === c.id).map(r => r.hora))
      return {
        ...c,
        slotMinutes: sch?.slotMinutes ?? 60,
        slots: slotsUnion.map(hora => {
          if (!slotsCancha.has(hora)) return { hora, estado: "cerrado" as const }
          if (slotEsPasado(hora)) return { hora, estado: "pasado" as const }
          if (slotsOcupados.has(hora)) return { hora, estado: "ocupado" as const }
          return { hora, estado: "disponible" as const }
        }),
      }
    })

  function handleSelectSlot(cancha: typeof canchasConSlots[0], hora: string, estado: Estado) {
    if (estado !== "disponible") return
    setSelectedSlot({ courtId: cancha.id, courtName: cancha.name, sport: cancha.sport, hora, slotMinutes: cancha.slotMinutes, precio: cancha.pricePerHour })
    setError(null)
  }

  function handleConfirmar() {
    if (!selectedSlot) return
    if (!isLoggedIn && (!guestName.trim() || !guestPhone.trim())) {
      setError("Ingresá tu nombre y teléfono para continuar."); return
    }
    setError(null)
    const formData = new FormData()
    formData.set("courtId", selectedSlot.courtId)
    formData.set("fecha", fecha); formData.set("hora", selectedSlot.hora)
    formData.set("slug", slug); formData.set("slotMinutes", String(selectedSlot.slotMinutes))
    if (!isLoggedIn) {
      formData.set("guestName", guestName)
      formData.set("guestPhone", guestPhone)
      if (guestEmail.trim()) formData.set("guestEmail", guestEmail.trim())
    }
    startTransition(async () => {
      try { await crearReserva(formData) }
      catch (e) { if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) setError(e.message) }
    })
  }

  const fechaDate = new Date(fecha + "T12:00:00Z")
  const hoyDate = new Date(hoy + "T00:00:00")
  const inputClass = "w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#A3FF12]/40 focus:ring-2 focus:ring-[#A3FF12]/15 transition-colors backdrop-blur-sm"

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Controles fecha + deporte */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(offsetFecha(fecha, -1), deporte)}
            disabled={fecha <= hoy}
            className="p-2 rounded-xl glass-nav hover:bg-white/[0.1] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger className="glass-nav rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-white/[0.1] transition-all text-sm font-medium text-white cursor-pointer">
              <CalendarDays className="w-4 h-4 text-white/40" />
              {capitalizarPrimera(formatFecha(fecha))}
              {fecha === hoy && (
                <span className="text-[10px] font-bold text-[#A3FF12]/70 uppercase tracking-wider">
                  hoy
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom" align="start">
              <Calendar
                mode="single" selected={fechaDate}
                onSelect={date => {
                  if (date) {
                    navigate(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`, deporte)
                    setCalendarOpen(false)
                  }
                }}
                disabled={{ before: hoyDate }} locale={es}
              />
            </PopoverContent>
          </Popover>

          <button
            onClick={() => navigate(offsetFecha(fecha, 1), deporte)}
            className="p-2 rounded-xl glass-nav hover:bg-white/[0.1] transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>

          {fecha > hoy && (
            <button
              onClick={() => navigate(hoy, deporte)}
              className="ml-1 text-xs font-medium text-white/50 hover:text-[#A3FF12] transition-colors underline-offset-4 hover:underline"
            >
              Volver a hoy
            </button>
          )}
        </div>

        {deportesDisponibles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {(["todos", ...deportesDisponibles] as string[]).map(dep => (
              <button
                key={dep}
                onClick={() => navigate(fecha, dep)}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
                  deporte === dep
                    ? "bg-[#A3FF12] text-black border-[#A3FF12] glow-lime"
                    : "glass-nav text-white/60 hover:text-white hover:bg-white/[0.1]"
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
        <div className="glass-card rounded-2xl p-10 text-center">
          <p className="text-white/40 font-medium">No hay canchas con horarios para este día.</p>
          <p className="text-sm text-white/20 mt-1">Probá con otra fecha.</p>
        </div>
      ) : (
        <>
          {/* Leyenda — solo desktop (en mobile el contexto visual ya es claro) */}
          <div className="hidden sm:flex justify-end gap-5 text-xs font-medium text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm slot-available inline-block" />Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm slot-occupied inline-block" />Ocupado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm slot-past inline-block" />Pasado
            </span>
          </div>

          {/* ── Cards por cancha. Misma UX en mobile y desktop: una card por
              cancha con slots agrupados por momento del día. En desktop con
              ≥2 canchas usamos grid 2 columnas para aprovechar el ancho. ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {canchasConSlots.map(cancha => {
              const slotsVisibles = cancha.slots.filter(s => s.estado !== "cerrado")
              const grupos = (["manana", "tarde", "noche"] as const).map(m => ({
                momento: m,
                slots: slotsVisibles.filter(s => momentoDelDia(s.hora) === m),
              })).filter(g => g.slots.length > 0)

              return (
                <div key={cancha.id} className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Cabecera de la cancha: nombre + deporte + precio destacado */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-base sm:text-lg">{cancha.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/55 border-white/[0.1]">
                      {sportLabel(cancha.sport)}
                    </span>
                    <span className="ml-auto font-display font-black text-[#A3FF12] text-lg sm:text-xl tabular-nums text-glow-lime">
                      ${cancha.pricePerHour.toLocaleString("es-AR")}
                      <span className="text-white/35 font-sans font-medium text-xs ml-1">/h</span>
                    </span>
                  </div>

                  <div className="space-y-3">
                    {grupos.map(({ momento, slots }) => (
                      <div key={momento}>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">
                          {MOMENTO_LABEL[momento]}
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {slots.map(({ hora, estado }) => {
                            const isSel = selectedSlot?.courtId === cancha.id && selectedSlot?.hora === hora
                            return (
                              <button
                                key={hora}
                                disabled={estado !== "disponible"}
                                onClick={() => handleSelectSlot(cancha, hora, estado)}
                                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  isSel ? "slot-selected" :
                                  estado === "disponible" ? "slot-available" :
                                  estado === "ocupado" ? "slot-occupied" : "slot-past"
                                }`}
                              >
                                {hora}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Panel de confirmación */}
      {selectedSlot && (
        <div
          ref={panelRef}
          className="glass-card border-dual-gradient animate-confirmation-glow rounded-2xl p-6 space-y-5"
          style={{ boxShadow: "0 0 60px rgba(163,255,18,0.08), 0 24px 64px rgba(0,0,0,0.5)" }}
        >
          <h3 className="font-display text-2xl font-black uppercase text-white tracking-tight leading-none">
            Tu reserva
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-white">{selectedSlot.courtName}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/55 border-white/[0.1]">
              {sportLabel(selectedSlot.sport)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm text-white/55">
              <CalendarDays className="w-4 h-4 shrink-0 text-white/25" />
              <span className="font-medium">{capitalizarPrimera(formatFecha(fecha))}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-white/55">
              <Clock className="w-4 h-4 shrink-0 text-white/25" />
              <span className="font-medium">
                {selectedSlot.hora} — {calcHoraFin(selectedSlot.hora, selectedSlot.slotMinutes)} hs
              </span>
              <span className="text-xs text-white/25">({selectedSlot.slotMinutes} min)</span>
            </div>
          </div>

          <div className="separator-lime" />

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-white/35">Total a pagar</span>
              <span
                className="font-display font-black text-[#A3FF12] text-glow-lime"
                style={{ fontSize: "clamp(2rem,5vw,2.8rem)" }}
              >
                ${selectedSlot.precio.toLocaleString("es-AR")}
              </span>
            </div>
            <p className="text-xs text-white/30 text-right mt-1">
              Pago en el complejo · {selectedSlot.slotMinutes} min
            </p>
          </div>

          {!isLoggedIn && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="Tu nombre completo"
                  autoComplete="name"
                  className={inputClass}
                />
                <input
                  value={guestPhone}
                  onChange={e => setGuestPhone(formatPhoneArg(e.target.value))}
                  placeholder="11 1234-5678"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputClass}
                />
              </div>
              <div>
                <input
                  value={guestEmail}
                  onChange={e => setGuestEmail(e.target.value)}
                  placeholder="tu@email.com (opcional)"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputClass}
                />
                <p className="text-[11px] text-white/30 mt-1.5 px-1">
                  Para mandarte la confirmación por mail.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-1">
            <button
              onClick={() => { setSelectedSlot(null); setError(null) }}
              disabled={isPending}
              className="text-sm font-medium text-white/45 hover:text-white/85 transition-colors disabled:opacity-40 underline-offset-4 hover:underline"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={isPending}
              className="btn-lime-glow flex-1 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black rounded-xl py-3.5 px-6 text-sm font-bold disabled:opacity-50"
            >
              {isPending ? "Confirmando…" : "Confirmar reserva"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
