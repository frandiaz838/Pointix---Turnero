import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#0C0E14] overflow-hidden px-6 py-12">
      {/* Orbs mesh gradient */}
      <div
        className="animate-orb pointer-events-none fixed -left-[20%] -top-[20%] w-[65%] h-[65%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }}
      />
      <div
        className="animate-orb-alt pointer-events-none fixed -right-[15%] -bottom-[15%] w-[55%] h-[55%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(202,255,0,0.05) 0%, transparent 65%)" }}
      />
      <div className="bg-court-lines absolute inset-0 pointer-events-none opacity-30" />
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </main>
  )
}
