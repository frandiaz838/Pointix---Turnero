import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { NuevaPasswordForm } from "@/components/auth/nueva-password-form"
import { tokenResetValido } from "@/actions/password-reset"

export const metadata: Metadata = { title: "Nueva contraseña · Pointix" }
export const dynamic = "force-dynamic"

export default async function NuevaPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const valido = await tokenResetValido(token)

  return (
    <AuthShell subtitulo="Elegí tu nueva contraseña">
      {valido ? (
        <NuevaPasswordForm token={token} />
      ) : (
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-base text-white font-semibold">El link venció o ya se usó</p>
          <p className="text-sm text-white/65">Los links duran 30 minutos y sirven una sola vez. Pedí uno nuevo.</p>
          <Link
            href="/recuperar"
            className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-5 py-3 rounded-xl"
          >
            Pedir un link nuevo
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
