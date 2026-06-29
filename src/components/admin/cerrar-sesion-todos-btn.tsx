"use client"

import { useState, useTransition } from "react"
import { ShieldAlert, LogOut, AlertCircle } from "lucide-react"
import { cerrarSesionEnTodosLados } from "@/actions/auth"

/**
 * Botón "Cerrar sesión en todos los dispositivos". Es una acción agresiva
 * (te desloguea hasta del dispositivo donde la apretás), así que va con
 * confirmación inline para evitar clicks accidentales.
 *
 * Pensado para emergencias: te robaron el celu, sospechás que alguien tiene
 * la cookie, te phishean, etc.
 */
export function CerrarSesionTodosBtn() {
  const [confirmando, setConfirmando] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleConfirmar() {
    startTransition(() => {
      cerrarSesionEnTodosLados()
    })
  }

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 border border-red-500/20">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">
            Cerrar sesión en todos los dispositivos
          </p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
            Te desloguea acá y en cualquier otro celu, tablet o compu donde hayas iniciado sesión. Usalo si perdiste un dispositivo o sospechás que alguien tiene acceso.
          </p>
        </div>
      </div>

      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-red-500/10 text-white/75 hover:text-red-400 border border-white/[0.1] hover:border-red-500/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión en todos lados
        </button>
      ) : (
        <div className="space-y-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Vas a tener que volver a loguearte en todos los dispositivos. ¿Seguro?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {pending ? "Cerrando…" : "Sí, cerrar todo"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={pending}
              className="text-xs font-medium px-3 py-2 rounded-lg glass-nav text-white/65 hover:text-white transition-colors disabled:opacity-50"
            >
              No, cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
