"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { confirmarReserva } from "@/actions/reservas"

export function ConfirmarReservaBtn({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await confirmarReserva(bookingId)
      // Disparar el undo toast con el id de la reserva recién confirmada
      const params = new URLSearchParams(searchParams.toString())
      params.set("recienConfirmada", bookingId)
      router.replace(`?${params.toString()}`, { scroll: false })
    })
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
