"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const clubName = formData.get("clubName") as string
    const whatsapp = formData.get("whatsapp") as string

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, clubName, whatsapp }),
    })

    if (!res.ok) {
      setLoading(false)
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Ocurrió un error al registrarte.")
      return
    }

    // El registro ya deja la sesión iniciada: /dashboard muestra el estado
    // "en revisión" hasta que aprobemos el complejo.
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <Link href="/" aria-label="Ir al inicio">
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={240}
            height={72}
            className="h-14 w-auto"
            priority
          />
        </Link>
        <p className="text-white/40 text-sm mt-3">Sumá tu complejo a Pointix</p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="clubName" className="text-white/60 text-sm font-medium">
              Nombre del complejo
            </Label>
            <Input
              id="clubName"
              name="clubName"
              type="text"
              autoComplete="organization"
              placeholder="Complejo Los Álamos"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="text-white/60 text-sm font-medium">
              WhatsApp del complejo
            </Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              placeholder="351 555-1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/60 text-sm font-medium">
              Tu nombre
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Juan García"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60 text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="juan@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/60 text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="btn-lime-glow w-full h-11 bg-[#A3FF12] hover:bg-[#d4ff1a] active:scale-[0.98] text-black font-bold text-sm"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Sumar mi complejo"}
          </Button>
          <p className="text-center text-xs text-white/30">
            Revisamos cada alta a mano y te avisamos por mail. Después tenés 30 días de prueba gratis.
          </p>
        </form>

        <p className="text-center text-sm text-white/30 pt-1">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#A3FF12] hover:underline font-medium">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
