import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"
import { LogoutBtn } from "@/components/admin/logout-btn"
import { AdminMobileMenu } from "@/components/admin/mobile-menu"
import { CountUp } from "@/components/admin/count-up"
import { HoraActual } from "@/components/admin/hora-actual"
import { generarSlots } from "@/lib/slots"
import { Clock, TrendingUp, CalendarDays, LayoutGrid, Inbox, LayoutDashboard } from "lucide-react"
import { sportLabel } from "@/lib/sports"
import { SportIcon } from "@/components/ui/sport-icon"
import { EmptyState } from "@/components/admin/empty-state"
import { todayInArIso, todayInArDayOfWeek } from "@/lib/timezone"
import { expireStalePendings } from "@/lib/bookings"

// Nunca cachear: los KPIs (reservas hoy, ingresos, ocupación) deben reflejar
// el estado real de la DB en cada visita, no un snapshot viejo.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

const estadoBadge: Record<string, string> = {
  PENDING:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  CONFIRMED: "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25",
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

  // Expira PENDING vencidas antes de calcular KPIs: si nadie pasó por el sitio
  // público, las reservas sin pagar seguían contando como "Pendiente".
  await expireStalePendings(tenant.id)

  // Trabajamos en zona horaria AR — el helper devuelve YYYY-MM-DD del día real
  // del club (no del server UTC). Los startTime de la DB se guardan como
  // "artificial UTC" (HH:00:00 UTC == HH:00 AR), así que las queries siguen
  // funcionando con strings YYYY-MM-DD ancladas a 00:00Z / 23:59Z.
  const hoy = todayInArIso()
  const diaSemana = todayInArDayOfWeek()
  const [yHoy, mHoy, dHoy] = hoy.split("-").map(Number)
  const inicio = new Date(`${hoy}T00:00:00.000Z`)
  const fin = new Date(`${hoy}T23:59:59.999Z`)
  const inicioMes = new Date(Date.UTC(yHoy, mHoy - 1, 1))
  const finMes = new Date(Date.UTC(yHoy, mHoy, 0, 23, 59, 59, 999))

  const ayerDate = new Date(Date.UTC(yHoy, mHoy - 1, dHoy - 1))
  const ayerStr = ayerDate.toISOString().split("T")[0]
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
      where: { tenantId: tenant.id, archivedAt: null },
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
      ? { text: `↑ ${diffAyer} más que ayer`, color: "text-[#A3FF12]" }
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
    <div className="min-h-screen bg-toxic-gradient relative">

      {/* Header sticky glass */}
      <header className="glass-header sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="font-display font-black uppercase text-white text-lg leading-none tracking-tight">
            {tenant.name}
          </h1>
          <HoraActual />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Link href={`/dashboard/${slug}/configuracion`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Configuración
            </Link>
            <Link href={`/dashboard/${slug}/reservas`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Ver reservas
            </Link>
            <Link
              href={`/dashboard/${slug}/canchas/nueva`}
              className="btn-lime-glow flex items-center gap-1.5 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-3 py-2 rounded-lg"
            >
              + Nueva cancha
            </Link>
            <LogoutBtn />
          </div>
          <AdminMobileMenu slug={slug} />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto p-6 space-y-8">

        {/* Stats — glassmorphism */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

          {/* Reservas hoy */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Reservas hoy</p>
              <CalendarDays className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display font-black text-white leading-none"
               style={{ fontSize: "clamp(2.5rem,6vw,3.5rem)" }}>
              <CountUp value={reservasHoy.length} formatAR={false} />
            </p>
            <p className={`text-xs font-medium ${comparacionAyer.color}`}>{comparacionAyer.text}</p>
          </div>

          {/* Ingresos — con borde lime gradient */}
          <Link
            href={`/dashboard/${slug}/ingresos`}
            className="glass-card border-lime-gradient rounded-2xl p-5 space-y-3 block transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_40px_rgba(163,255,18,0.08)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#A3FF12]/50 uppercase tracking-[0.18em]">Ingresos hoy</p>
              <TrendingUp className="w-3.5 h-3.5 text-[#A3FF12]/40" />
            </div>
            <p
              className="font-display font-black text-[#A3FF12] leading-tight text-glow-lime tabular-nums"
              style={{
                fontSize: "clamp(1.25rem,5vw,2.75rem)",
                overflowWrap: "anywhere",
              }}
            >
              $<CountUp value={ingresosHoy} />
            </p>
            <p
              className="text-xs font-medium text-white/25 tabular-nums"
              style={{ overflowWrap: "anywhere" }}
            >
              Mes: $<CountUp value={ingresosMes} duration={1200} />
            </p>
          </Link>

          {/* Ocupación */}
          <Link
            href={`/dashboard/${slug}/ocupacion`}
            className="col-span-2 sm:col-span-1 glass-card rounded-2xl p-5 space-y-3 block transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">Ocupación</p>
              <LayoutGrid className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display font-black text-white leading-none"
               style={{ fontSize: "clamp(2.5rem,6vw,3.5rem)" }}>
              {ocupacion !== null
                ? <CountUp value={ocupacion} suffix="%" formatAR={false} />
                : <span className="text-white/20">—</span>
              }
            </p>
            <p className="text-xs font-medium text-white/25">Ver detalle por cancha</p>
          </Link>
        </div>

        {/* Reservas del día */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Reservas de hoy</h2>
          {reservasHoy.length === 0 ? (
            <EmptyState
              icon={Inbox}
              titulo="No hay reservas para hoy"
              descripcion={
                <>
                  Compartí tu link de reservas en Instagram o WhatsApp:{" "}
                  <code className="text-[#A3FF12]/80 bg-white/[0.05] px-1.5 py-0.5 rounded text-[10px]">
                    pointix.com.ar/{slug}
                  </code>
                </>
              }
              acciones={[
                { label: "+ Crear reserva manual", href: `/dashboard/${slug}/reservas/nueva`, variant: "primary" },
              ]}
            />
          ) : (
            <div className="glass-card rounded-2xl divide-y divide-white/[0.05]">
              {reservasHoy.map((r) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-white w-14 shrink-0 tabular-nums">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                    </span>
                    <span className="text-sm font-medium text-white/70 truncate">{r.court.name}</span>
                    <span className="text-sm text-white/25 truncate hidden sm:block">
                      {r.user?.name ?? r.guestName ?? "Invitado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoBadge[r.status] ?? estadoBadge.PENDING}`}>
                      {estadoLabel[r.status] ?? r.status}
                    </span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      ${Number(r.totalPrice).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Canchas */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Canchas</h2>

          {canchas.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              titulo="Todavía no tenés canchas"
              descripcion="Creá la primera cancha para empezar a recibir reservas."
              acciones={[
                { label: "+ Crear primera cancha", href: `/dashboard/${slug}/canchas/nueva`, variant: "primary" },
              ]}
            />
          ) : (
            <div className="space-y-6">
              {gruposCanchas.map(({ sport, canchas: lista }) => (
                <div key={sport} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="separator-subtle flex-1" />
                    <SportIcon sport={sport} size={14} />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/55 border-white/[0.1]">
                      {sportLabel(sport)}
                    </span>
                    <div className="separator-subtle flex-1" />
                  </div>

                  {lista.map((cancha) => {
                    const sch = cancha.schedules.find(s => s.dayOfWeek === diaSemana) ?? cancha.schedules[0]
                    return (
                      <div
                        key={cancha.id}
                        className={`card-float glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                          cancha.isActive ? "" : "opacity-40"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-white truncate">{cancha.name}</p>
                            <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
                              cancha.isActive
                                ? "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25"
                                : "bg-white/[0.04] text-white/20 border-white/[0.06]"
                            }`}>
                              {cancha.isActive ? "Activa" : "Inactiva"}
                            </span>
                          </div>
                          <p className="text-sm text-white/35 font-display font-black text-glow-lime" style={{ textShadow: "none" }}>
                            ${Number(cancha.pricePerHour).toLocaleString("es-AR")}
                            <span className="text-white/25 font-sans font-normal text-xs ml-1">/ hora</span>
                          </p>
                          {sch && (
                            <p className="text-xs text-white/20 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sch.openTime} — {sch.closeTime}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ToggleActivaBtn courtId={cancha.id} isActive={cancha.isActive} tenantId={tenant.id} slug={slug} />
                          <Link
                            href={`/dashboard/${slug}/canchas/${cancha.id}`}
                            className="btn-lime-glow inline-flex items-center gap-1.5 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-3.5 py-2 rounded-lg transition-all"
                          >
                            Editar
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
