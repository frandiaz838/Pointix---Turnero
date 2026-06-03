import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"
import { LogoutBtn } from "@/components/admin/logout-btn"
import { AdminMobileMenu } from "@/components/admin/mobile-menu"
import { generarSlots } from "@/lib/slots"
import { Clock } from "lucide-react"
import { getSport, sportLabel } from "@/lib/sports"
import { SportIcon } from "@/components/ui/sport-icon"

interface Props {
  params: Promise<{ slug: string }>
}

const estadoBadge: Record<string, string> = {
  PENDING:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  CONFIRMED: "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-white/[0.05] text-white/40 border-white/[0.1]",
}

const estadoLabel: Record<string, string> = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
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
  const diaSemana = ahora.getUTCDay()

  const ayer = new Date(ahora)
  ayer.setUTCDate(ahora.getUTCDate() - 1)
  const ayerStr = ayer.toISOString().split("T")[0]
  const inicioAyer = new Date(`${ayerStr}T00:00:00.000Z`)
  const finAyer = new Date(`${ayerStr}T23:59:59.999Z`)

  const [reservasHoy, reservasMes, canchas, countAyer] = await Promise.all([
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
      include: { schedules: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.booking.count({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicioAyer, lte: finAyer },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ])

  const ingresosHoy = reservasHoy.reduce((sum, r) => sum + Number(r.totalPrice), 0)
  const ingresosMes = Number(reservasMes._sum.totalPrice ?? 0)

  const totalSlotsHoy = canchas
    .filter(c => c.isActive)
    .reduce((sum, c) => {
      const sch = c.schedules.find(s => s.dayOfWeek === diaSemana)
      return sch ? sum + generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).length : sum
    }, 0)
  const ocupacion = totalSlotsHoy > 0 ? Math.round((reservasHoy.length / totalSlotsHoy) * 100) : null

  const diffAyer = reservasHoy.length - countAyer
  const comparacionAyer =
    diffAyer > 0
      ? { text: `↑ ${diffAyer} más que ayer`, color: "text-[#CAFF00]" }
      : diffAyer < 0
      ? { text: `↓ ${Math.abs(diffAyer)} menos que ayer`, color: "text-red-400" }
      : { text: "Igual que ayer", color: "text-white/30" }

  const sportMap = new Map<string, typeof canchas>()
  for (const c of canchas) {
    const arr = sportMap.get(c.sport) ?? []
    arr.push(c)
    sportMap.set(c.sport, arr)
  }
  const gruposCanchas = [...sportMap.entries()].map(([sport, lista]) => ({
    sport,
    canchas: [...lista.filter(c => c.isActive), ...lista.filter(c => !c.isActive)],
  }))

  return (
    <main className="min-h-screen bg-[#0C0E14]">
      <header className="bg-[#0C0E14] border-b border-white/[0.07] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{tenant.name}</h1>
          <p className="text-xs font-medium text-white/35 uppercase tracking-wide">Panel de administración</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Link href={`/dashboard/${slug}/reservas`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Ver reservas
            </Link>
            <Link href={`/dashboard/${slug}/canchas/nueva`} className={buttonVariants({ size: "sm" })}>
              + Nueva cancha
            </Link>
            <LogoutBtn />
          </div>
          <AdminMobileMenu slug={slug} />
        </div>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Stats del día */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Reservas hoy</p>
            <p className="font-display text-4xl font-black text-white">{reservasHoy.length}</p>
            <p className={`text-xs font-medium ${comparacionAyer.color}`}>{comparacionAyer.text}</p>
          </div>

          <Link
            href={`/dashboard/${slug}/ingresos`}
            className="bg-[#14171F] border border-white/[0.07] hover:border-white/[0.15] rounded-xl p-5 space-y-2 transition-colors block"
          >
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Ingresos hoy</p>
            <p className="font-display text-4xl font-black text-[#CAFF00]">
              ${ingresosHoy.toLocaleString("es-AR")}
            </p>
            <p className="text-xs font-medium text-white/25">
              Mes: ${ingresosMes.toLocaleString("es-AR")}
            </p>
          </Link>

          <Link
            href={`/dashboard/${slug}/ocupacion`}
            className="col-span-2 sm:col-span-1 bg-[#14171F] border border-white/[0.07] hover:border-white/[0.15] rounded-xl p-5 space-y-2 transition-colors block"
          >
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Ocupación</p>
            <p className="font-display text-4xl font-black text-white">
              {ocupacion !== null ? `${ocupacion}%` : "—"}
            </p>
            <p className="text-xs font-medium text-white/25">Ver detalle por cancha</p>
          </Link>
        </div>

        {/* Reservas del día */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Reservas de hoy</h2>
          {reservasHoy.length === 0 ? (
            <p className="text-sm text-white/25 bg-[#14171F] border border-white/[0.07] rounded-xl px-5 py-4">
              No hay reservas para hoy.
            </p>
          ) : (
            <div className="bg-[#14171F] border border-white/[0.07] rounded-xl divide-y divide-white/[0.06]">
              {reservasHoy.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-white w-14 shrink-0 tabular-nums">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                    </span>
                    <span className="text-sm font-medium text-white/70 truncate">{r.court.name}</span>
                    <span className="text-sm text-white/30 truncate hidden sm:block">
                      {r.user?.name ?? r.guestName ?? "Invitado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      estadoBadge[r.status] ?? estadoBadge.PENDING
                    }`}>
                      {estadoLabel[r.status] ?? r.status}
                    </span>
                    <span className="text-sm font-bold text-white">
                      ${Number(r.totalPrice).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de canchas agrupadas por deporte */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Canchas</h2>

          {canchas.length === 0 ? (
            <p className="text-sm text-white/30">No hay canchas todavía. ¡Agregá la primera!</p>
          ) : (
            <div className="space-y-6">
              {gruposCanchas.map(({ sport, canchas: lista }) => (
                <div key={sport} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    <SportIcon sport={sport} size={16} />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getSport(sport).badgeClassSolid}`}>
                      {sportLabel(sport)}
                    </span>
                  </div>

                  {lista.map((cancha) => {
                    const sch = cancha.schedules.find(s => s.dayOfWeek === diaSemana) ?? cancha.schedules[0]
                    return (
                      <div
                        key={cancha.id}
                        className={`bg-[#14171F] border border-white/[0.07] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-opacity ${
                          cancha.isActive ? "" : "opacity-40"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white truncate">{cancha.name}</p>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                              cancha.isActive
                                ? "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25"
                                : "bg-white/[0.04] text-white/25 border-white/[0.07]"
                            }`}>
                              {cancha.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          <p className="text-sm text-white/40">
                            ${Number(cancha.pricePerHour).toLocaleString("es-AR")} / hora
                          </p>
                          {sch && (
                            <p className="text-xs text-white/25 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sch.openTime} — {sch.closeTime}
                            </p>
                          )}
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
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </main>
  )
}
