"use client"

import { useState, useTransition, useMemo } from "react"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertCircle,
  CalendarDays,
  Phone,
  User,
  Mail,
  Clock,
  Info,
} from "lucide-react"
import { crearReservaManual } from "@/actions/reservas"
import { sportLabel } from "@/lib/sports"
import { generarSlots } from "@/lib/slots"

interface Schedule {
  dayOfWeek: number
  openTime: string
  closeTime: string
  slotMinutes: number
}

interface Cancha {
  id: string
  name: string
  sport: string
  pricePerHour: number
  schedules: Schedule[]
}

interface OcupacionItem {
  courtId: string
  fecha: string  // YYYY-MM-DD
  hora: string   // HH:00
}

interface Props {
  slug: string
  canchas: Cancha[]
  fechaInicial: string
  ocupacion: OcupacionItem[]
}

function formatPhoneArg(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 13)
  if (digits.length === 0) return ""
  if (digits.length <= 4) return digits
  if (digits.length <= 8) return `${digits.slice(0, -4)}-${digits.slice(-4)}`
  const last8 = digits.slice(-8)
  const area = digits.slice(0, -8)
  return `${area} ${last8.slice(0, 4)}-${last8.slice(4)}`
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function dateFromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

const DIAS_CORTOS  = ["dom","lun","mar","mié","jue","vie","sáb"]
const DIAS_LARGOS  = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

function formatFechaDisplay(d: Date): string {
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
}
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors"

export function NuevaReservaForm({ slug, canchas, fechaInicial, ocupacion }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [courtId, setCourtId] = useState("")
  const [fechaDate, setFechaDate] = useState<Date>(dateFromIso(fechaInicial))
  const [hora, setHora] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const canchaSeleccionada = canchas.find(c => c.id === courtId) ?? null

  // Días de la semana en los que la cancha abre (0=domingo … 6=sábado)
  const diasAbiertos = useMemo(() => {
    if (!canchaSeleccionada) return null
    return new Set(canchaSeleccionada.schedules.map(s => s.dayOfWeek))
  }, [canchaSeleccionada])

  const scheduleDelDia = useMemo(() => {
    if (!canchaSeleccionada) return null
    return canchaSeleccionada.schedules.find(s => s.dayOfWeek === fechaDate.getDay()) ?? null
  }, [canchaSeleccionada, fechaDate])

  // Slots válidos según el schedule del día. Si la fecha es hoy, filtra
  // los horarios que ya pasaron.
  const horasDisponibles = useMemo(() => {
    if (!scheduleDelDia) return []
    const slots = generarSlots(scheduleDelDia.openTime, scheduleDelDia.closeTime, scheduleDelDia.slotMinutes)

    const esHoy = isoFromDate(fechaDate) === isoFromDate(today)
    if (!esHoy) return slots

    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minActual  = ahora.getMinutes()
    return slots.filter(s => {
      const [h, m] = s.split(":").map(Number)
      return h > horaActual || (h === horaActual && m > minActual)
    })
  }, [scheduleDelDia, fechaDate, today])

  // Mapa de horarios ocupados: { courtId|fecha => Set<hora> }
  const ocupacionMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    ocupacion.forEach(({ courtId, fecha, hora }) => {
      const key = `${courtId}|${fecha}`
      if (!map.has(key)) map.set(key, new Set())
      map.get(key)!.add(hora)
    })
    return map
  }, [ocupacion])

  // Horarios ocupados para la cancha + fecha actualmente seleccionada
  const horasOcupadas = useMemo(() => {
    if (!courtId) return new Set<string>()
    const key = `${courtId}|${isoFromDate(fechaDate)}`
    return ocupacionMap.get(key) ?? new Set<string>()
  }, [courtId, fechaDate, ocupacionMap])

  // Si la hora seleccionada deja de ser válida (cambió cancha/fecha, o quedó ocupada), reseteala
  if (hora && (!horasDisponibles.includes(hora) || horasOcupadas.has(hora))) {
    setHora("")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!courtId) { setError("Elegí una cancha"); return }
    if (!scheduleDelDia) {
      setError(`Esta cancha no abre el ${DIAS_LARGOS[fechaDate.getDay()]}`)
      return
    }
    if (!hora) { setError("Elegí un horario"); return }

    const formData = new FormData(e.currentTarget)
    formData.set("slug", slug)
    formData.set("courtId", courtId)
    formData.set("fecha", isoFromDate(fechaDate))
    formData.set("hora", hora)
    formData.set("guestPhone", guestPhone)

    startTransition(async () => {
      try {
        await crearReservaManual(formData)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">

      {/* Cancha */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65">Cancha</label>
        <Select value={courtId} onValueChange={(v) => setCourtId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegí una cancha…">
              {courtId
                ? canchaSeleccionada
                  ? `${canchaSeleccionada.name} · ${sportLabel(canchaSeleccionada.sport)}`
                  : "Elegí una cancha…"
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {canchas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} · {sportLabel(c.sport)} · ${c.pricePerHour.toLocaleString("es-AR")}/h
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fecha + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-white/40" />
            Fecha
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              type="button"
              className={`${inputBase} text-left flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.08]`}
            >
              <span className="truncate">{capitalizar(formatFechaDisplay(fechaDate))}</span>
              <CalendarDays className="w-4 h-4 text-white/40 shrink-0" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="bottom" align="start">
              <Calendar
                mode="single"
                selected={fechaDate}
                onSelect={(date) => {
                  if (date) {
                    setFechaDate(date)
                    setCalendarOpen(false)
                  }
                }}
                disabled={(date) => {
                  if (date < today) return true
                  if (diasAbiertos && !diasAbiertos.has(date.getDay())) return true
                  return false
                }}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/40" />
            Hora
          </label>
          <Select value={hora} onValueChange={(v) => setHora(v ?? "")} disabled={horasDisponibles.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                !canchaSeleccionada ? "Elegí cancha…" :
                !scheduleDelDia ? "Cerrado" :
                horasDisponibles.length === 0 ? "Sin horarios" :
                "Hora…"
              } />
            </SelectTrigger>
            <SelectContent>
              {horasDisponibles.map((h) => {
                const ocupada = horasOcupadas.has(h)
                return (
                  <SelectItem key={h} value={h} disabled={ocupada}>
                    <span className="flex items-center gap-2">
                      {h}
                      {ocupada && <span className="text-white/35 text-xs">— ocupado</span>}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hint cuando la cancha está cerrada el día elegido */}
      {canchaSeleccionada && !scheduleDelDia && (
        <div className="flex items-center gap-2 text-xs text-white/40 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {canchaSeleccionada.name} no abre los {DIAS_LARGOS[fechaDate.getDay()]}.
            Probá otra fecha.
          </span>
        </div>
      )}

      <div className="border-t border-white/[0.07] pt-5 space-y-5">
        <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Datos del cliente</p>

        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-white/40" />
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            name="guestName"
            type="text"
            placeholder="Juan Pérez"
            required
            autoComplete="off"
            className={inputBase}
          />
        </div>

        {/* Teléfono + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-white/40" />
              Teléfono
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="11 1234-5678"
              value={guestPhone}
              onChange={(e) => setGuestPhone(formatPhoneArg(e.target.value))}
              className={inputBase}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-white/40" />
              Email
            </label>
            <input
              name="guestEmail"
              type="email"
              placeholder="opcional"
              autoComplete="off"
              className={inputBase}
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <p className="text-xs text-white/30 leading-relaxed">
        La reserva se crea como <span className="text-[#A3FF12]/80 font-semibold">confirmada</span> directamente.
        Si después necesitás cancelarla, podés hacerlo desde el listado.
      </p>

      <Button
        type="submit"
        disabled={pending}
        className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold h-11"
      >
        {pending ? "Creando reserva…" : "Crear reserva"}
      </Button>
    </form>
  )
}
