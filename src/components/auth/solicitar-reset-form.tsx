"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { solicitarResetPassword } from "@/actions/password-reset"

export function SolicitarResetForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const email = String(new FormData(e.currentTarget).get("email") ?? "")
    startTransition(async () => {
      const r = await solicitarResetPassword(email)
      if (r.ok) setEnviado(true)
      else setError(r.error)
    })
  }

  if (enviado) {
    return (
      <div className="text-center space-y-4">
        <MailCheck className="w-10 h-10 text-[#A3FF12] mx-auto" />
        <p className="text-base text-white font-semibold">Revisá tu mail</p>
        <p className="text-sm text-white/65 leading-relaxed">
          Si el email está registrado, te mandamos un link para elegir una nueva contraseña. Vence en 30 minutos.
          Si no lo ves, fijate en spam.
        </p>
        <Link href="/login" className="inline-block text-sm text-[#A3FF12] font-medium hover:underline">
          Volver a ingresar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-white/65 leading-relaxed">
        Ingresá el email de tu cuenta y te mandamos un link para elegir una contraseña nueva.
      </p>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/60 text-sm font-medium">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="tu@email.com" required className="h-11" />
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="btn-lime-glow w-full h-11 bg-[#A3FF12] hover:bg-[#d4ff1a] active:scale-[0.98] text-black font-bold text-sm"
      >
        {pending ? "Enviando..." : "Mandarme el link"}
      </Button>

      <p className="text-center text-sm text-white/45">
        ¿Te acordaste?{" "}
        <Link href="/login" className="text-[#A3FF12] hover:underline font-medium">Ingresá</Link>
      </p>
    </form>
  )
}
