import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#0C0E14] overflow-hidden px-6 py-12">
      <div className="bg-court-lines absolute inset-0 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#0C0E14] to-transparent pointer-events-none" />
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </main>
  )
}
