import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  // Solo el ADMIN de este tenant puede ver este panel
  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const canchas = await prisma.court.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{tenant.name}</h1>
          <p className="text-sm text-gray-500">Panel de administración</p>
        </div>
        <Link href={`/dashboard/${slug}/canchas/nueva`} className={buttonVariants()}>
          + Nueva cancha
        </Link>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-4">
        <h2 className="text-lg font-semibold">Canchas</h2>

        {canchas.length === 0 ? (
          <p className="text-gray-500">No hay canchas todavía. ¡Agregá la primera!</p>
        ) : (
          <div className="space-y-3">
            {canchas.map((cancha) => (
              <div key={cancha.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cancha.name}</p>
                    <Badge variant={cancha.isActive ? "default" : "secondary"}>
                      {cancha.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {cancha.sport === "PADEL" ? "Pádel" : "Fútbol"} ·{" "}
                    ${Number(cancha.pricePerHour).toLocaleString("es-AR")} / hora
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/${slug}/canchas/${cancha.id}/editar`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Editar
                  </Link>
                  <ToggleActivaBtn
                    courtId={cancha.id}
                    isActive={cancha.isActive}
                    tenantId={tenant.id}
                    slug={slug}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
