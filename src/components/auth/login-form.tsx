"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [error, setError] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError("")

    const formData = new FormData(e.currentTarget)

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    })

    if (res.ok) {
      router.push("/dashboard")
      router.refresh()
    } else {
      let errorMessage = "Error al iniciar sesión."
      try {
        const data = await res.json()
        errorMessage = data.error ?? errorMessage
      } catch {}
      setError(errorMessage)
      setIsPending(false)
    }
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
        <p className="text-white/40 text-sm mt-3">Ingresá a tu cuenta</p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/60 text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@complejo.com"
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
                autoComplete="current-password"
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
            disabled={isPending}
          >
            {isPending ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>

        <p className="text-center text-sm text-white/30 pt-1">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-[#A3FF12] hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
