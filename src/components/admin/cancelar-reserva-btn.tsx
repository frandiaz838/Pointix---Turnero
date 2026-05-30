"use client"

import { useTransition } from "react"
import { buttonVariants } from "@/components/ui/button"
import { cancelarReserva } from "@/actions/reservas"

export function CancelarReservaBtn({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm("¿Cancelar esta reserva? Esta acción no se puede deshacer.")) return
    startTransition(() => cancelarReserva(bookingId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={buttonVariants({ variant: "destructive", size: "sm" })}
    >
      {pending ? "Cancelando..." : "Cancelar"}
    </button>
  )
}
