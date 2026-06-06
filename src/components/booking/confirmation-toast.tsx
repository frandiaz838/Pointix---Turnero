"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, X } from "lucide-react"

// Toast inline al top de la página: empuja el contenido hacia abajo,
// no tapa nada. Cuando desaparece, el contenido vuelve a su lugar.
// Auto-dismiss a los ~3s o manual con la X.
export function ConfirmationToast() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservado = searchParams.get("reservado")

  const [show, setShow] = useState(false)
  const [exit, setExit] = useState(false)

  function clearReservadoParam() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("reservado")
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  function dismissNow() {
    setExit(true)
    setTimeout(() => {
      setShow(false)
      clearReservadoParam()
    }, 350)
  }

  useEffect(() => {
    if (!reservado) return
    setShow(true)
    setExit(false)

    // Llevar al usuario al top para que vea el toast aparecer arriba
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const exitT = setTimeout(() => setExit(true), 2700)
    const hideT = setTimeout(() => {
      setShow(false)
      clearReservadoParam()
    }, 3100)

    return () => {
      clearTimeout(exitT)
      clearTimeout(hideT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservado])

  if (!show) return null

  return (
    <div className="relative z-30 px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        role="status"
        aria-live="polite"
        className="mx-auto sm:max-w-md glass-card flex items-center gap-2.5 text-[#A3FF12] rounded-xl px-4 py-2.5 text-sm font-semibold glow-lime"
        style={{
          animation: exit ? "toastOut 0.35s ease forwards" : "toastIn 0.35s ease both",
        }}
      >
        <CheckCircle className="w-4 h-4 shrink-0" />
        <span className="flex-1">Reserva confirmada</span>
        <button
          onClick={dismissNow}
          aria-label="Cerrar"
          className="text-white/35 hover:text-white/80 transition-colors -mr-1 p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
