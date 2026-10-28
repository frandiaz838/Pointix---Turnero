import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

// Fondo y marca de las pantallas de cuenta (recuperar contraseña), igual al
// de /login y /register.
export function AuthShell({ subtitulo, children }: { subtitulo: string; children: ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#0C0E14] overflow-hidden px-4 sm:px-6 py-12">
      <div
        className="animate-orb pointer-events-none fixed -left-[20%] -top-[20%] w-[65%] h-[65%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(163,255,18,0.2) 0%, transparent 70%)" }}
      />
      <div
        className="animate-orb-alt pointer-events-none fixed -right-[15%] -bottom-[15%] w-[55%] h-[55%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.14) 0%, transparent 70%)" }}
      />
      <div className="bg-court-lines absolute inset-0 pointer-events-none opacity-30" />
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" aria-label="Ir al inicio">
            <Image src="/logo-wordmark-white.svg" alt="Pointix" width={240} height={72} className="h-14 w-auto" priority />
          </Link>
          <p className="text-white/55 text-sm mt-3">{subtitulo}</p>
        </div>
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">{children}</div>
      </div>
    </main>
  )
}
