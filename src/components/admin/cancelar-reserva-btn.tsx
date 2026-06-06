"use client"

import { useState, useTransition } from "react"
import { AlertTriangle } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { cancelarReserva } from "@/actions/reservas"

export function CancelarReservaBtn({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await cancelarReserva(bookingId)
      setOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ variant: "destructive", size: "sm" })}
      >
        Cancelar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="!bg-[#14171F]/95 backdrop-blur-xl !ring-white/[0.08] sm:max-w-md !p-6"
        >
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <DialogTitle className="text-white font-display font-black uppercase tracking-tight text-base">
                ¿Cancelar esta reserva?
              </DialogTitle>
              <DialogDescription className="text-white/55 text-sm leading-relaxed">
                El horario va a quedar disponible nuevamente. Esta acción no se puede deshacer.
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
              {pending ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
