"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Undo2 } from "lucide-react"
import { revertirConfirmacion } from "@/actions/reservas"

// Toast con acción "Deshacer" que aparece cuando ?recienConfirmada=<id> llega
// en la URL (después de un confirmarReserva exitoso). Tiene 6 segundos para
// que el admin clickee deshacer antes que se auto-dismisse.
export function UndoConfirmacionToast() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("recienConfirmada")

  const [show, setShow] = useState(false)
  const [exit, setExit] = useState(false)
  const [pending, startTransition] = useTransition()

  function clearParam() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("recienConfirmada")
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  function dismiss() {
    setExit(true)
    setTimeout(() => {
      setShow(false)
      clearParam()
    }, 350)
  }

  function handleUndo() {
    if (!bookingId) return
    startTransition(async () => {
      await revertirConfirmacion(bookingId)
      setExit(true)
      setTimeout(() => {
        setShow(false)
        clearParam()
      }, 350)
    })
  }

  useEffect(() => {
    if (!bookingId) return
    setShow(true)
    setExit(false)

    const exitT = setTimeout(() => setExit(true), 5600)
    const hideT = setTimeout(() => {
      setShow(false)
      clearParam()
    }, 6000)

    return () => {
      clearTimeout(exitT)
      clearTimeout(hideT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 sm:bottom-auto sm:top-24 sm:right-6 sm:left-auto sm:max-w-sm z-50 glass-card flex items-center gap-3 text-[#A3FF12] rounded-xl px-4 py-2.5 text-sm font-semibold glow-lime"
      style={{
        animation: exit ? "toastOut 0.35s ease forwards" : "toastIn 0.35s ease both",
      }}
    >
      <CheckCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1">Reserva confirmada</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={pending}
        className="flex items-center gap-1 text-xs font-bold text-white/80 hover:text-white px-2 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.15] transition-colors disabled:opacity-50"
      >
        <Undo2 className="w-3 h-3" />
        {pending ? "..." : "Deshacer"}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="text-white/35 hover:text-white/80 transition-colors -mr-1 p-1"
      >
        ✕
      </button>
    </div>
  )
}
