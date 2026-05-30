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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <form action={cerrarSesion}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg border p-6 space-y-2">
          <p><span className="font-medium">Nombre:</span> {session?.user?.name ?? "—"}</p>
          <p><span className="font-medium">Email:</span> {session?.user?.email}</p>
          <p><span className="font-medium">Rol:</span> {session?.user?.role}</p>
        </div>
      </div>
    </main>
  )
}
