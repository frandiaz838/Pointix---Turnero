import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { SolicitarResetForm } from "@/components/auth/solicitar-reset-form"

export const metadata: Metadata = { title: "Recuperar contraseña · Pointix" }

export default function RecuperarPage() {
  return (
    <AuthShell subtitulo="Recuperá tu contraseña">
      <SolicitarResetForm />
    </AuthShell>
  )
}
