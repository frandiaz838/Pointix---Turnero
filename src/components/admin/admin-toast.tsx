"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, X } from "lucide-react"

interface Props {
  /** Nombre del searchParam a observar. Ej: "creada", "actualizada", "eliminada". */
  param: string
  /** Mensaje a mostrar cuando el param está presente. */
  mensaje: string
}

// Toast genérico para feedback de acciones del admin.
// Aparece cuando llega el searchParam configurado, se auto-dismissa en ~3.5s
// y limpia el param de la URL para que no reaparezca en navegación posterior.
export function AdminToast({ param, mensaje }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const flag = searchParams.get(param)

  const [show, setShow] = useState(false)
  const [exit, setExit] = useState(false)

  function clearFlag() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(param)
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : "?", { scroll: false })
  }

  function dismissNow() {
    setExit(true)
    setTimeout(() => {
      setShow(false)
      clearFlag()
    }, 350)
  }

  useEffect(() => {
    if (!flag) return
    setShow(true)
    setExit(false)

    const exitT = setTimeout(() => setExit(true), 3200)
    const hideT = setTimeout(() => {
      setShow(false)
      clearFlag()
    }, 3600)

    return () => {
      clearTimeout(exitT)
      clearTimeout(hideT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag])

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-6 sm:bottom-auto sm:top-24 sm:right-6 sm:left-auto sm:max-w-xs z-50 glass-card flex items-center gap-2.5 text-[#A3FF12] rounded-xl px-4 py-2.5 text-sm font-semibold glow-lime"
      style={{
        animation: exit ? "toastOut 0.35s ease forwards" : "toastIn 0.35s ease both",
      }}
    >
      <CheckCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1">{mensaje}</span>
      <button
        type="button"
        onClick={dismissNow}
        aria-label="Cerrar"
        className="text-white/35 hover:text-white/80 transition-colors -mr-1 p-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
