"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { confirmarReserva } from "@/actions/reservas"

export function ConfirmarReservaBtn({ bookingId, label = "Confirmar", destacado = false }: {
  bookingId: string
  label?: string
  /** Botón lima: para cuando confirmar es la acción esperada (ej. transferencia recibida). */
  destacado?: boolean
}) {
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
      className={
        destacado
          ? "inline-flex items-center justify-center bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          : buttonVariants({ variant: "outline", size: "sm" })
      }
    >
      {pending ? "Confirmando..." : label}
    </button>
  )
}
