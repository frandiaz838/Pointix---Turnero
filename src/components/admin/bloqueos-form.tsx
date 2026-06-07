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
import { crearBloqueo } from "@/actions/bloqueos"

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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

    startTransition(async () => {
      try {
        await crearBloqueo(formData)
        // Reset y feedback
        const fechaStr = capitalizar(formatFechaDisplay(fechaDate))
        const detalle  = todoElDia ? "todo el día" : `${desde} a ${hasta}`
        setSuccess(`Bloqueo creado: ${fechaStr}, ${detalle}`)
        setReason("")
        setTodoElDia(false)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message)
        }
      }
    })
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

      {success && (
        <div role="status" className="flex items-center gap-2 bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold"
      >
        {pending ? "Bloqueando…" : "Bloquear horario"}
      </Button>
    </form>
  )
}
