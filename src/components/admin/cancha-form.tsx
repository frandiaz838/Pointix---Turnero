"use client"

import { useState, useTransition } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Racquet } from "@phosphor-icons/react"
import { crearCancha, editarCancha } from "@/actions/canchas"
import { Sport } from "@/generated/prisma/client"
import { SPORT_OPTIONS, getSport } from "@/lib/sports"

interface Cancha {
  id: string
  name: string
  sport: Sport
  pricePerHour: number
}

interface Props {
  tenantId: string
  slug: string
  cancha?: Cancha
}

export function CanchaForm({ tenantId, slug, cancha }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const esEdicion = !!cancha

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (esEdicion) {
          await editarCancha(cancha.id, tenantId, slug, formData)
        } else {
          await crearCancha(tenantId, slug, formData)
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes("NEXT_REDIRECT")) {
          setError(err.message)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre de la cancha</Label>
        <Input
          id="name"
          name="name"
          placeholder="Cancha 1 - Pádel"
          defaultValue={cancha?.name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sport">Deporte</Label>
        <Select name="sport" defaultValue={cancha?.sport ?? "PADEL"}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná un deporte" />
          </SelectTrigger>
          <SelectContent>
            {SPORT_OPTIONS.map((value) => {
              const info = getSport(value)
              return (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    {info.emoji === null
                      ? <Racquet size={16} className={info.iconColor} />
                      : <span className="text-base leading-none">{info.emoji}</span>
                    }
                    {info.label}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePerHour">Precio por hora ($)</Label>
        <Input
          id="pricePerHour"
          name="pricePerHour"
          type="number"
          min="0"
          step="100"
          placeholder="3500"
          defaultValue={cancha?.pricePerHour}
          required
        />
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold" disabled={pending}>
        {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear cancha"}
      </Button>
    </form>
  )
}
