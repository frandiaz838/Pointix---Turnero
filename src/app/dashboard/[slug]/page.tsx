import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { CountUp } from "@/components/admin/count-up"
import { generarSlots } from "@/lib/slots"
import { TrendingUp, CalendarDays, BarChart3, Inbox, ArrowRight } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { todayInArIso, todayInArDayOfWeek } from "@/lib/timezone"
import { expireStalePendings } from "@/lib/bookings"
import { OnboardingChecklist } from "@/components/admin/onboarding-checklist"
import { CopyLinkBtn } from "@/components/admin/copy-link-btn"
import { PageHeader, PageBody, SectionTitle, btnPrimario, btnSecundario } from "@/components/admin/page-header"

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
  COMPLETED: "bg-white/[0.05] text-white/55 border-white/[0.1]",
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

  const RESERVAS_HOY_LIMITE = 10

  // KPIs van por separado para no cargar las N reservas del día solo para
  // sumar el monto. La lista visible se limita a 10 (con "Ver todas" abajo).
  const [reservasHoyVisibles, statsHoy, reservasMes, canchas, countAyer] = await Promise.all([
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
      take: RESERVAS_HOY_LIMITE,
    }),
    prisma.booking.aggregate({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicio, lte: fin },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      _sum: { totalPrice: true },
      _count: { _all: true },
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

  const totalReservasHoy = statsHoy._count._all
  const ingresosHoy = Number(statsHoy._sum.totalPrice ?? 0)
  const ingresosMes = Number(reservasMes._sum.totalPrice ?? 0)
  const reservasOcultas = Math.max(0, totalReservasHoy - reservasHoyVisibles.length)

  const totalSlotsHoy = canchas
    .filter(c => c.isActive)
    .reduce((sum, c) => {
      const sch = c.schedules.find(s => s.dayOfWeek === diaSemana)
      return sch ? sum + generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).length : sum
    }, 0)
  const ocupacion = totalSlotsHoy > 0 ? Math.round((totalReservasHoy / totalSlotsHoy) * 100) : null

  const diffAyer = totalReservasHoy - countAyer
  const comparacionAyer =
    diffAyer > 0
      ? { text: `↑ ${diffAyer} más que ayer`, color: "text-[#A3FF12]" }
      : diffAyer < 0
      ? { text: `↓ ${Math.abs(diffAyer)} menos que ayer`, color: "text-red-400" }
      : { text: "Igual que ayer", color: "text-white/50" }

  const primerNombre = session.user.name?.trim().split(/\s+/)[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pointix.com.ar"

  const kpis = [
    {
      label: "Reservas hoy",
      icon: CalendarDays,
      valor: <CountUp value={totalReservasHoy} formatAR={false} />,
      detalle: <span className={comparacionAyer.color}>{comparacionAyer.text}</span>,
      href: `/dashboard/${slug}/reservas`,
      cta: "Ver reservas",
      destacado: false,
    },
    {
      label: "Ingresos hoy",
      icon: TrendingUp,
      valor: <>$<CountUp value={ingresosHoy} /></>,
      detalle: <>En el mes: $<CountUp value={ingresosMes} duration={1200} /></>,
      href: `/dashboard/${slug}/ingresos`,
      cta: "Ver ingresos",
      destacado: true,
    },
    {
      label: "Ocupación hoy",
      icon: BarChart3,
      valor: ocupacion !== null ? <CountUp value={ocupacion} suffix="%" formatAR={false} /> : <span className="text-white/50">—</span>,
      detalle: ocupacion !== null ? `${totalReservasHoy} de ${totalSlotsHoy} turnos reservados` : "Sin horarios cargados para hoy",
      href: `/dashboard/${slug}/ocupacion`,
      cta: "Ver ocupación",
      destacado: false,
    },
  ]

  return (
    <PageBody>
      <PageHeader
        titulo={primerNombre ? `Hola, ${primerNombre}` : "Hola"}
        descripcion="Así viene el día en tu complejo."
        acciones={
          <>
            <CopyLinkBtn url={`${appUrl}/${slug}`} className={btnSecundario} />
            <Link href={`/dashboard/${slug}/reservas/nueva`} className={btnPrimario}>+ Nueva reserva</Link>
          </>
        }
      />

      <OnboardingChecklist tenantId={tenant.id} slug={slug} tieneMp={!!tenant.mpAccessToken} />

      {/* Números del día: cada tarjeta lleva a su detalle.
          Mobile: ingresos arriba a lo ancho y las otras dos de a pares, compactas. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {kpis.map(({ label, icon: Icon, valor, detalle, href, cta, destacado }) => (
          <Link
            key={label}
            href={href}
            className={`group glass-card rounded-2xl p-4 sm:p-6 flex flex-col gap-2 sm:gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] ${
              destacado ? "border-lime-gradient col-span-2 order-first sm:col-span-1 sm:order-none" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${destacado ? "text-[#A3FF12]" : "text-white/65"}`}>{label}</p>
              <Icon className={`w-5 h-5 ${destacado ? "text-[#A3FF12]/70" : "text-white/50"}`} />
            </div>
            <p
              className={`font-display font-black leading-none tabular-nums ${destacado ? "text-[#A3FF12] text-glow-lime" : "text-white"}`}
              style={{ fontSize: "clamp(2rem,5vw,3.5rem)", overflowWrap: "anywhere" }}
            >
              {valor}
            </p>
            <p className="text-xs sm:text-sm text-white/55" style={{ overflowWrap: "anywhere" }}>{detalle}</p>
            <span className="hidden sm:inline-flex mt-auto pt-3 border-t border-white/[0.07] text-sm font-semibold text-white/60 group-hover:text-white items-center gap-1.5 transition-colors">
              {cta}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      {/* Agenda del día */}
      <section className="space-y-4">
        <SectionTitle
          accion={totalReservasHoy > 0 && (
            <Link href={`/dashboard/${slug}/reservas`} className="text-sm font-semibold text-[#A3FF12] hover:underline">
              Ver todas →
            </Link>
          )}
        >
          Agenda de hoy
        </SectionTitle>

        {totalReservasHoy === 0 ? (
          <EmptyState
            icon={Inbox}
            titulo="Todavía no hay reservas para hoy"
            descripcion={
              <>
                Compartí tu link en Instagram o WhatsApp para que te reserven:{" "}
                <code className="text-[#A3FF12] bg-white/[0.05] px-1.5 py-0.5 rounded text-xs">pointix.com.ar/{slug}</code>
              </>
            }
            acciones={[
              { label: "+ Cargar una reserva", href: `/dashboard/${slug}/reservas/nueva`, variant: "primary" },
            ]}
          />
        ) : (
          <div className="space-y-3">
            <ul className="glass-card rounded-2xl divide-y divide-white/[0.06]">
              {reservasHoyVisibles.map((r) => (
                <li key={r.id} className="px-5 py-4 flex items-center gap-4">
                  <span className="font-display font-black text-2xl text-white tabular-nums w-20 shrink-0 leading-none">
                    {r.startTime.getUTCHours().toString().padStart(2, "0")}:{r.startTime.getUTCMinutes().toString().padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-white truncate">{r.court.name}</p>
                    <p className="text-sm text-white/55 truncate">{r.user?.name ?? r.guestName ?? "Invitado"}</p>
                  </div>
                  <span className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoBadge[r.status] ?? estadoBadge.PENDING}`}>
                    {estadoLabel[r.status] ?? r.status}
                  </span>
                  <span className="text-base font-bold text-white tabular-nums shrink-0">
                    ${Number(r.totalPrice).toLocaleString("es-AR")}
                  </span>
                </li>
              ))}
            </ul>
            {reservasOcultas > 0 && (
              <Link
                href={`/dashboard/${slug}/reservas`}
                className="block text-center text-sm font-semibold text-[#A3FF12] hover:underline py-2"
              >
                Ver las otras {reservasOcultas} reservas de hoy →
              </Link>
            )}
          </div>
        )}
      </section>
    </PageBody>
  )
}
