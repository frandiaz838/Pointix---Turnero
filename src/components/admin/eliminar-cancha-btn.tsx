"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { eliminarCancha } from "@/actions/canchas"

interface Props {
  courtId: string
  tenantId: string
  slug: string
  canchaName: string
}

export function EliminarCanchaBtn({ courtId, tenantId, slug, canchaName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const matches = confirmText.trim() === canchaName

  function handleEliminar() {
    if (!matches) return
    setError(null)
    startTransition(async () => {
      try {
        await eliminarCancha(courtId, tenantId, slug, confirmText)
        setOpen(false)
        router.push(`/dashboard/${slug}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar")
      }
    })
  }

  function reset() {
    setConfirmText("")
    setError(null)
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={() => { reset(); setOpen(true) }}
        className="gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar cancha
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent
          showCloseButton={false}
          className="!bg-[#14171F]/95 backdrop-blur-xl !ring-white/[0.08] sm:max-w-md !p-6"
        >
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <DialogTitle className="text-white font-display font-black uppercase tracking-tight text-base">
                Eliminar “{canchaName}”
              </DialogTitle>
              <DialogDescription className="text-white/55 text-sm leading-relaxed">
                Esta acción es <span className="text-red-400 font-semibold">irreversible</span>. Se eliminan también todos los horarios, bloqueos y reservas (pasadas y futuras) de esta cancha.
              </DialogDescription>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <label className="text-xs font-medium text-white/55">
              Para confirmar, tipeá el nombre exacto:{" "}
              <span className="font-bold text-white">{canchaName}</span>
            </label>
            <input
              type="text"
              autoFocus
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={canchaName}
              className="w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-red-500/40 transition-colors"
              disabled={pending}
            />
            {matches && (
              <div className="flex items-center gap-1.5 text-xs text-[#A3FF12]/80">
                <CheckCircle className="w-3.5 h-3.5" />
                Nombre coincide
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <DialogClose render={<Button variant="outline" size="sm" disabled={pending}>Cancelar</Button>} />
            <Button
              variant="destructive"
              size="sm"
              disabled={pending || !matches}
              onClick={handleEliminar}
            >
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
