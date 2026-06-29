import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { OcupacionChart } from "@/components/admin/ocupacion-chart"
import { generarSlots } from "@/lib/slots"
import { LayoutGrid } from "lucide-react"
import { sportLabel } from "@/lib/sports"
import { todayInArIso } from "@/lib/timezone"
import { expireStalePendings } from "@/lib/bookings"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ periodo?: string; tramo?: string }>
}

// Tramos horarios para análisis de ocupación. "Pico" es 18-23 (rango típico
// de demanda alta en complejos deportivos AR — después del trabajo). Sin esto,
// un complejo que abre 8-23 con buena ocupación a la noche muestra un % global
// muy bajo (porque los slots vacíos de 8-17 inflan el denominador).
type Tramo = "todos" | "pico"
const RANGOS_TRAMO: Record<Tramo, { inicio: number; fin: number } | null> = {
  todos: null,
  pico:  { inicio: 18, fin: 23 },
}
function parseTramo(s: string | undefined): Tramo {
  return s === "pico" ? "pico" : "todos"
}
function hourMatchesTramo(hour: number, tramo: Tramo): boolean {
  const r = RANGOS_TRAMO[tramo]
  if (!r) return true
  return hour >= r.inicio && hour < r.fin
}

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
}

// Recibe la fecha de hoy en AR como YYYY-MM-DD para que el rango refleje
// el día real del club, no el UTC del server.
function getRango(periodo: string, hoyAr: string) {
  const [y, mHumano, d] = hoyAr.split("-").map(Number)
  const m = mHumano - 1
  if (periodo === "hoy") {
    return {
      inicio: new Date(`${hoyAr}T00:00:00.000Z`),
      fin: new Date(`${hoyAr}T23:59:59.999Z`),
    }
  }
  if (periodo === "semana") {
    const diaSemana = new Date(Date.UTC(y, m, d)).getUTCDay()
    const lunes = new Date(Date.UTC(y, m, d - ((diaSemana + 6) % 7), 0, 0, 0, 0))
    const domingo = new Date(lunes)
    domingo.setUTCDate(lunes.getUTCDate() + 6)
    domingo.setUTCHours(23, 59, 59, 999)
    return { inicio: lunes, fin: domingo }
  }
  if (periodo === "año") {
    return {
      inicio: new Date(Date.UTC(y, 0, 1)),
      fin: new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999)),
    }
  }
  return {
    inicio: new Date(Date.UTC(y, m, 1)),
    fin: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)),
  }
}

function calcularSlotsTotal(
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[],
  inicio: Date,
  fin: Date,
  tramo: Tramo,
) {
  let total = 0
  const cursor = new Date(inicio)
  while (cursor <= fin) {
    const s = schedules.find((s) => s.dayOfWeek === cursor.getUTCDay())
    if (s) {
      const slotsDelDia = generarSlots(s.openTime, s.closeTime, s.slotMinutes)
      total += slotsDelDia.filter(slot => {
        const h = parseInt(slot.split(":")[0], 10)
        return hourMatchesTramo(h, tramo)
      }).length
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return total
}

export default async function OcupacionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { periodo: periodoParam, tramo: tramoParam } = await searchParams
  const periodo = periodoParam ?? "mes"
  const tramo = parseTramo(tramoParam)

  const session = await auth()
  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  await expireStalePendings(tenant.id)

  const hoyAr = todayInArIso()
  const { inicio, fin } = getRango(periodo, hoyAr)

  const canchas = await prisma.court.findMany({
    where: { tenantId: tenant.id, isActive: true, archivedAt: null },
    include: {
      schedules: true,
      bookings: {
        where: {
          startTime: { gte: inicio, lte: fin },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        },
        include: { user: { select: { name: true } } },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  const datosCanchas = canchas.map((c) => {
    const slotsTotal = calcularSlotsTotal(c.schedules, inicio, fin, tramo)
    // Filtramos las bookings por tramo para que el conteo y el listado de
    // abajo respeten el filtro horario actual.
    const bookingsTramo = c.bookings.filter(b => hourMatchesTramo(b.startTime.getUTCHours(), tramo))
    const reservas = bookingsTramo.length
    const ocupacion = slotsTotal > 0 ? Math.round((reservas / slotsTotal) * 100) : 0
    return { ...c, bookings: bookingsTramo, slotsTotal, reservas, ocupacion }
  })

  const chartData = datosCanchas.map((c) => ({ name: c.name, ocupacion: c.ocupacion }))

  const ocupacionPromedio = datosCanchas.length > 0
    ? Math.round(datosCanchas.reduce((sum, c) => sum + c.ocupacion, 0) / datosCanchas.length)
    : 0
  const cachaMasReservada = datosCanchas.length > 0
    ? datosCanchas.reduce((max, c) => c.reservas > max.reservas ? c : max, datosCanchas[0])
    : null

  const maxOcupacion = datosCanchas.length > 0 ? Math.max(...datosCanchas.map(c => c.ocupacion)) : 0
  const maxDominio = Math.min(100, maxOcupacion === 0 ? 10 : maxOcupacion + 15)

  const gruposDeporte = [...new Set(datosCanchas.map(c => c.sport))].map(sport => ({
    sport,
    label: sportLabel(sport),
    canchas: datosCanchas.filter(c => c.sport === sport),
  }))

  const periodoLabel: Record<string, string> = {
    hoy: "Hoy",
    semana: "Esta semana",
    mes: "Este mes",
    año: "Este año",
  }

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">Ocupación</h1>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto p-6 space-y-8">

        {/* Cards resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Canchas activas</p>
              <LayoutGrid className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display text-3xl font-black text-white">{datosCanchas.length}</p>
          </div>

          <div className="glass-card border-lime-gradient rounded-xl p-5 space-y-2">
            <p className="text-[10px] font-bold text-[#A3FF12]/50 uppercase tracking-[0.15em]">Ocup. promedio</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-3xl font-black text-[#A3FF12] text-glow-lime">{ocupacionPromedio}%</p>
              <p className="text-xs text-white/25">{periodoLabel[periodo].toLowerCase()}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 glass-card rounded-xl p-5 space-y-2">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Más reservada</p>
            {cachaMasReservada ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-white leading-tight">{cachaMasReservada.name}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/55 border-white/[0.1]">
                    {sportLabel(cachaMasReservada.sport)}
                  </span>
                </div>
                <p className="text-xs text-white/30">
                  {cachaMasReservada.reservas === 1 ? "1 reserva" : `${cachaMasReservada.reservas} reservas`}
                </p>
              </div>
            ) : (
              <p className="font-display text-2xl font-black text-white/20">—</p>
            )}
          </div>
        </div>

        {/* Selector de período */}
        <div className="flex flex-wrap gap-2">
          {(["hoy", "semana", "mes", "año"] as const).map((p) => (
            <Link
              key={p}
              href={`/dashboard/${slug}/ocupacion?periodo=${p}${tramo === "pico" ? "&tramo=pico" : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                periodo === p
                  ? "btn-lime-glow bg-[#A3FF12] text-black border-[#A3FF12]"
                  : "glass-nav text-white/60 hover:text-white"
              }`}
            >
              {periodoLabel[p]}
            </Link>
          ))}
        </div>

        {/* Selector de tramo horario: la métrica global castiga a los clubes
            con horarios largos (los slots vacíos de la mañana inflan el
            denominador). El tramo "Horarios pico" mira solo 18-23h, que es
            cuando la demanda real define qué tan lleno está el complejo. */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] mr-1">Tramo:</span>
          {(["todos", "pico"] as const).map((t) => (
            <Link
              key={t}
              href={`/dashboard/${slug}/ocupacion?periodo=${periodo}${t === "pico" ? "&tramo=pico" : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                tramo === t
                  ? "bg-[#A3FF12]/15 text-[#A3FF12] border-[#A3FF12]/40"
                  : "glass-nav text-white/55 hover:text-white"
              }`}
            >
              {t === "todos" ? "Todo el día" : "Horarios pico (18–23h)"}
            </Link>
          ))}
        </div>

        {/* Gráfico */}
        <div className="glass-card rounded-xl p-5">
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] mb-4">
            % Ocupación por cancha — {periodoLabel[periodo].toLowerCase()}
            {tramo === "pico" && <span className="text-[#A3FF12]/70"> · horarios pico</span>}
          </p>
          <OcupacionChart data={chartData} maxDominio={maxDominio} />
        </div>

        {/* Detalle por cancha — agrupado por deporte */}
        {gruposDeporte.filter(g => g.canchas.length > 0).map(grupo => (
          <div key={grupo.label} className="space-y-4">
            <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] border-b border-white/[0.06] pb-2">
              {grupo.label}
            </h2>
            {grupo.canchas.map((cancha) => (
              <div key={cancha.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-white">{cancha.name}</h2>
                  <span className="text-sm text-white/35">
                    {cancha.reservas === 1 ? "1 reserva" : `${cancha.reservas} reservas`}
                    {" · "}{cancha.ocupacion}% ocupación
                  </span>
                </div>

                {cancha.bookings.length === 0 ? (
                  <p className="text-sm text-white/25 glass-card rounded-xl px-4 py-3">
                    Sin reservas en este período.
                  </p>
                ) : (
                  <div className="overflow-x-auto glass-card rounded-xl">
                    <table className="w-full text-sm min-w-[360px]">
                      <thead className="border-b border-white/[0.07]">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Fecha</th>
                          <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Hora</th>
                          <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Cliente</th>
                          <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {cancha.bookings.map((r) => (
                          <tr key={r.id} className="hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-white/50 tabular-nums">
                              {r.startTime.getUTCDate().toString().padStart(2, "0")}/
                              {(r.startTime.getUTCMonth() + 1).toString().padStart(2, "0")}
                            </td>
                            <td className="px-4 py-3 text-white/50 tabular-nums">
                              {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                            </td>
                            <td className="px-4 py-3 text-white/70">
                              {r.user?.name ?? r.guestName ?? "Invitado"}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                                r.status === "CONFIRMED" ? "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25"
                                : r.status === "CANCELLED" ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : r.status === "PENDING"   ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/20"
                                : "bg-white/[0.05] text-white/40 border-white/[0.1]"
                              }`}>
                                {estadoLabel[r.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  )
}
