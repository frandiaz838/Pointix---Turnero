import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"
import { LogoutBtn } from "@/components/admin/logout-btn"
import { AdminMobileMenu } from "@/components/admin/mobile-menu"
import { generarSlots } from "@/lib/slots"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const ahora = new Date()
  const hoy = ahora.toISOString().split("T")[0]
  const inicio = new Date(`${hoy}T00:00:00.000Z`)
  const fin = new Date(`${hoy}T23:59:59.999Z`)
  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))
  const finMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0, 23, 59, 59, 999))

  const [reservasHoy, reservasMes, canchas, schedulesHoy] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicio, lte: fin },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: {
        court: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.booking.aggregate({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicioMes, lte: finMes },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      _sum: { totalPrice: true },
    }),
    prisma.court.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.schedule.findMany({
      where: {
        court: { tenantId: tenant.id, isActive: true },
        dayOfWeek: new Date().getUTCDay(),
      },
    }),
  ])

  const ingresosHoy = reservasHoy.reduce((sum, r) => sum + Number(r.totalPrice), 0)
  const ingresosMes = Number(reservasMes._sum.totalPrice ?? 0)

  const totalSlotsHoy = schedulesHoy.reduce((sum, s) => {
    return sum + generarSlots(s.openTime, s.closeTime, s.slotMinutes).length
  }, 0)
  const ocupacion = totalSlotsHoy > 0 ? Math.round((reservasHoy.length / totalSlotsHoy) * 100) : null

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{tenant.name}</h1>
          <p className="text-sm font-medium text-gray-500">Panel de administración</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href={`/dashboard/${slug}/reservas`} className={buttonVariants({ variant: "outline" })}>
              Ver reservas
            </Link>
            <Link href={`/dashboard/${slug}/canchas/nueva`} className={buttonVariants()}>
              + Nueva cancha
            </Link>
            <LogoutBtn />
          </div>
          {/* Mobile */}
          <AdminMobileMenu slug={slug} />
        </div>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Stats del día */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4 space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reservas hoy</p>
            <p className="text-3xl font-bold">{reservasHoy.length}</p>
          </div>
          <Link href={`/dashboard/${slug}/ingresos`} className="bg-white border rounded-lg p-4 space-y-1 hover:bg-gray-50 transition-colors block">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos</p>
            <p className="text-3xl font-bold">${ingresosHoy.toLocaleString("es-AR")}</p>
            <p className="text-xs font-medium text-gray-400">Este mes: ${ingresosMes.toLocaleString("es-AR")}</p>
          </Link>
          <Link href={`/dashboard/${slug}/ocupacion`} className="col-span-2 sm:col-span-1 bg-white border rounded-lg p-4 space-y-1 hover:bg-gray-50 transition-colors block">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ocupación</p>
            <p className="text-3xl font-bold">
              {ocupacion !== null ? `${ocupacion}%` : "—"}
            </p>
            <p className="text-xs font-medium text-gray-400">Ver detalle por cancha</p>
          </Link>
        </div>

        {/* Próximas reservas del día */}
        {reservasHoy.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reservas de hoy</h2>
            <div className="bg-white border rounded-lg divide-y">
              {reservasHoy.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-14">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                    </span>
                    <span className="text-sm font-medium text-gray-600">{r.court.name}</span>
                    <span className="text-sm font-medium text-gray-400">
                      {r.user?.name ?? r.guestName ?? "Invitado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      r.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-200"
                      : r.status === "CANCELLED" ? "bg-red-50 text-red-500 border-red-200"
                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}>
                      {r.status === "CONFIRMED" ? "Confirmada" : r.status === "CANCELLED" ? "Cancelada" : "Pendiente"}
                    </span>
                    <span className="text-sm font-medium">
                      ${Number(r.totalPrice).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de canchas */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Canchas</h2>

          {canchas.length === 0 ? (
            <p className="text-gray-500">No hay canchas todavía. ¡Agregá la primera!</p>
          ) : (
            <div className="space-y-3">
              {canchas.map((cancha) => (
                <div key={cancha.id} className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{cancha.name}</p>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                        cancha.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {cancha.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {cancha.sport === "PADEL" ? "Pádel" : "Fútbol"} ·{" "}
                      ${Number(cancha.pricePerHour).toLocaleString("es-AR")} / hora
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/${slug}/canchas/${cancha.id}/horarios`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Horarios
                    </Link>
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
        </div>

      </section>
    </main>
  )
}
