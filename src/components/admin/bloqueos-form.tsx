"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Clock } from "lucide-react"
import { crearBloqueo } from "@/actions/bloqueos"

interface Props {
  slug: string
  courtId: string
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors [color-scheme:dark]"

export function BloqueoForm({ slug, courtId }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [todoElDia, setTodoElDia] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set("slug", slug)
    formData.set("courtId", courtId)
    startTransition(async () => {
      try {
        await crearBloqueo(formData)
        ;(e.target as HTMLFormElement).reset()
        setTodoElDia(false)
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message)
        }
      }
    })
  }

  const hoy = new Date().toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Nuevo bloqueo</p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-white/40" /> Fecha
        </label>
        <input type="date" name="fecha" required defaultValue={hoy} min={hoy} className={inputBase} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          name="dia"
          checked={todoElDia}
          onChange={e => setTodoElDia(e.target.checked)}
          className="w-4 h-4 rounded accent-[#A3FF12] cursor-pointer"
        />
        <span className="text-sm font-medium text-white/75">Todo el día</span>
      </label>

      {!todoElDia && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" /> Desde
            </label>
            <input type="time" name="desde" required={!todoElDia} defaultValue="08:00" className={inputBase} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" /> Hasta
            </label>
            <input type="time" name="hasta" required={!todoElDia} defaultValue="10:00" className={inputBase} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65">Motivo (opcional)</label>
        <input name="reason" type="text" placeholder="Mantenimiento, evento privado…" className={inputBase} />
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
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
