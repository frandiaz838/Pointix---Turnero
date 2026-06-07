import { redirect } from "next/navigation"
import { auth } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cerrarSesion } from "@/actions/auth"

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === "ADMIN" && session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    })
    if (tenant) redirect(`/dashboard/${tenant.slug}`)
  }

  return (
    <main className="min-h-screen bg-toxic-gradient p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <form action={cerrarSesion}>
            <button type="submit" className="text-sm text-white/40 hover:text-white transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="glass-card rounded-xl p-6 space-y-2">
          <p className="text-white/70"><span className="font-medium text-white">Nombre:</span> {session?.user?.name ?? "—"}</p>
          <p className="text-white/70"><span className="font-medium text-white">Email:</span> {session?.user?.email}</p>
          <p className="text-white/70"><span className="font-medium text-white">Rol:</span> {session?.user?.role}</p>
        </div>
      </div>
    </main>
  )
}
