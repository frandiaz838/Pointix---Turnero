"use client"

import { useTransition } from "react"
import { buttonVariants } from "@/components/ui/button"
import { confirmarReserva } from "@/actions/reservas"

export function ConfirmarReservaBtn({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => confirmarReserva(bookingId))
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      {pending ? "Confirmando..." : "Confirmar"}
    </button>
  )
}
