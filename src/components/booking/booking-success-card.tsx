"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, X, MessageCircle, Calendar, Clock, MapPin } from "lucide-react"

interface Props {
  clubNombre: string
  canchaName: string
  sport: string
  fechaTexto: string
  horaInicio: string
  horaFin: string
  precio: number
  paidOnline: boolean
  estadoConfirmado: boolean
  whatsappUrl: string | null
}

export function BookingSuccessCard({
  clubNombre,
  canchaName,
  sport,
  fechaTexto,
  horaInicio,
  horaFin,
  precio,
  paidOnline,
  estadoConfirmado,
  whatsappUrl,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [closing, setClosing] = useState(false)

  function dismiss() {
    setClosing(true)
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("reservado")
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : "?", { scroll: false })
    }, 250)
  }

  return (
    <div className="relative z-40 px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        role="status"
        aria-live="polite"
        className="mx-auto max-w-md glass-card rounded-2xl p-5 sm:p-6 relative"
        style={{
          animation: closing ? "toastOut 0.25s ease forwards" : "toastIn 0.4s ease both",
          boxShadow: "0 0 32px rgba(163,255,18,0.15), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-white/35 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#A3FF12]/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#A3FF12]" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              {estadoConfirmado ? "Reserva confirmada" : "Pago en proceso"}
            </h2>
            <p className="text-xs text-white/45 mt-1">
              {estadoConfirmado
                ? "Te esperamos en el complejo"
                : "Acreditando el pago, puede tardar unos segundos…"}
            </p>
          </div>
        </div>

        <div className="separator-subtle my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2.5 text-white/75">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-white/35" />
            <span className="truncate">
              <span className="font-semibold text-white">{canchaName}</span>
              <span className="text-white/40"> · {sport}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-white/75">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-white/35" />
            <span className="capitalize">{fechaTexto}</span>
          </div>
          <div className="flex items-center gap-2.5 text-white/75">
            <Clock className="w-3.5 h-3.5 shrink-0 text-white/35" />
            <span>{horaInicio} a {horaFin} hs</span>
          </div>
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.06]">
            <span className="text-xs text-white/40 uppercase tracking-wider">Total</span>
            <span className="font-display font-black text-[#A3FF12] text-xl">
              ${precio.toLocaleString("es-AR")}
            </span>
          </div>
          {paidOnline && (
            <div className="text-[10px] text-[#A3FF12]/80 uppercase tracking-wider text-right">
              Pagado online
            </div>
          )}
        </div>

        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Avisar a {clubNombre} por WhatsApp
          </a>
        ) : (
          <p className="mt-5 text-[11px] text-white/35 text-center">
            El complejo recibirá tu reserva en su panel.
          </p>
        )}

        <button
          onClick={dismiss}
          className="mt-2 w-full text-xs text-white/35 hover:text-white/70 py-2 transition-colors"
        >
          Listo, cerrar
        </button>
      </div>
    </div>
  )
}
