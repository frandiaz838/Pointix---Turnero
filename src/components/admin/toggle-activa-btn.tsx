"use client"

import { useState, useTransition } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { toggleCanchaActiva, contarReservasFuturasCancha } from "@/actions/canchas"

interface Props {
  courtId: string
  isActive: boolean
  tenantId: string
  slug: string
}

export function ToggleActivaBtn({ courtId, isActive, tenantId, slug }: Props) {
  const [open, setOpen] = useState(false)
  const [reservasFuturas, setReservasFuturas] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  async function handleClick() {
    // Si está reactivando una cancha, no requiere confirmación
    if (!isActive) {
      startTransition(() => toggleCanchaActiva(courtId, isActive, tenantId, slug))
      return
    }
    // Si está desactivando, primero consultamos cuántas reservas futuras hay
    const count = await contarReservasFuturasCancha(courtId, tenantId)
    setReservasFuturas(count)
    setOpen(true)
  }

  function handleConfirm() {
    startTransition(async () => {
      await toggleCanchaActiva(courtId, isActive, tenantId, slug)
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        variant={isActive ? "destructive" : "outline"}
        size="sm"
        onClick={handleClick}
        disabled={pending}
      >
        {pending && !open ? "..." : isActive ? "Desactivar" : "Activar"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="!bg-[#14171F]/95 backdrop-blur-xl !ring-white/[0.08] sm:max-w-md !p-6"
        >
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-9 h-9 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <DialogTitle className="text-white font-display font-black uppercase tracking-tight text-base">
                ¿Desactivar esta cancha?
              </DialogTitle>
              <DialogDescription className="text-white/55 text-sm leading-relaxed">
                {reservasFuturas === null
                  ? "Cargando…"
                  : reservasFuturas === 0
                  ? "La cancha no tiene reservas futuras. Nadie va a poder reservarla mientras esté desactivada."
                  : (
                    <>
                      Tiene <span className="text-yellow-400 font-semibold">{reservasFuturas} {reservasFuturas === 1 ? "reserva futura" : "reservas futuras"}</span> que NO se van a cancelar — los clientes con esas reservas las mantienen.
                      <br />
                      <span className="text-white/40">A partir de ahora, nadie nuevo va a poder reservar esta cancha.</span>
                    </>
                  )}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <DialogClose
              render={
                <Button variant="outline" size="sm" disabled={pending}>
                  Volver
                </Button>
              }
            />
            <Button
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={handleConfirm}
            >
              {pending ? "Desactivando…" : "Sí, desactivar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
