"use client"

import { useState, useTransition, useEffect } from "react"
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
import { AlertCircle, CalendarDays, Clock, CheckCircle } from "lucide-react"
import { crearBloqueo, ERROR_BLOQUEO_CONFLICTO } from "@/actions/bloqueos"

interface Props {
  slug: string
  courtId: string
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const DIAS_CORTOS  = ["dom","lun","mar","mié","jue","vie","sáb"]
const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
function formatFechaDisplay(d: Date): string {
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`
}
function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const HORAS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`)

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors"

export function BloqueoForm({ slug, courtId }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [todoElDia, setTodoElDia] = useState(false)
  // Cuando el server detecta reservas existentes en el rango, devuelve un
  // error parseable y guardamos la cantidad para mostrar el diálogo de
  // confirmación con un botón "Cancelar reservas y bloquear igual".
  const [reservasConflicto, setReservasConflicto] = useState<number | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [fechaDate, setFechaDate] = useState<Date>(today)
  const [desde, setDesde] = useState("08:00")
  const [hasta, setHasta] = useState("10:00")
  const [reason, setReason] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Auto-dismiss del mensaje de éxito a los 4s
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(t)
  }, [success])

  function enviar(forzar: boolean) {
    setError(null)
    setSuccess(null)

    if (!todoElDia && desde >= hasta) {
      setError("La hora 'hasta' tiene que ser posterior a 'desde'")
      return
    }

    const formData = new FormData()
    formData.set("slug", slug)
    formData.set("courtId", courtId)
    formData.set("fecha", isoFromDate(fechaDate))
    formData.set("reason", reason)
    if (todoElDia) {
      formData.set("dia", "on")
    } else {
      formData.set("desde", desde)
      formData.set("hasta", hasta)
    }
    if (forzar) formData.set("forzar", "on")

    startTransition(async () => {
      try {
        await crearBloqueo(formData)
        // Reset y feedback
        const fechaStr = capitalizar(formatFechaDisplay(fechaDate))
        const detalle  = todoElDia ? "todo el día" : `${desde} a ${hasta}`
        const extra = forzar && reservasConflicto ? ` (${reservasConflicto} ${reservasConflicto === 1 ? "reserva cancelada" : "reservas canceladas"})` : ""
        setSuccess(`Bloqueo creado: ${fechaStr}, ${detalle}${extra}`)
        setReason("")
        setTodoElDia(false)
        setReservasConflicto(null)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          // El server nos avisa de reservas en conflicto con un mensaje
          // estructurado "BLOQUEO_TIENE_RESERVAS:N" — lo parseamos para
          // mostrar el diálogo de confirmación en vez de un error plano.
          if (err.message.startsWith(`${ERROR_BLOQUEO_CONFLICTO}:`)) {
            const n = Number(err.message.split(":")[1]) || 0
            setReservasConflicto(n)
          } else {
            setError(err.message)
          }
        }
      }
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    enviar(false)
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Nuevo bloqueo</p>

      {/* Fecha — Popover + Calendar */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-white/40" /> Fecha
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
              disabled={{ before: today }}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Toggle "Todo el día" */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={todoElDia}
          onChange={(e) => setTodoElDia(e.target.checked)}
          className="w-4 h-4 rounded accent-[#A3FF12] cursor-pointer"
        />
        <span className="text-sm font-medium text-white/75">Todo el día</span>
      </label>

      {/* Hora desde / hasta — solo si no es todo el día */}
      {!todoElDia && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" /> Desde
            </label>
            <Select value={desde} onValueChange={(v) => setDesde(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" /> Hasta
            </label>
            <Select value={hasta} onValueChange={(v) => setHasta(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HORAS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Motivo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65">Motivo (opcional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Mantenimiento, evento privado…"
          className={inputBase}
        />
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {reservasConflicto !== null && (
        <div role="alert" className="space-y-2.5 bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-sm rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {reservasConflicto === 1
                ? <>Hay <b>1 reserva</b> en ese horario. Si bloqueás igual, la reserva se cancela y vas a tener que avisarle al cliente.</>
                : <>Hay <b>{reservasConflicto} reservas</b> en ese horario. Si bloqueás igual, se cancelan todas y vas a tener que avisarles a los clientes.</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              onClick={() => enviar(true)}
              disabled={pending}
              className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold"
            >
              {pending ? "Cancelando…" : `Cancelar ${reservasConflicto === 1 ? "reserva" : "reservas"} y bloquear igual`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReservasConflicto(null)}
              className="text-xs"
            >
              No, dejar las reservas
            </Button>
          </div>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || reservasConflicto !== null}
        className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold"
      >
        {pending ? "Bloqueando…" : "Bloquear horario"}
      </Button>
    </form>
  )
}
