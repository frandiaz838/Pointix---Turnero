"use client"

import { useTransition } from "react"
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
  const esEdicion = !!cancha

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (esEdicion) {
        await editarCancha(cancha.id, tenantId, slug, formData)
      } else {
        await crearCancha(tenantId, slug, formData)
      }
    })
  }

  return (
    <form action={handleSubmit} className="bg-[#14171F] border border-white/[0.07] rounded-xl p-6 space-y-5">
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear cancha"}
      </Button>
    </form>
  )
}
