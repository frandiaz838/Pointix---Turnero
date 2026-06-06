"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Phone, User, Mail } from "lucide-react"
import { crearReservaManual } from "@/actions/reservas"
import { sportLabel } from "@/lib/sports"

interface Cancha {
  id: string
  name: string
  sport: string
  pricePerHour: number
}

interface Props {
  slug: string
  canchas: Cancha[]
  fechaInicial: string
}

// Formato de teléfono argentino — agrupa últimos 8 dígitos como ####-####
function formatPhoneArg(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 13)
  if (digits.length === 0) return ""
  if (digits.length <= 4) return digits
  if (digits.length <= 8) return `${digits.slice(0, -4)}-${digits.slice(-4)}`
  const last8 = digits.slice(-8)
  const area = digits.slice(0, -8)
  return `${area} ${last8.slice(0, 4)}-${last8.slice(4)}`
}

const HORAS = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`)

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors [color-scheme:dark]"

export function NuevaReservaForm({ slug, canchas, fechaInicial }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [guestPhone, setGuestPhone] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("slug", slug)
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
        <select name="courtId" required defaultValue="" className={inputBase}>
          <option value="" disabled>Elegí una cancha…</option>
          {canchas.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} · {sportLabel(c.sport)} · ${c.pricePerHour.toLocaleString("es-AR")}/h
            </option>
          ))}
        </select>
      </div>

      {/* Fecha + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/65">Fecha</label>
          <input
            type="date"
            name="fecha"
            required
            defaultValue={fechaInicial}
            className={inputBase}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/65">Hora</label>
          <select name="hora" required defaultValue="" className={inputBase}>
            <option value="" disabled>Hora…</option>
            {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

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
              name="guestPhone"
              type="tel"
              inputMode="tel"
              placeholder="11 1234-5678"
              value={guestPhone}
              onChange={e => setGuestPhone(formatPhoneArg(e.target.value))}
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
