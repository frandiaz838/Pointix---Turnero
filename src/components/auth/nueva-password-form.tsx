"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { restablecerPassword } from "@/actions/password-reset"

export function NuevaPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [mostrar, setMostrar] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get("password") ?? "")
    const confirmar = String(fd.get("confirmar") ?? "")
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.")
      return
    }
    startTransition(async () => {
      const r = await restablecerPassword(token, password)
      if (r.ok) router.push("/login?reset=ok")
      else setError(r.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/60 text-sm font-medium">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={mostrar ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            required
            className="h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-white/45 hover:text-white/75 transition-colors"
            aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-white/50">Mínimo 8 caracteres.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmar" className="text-white/60 text-sm font-medium">Repetila</Label>
        <Input id="confirmar" name="confirmar" type={mostrar ? "text" : "password"} autoComplete="new-password" minLength={8} required className="h-11" />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {error}{" "}
            {error.includes("Pedí uno nuevo") && (
              <Link href="/recuperar" className="underline font-semibold">Pedir link</Link>
            )}
          </span>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="btn-lime-glow w-full h-11 bg-[#A3FF12] hover:bg-[#d4ff1a] active:scale-[0.98] text-black font-bold text-sm"
      >
        {pending ? "Guardando..." : "Guardar contraseña"}
      </Button>
      <p className="text-xs text-white/45 text-center">Al guardarla se cierra tu sesión en todos los dispositivos.</p>
    </form>
  )
}
