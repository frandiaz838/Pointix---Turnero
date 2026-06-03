import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { OcupacionChart } from "@/components/admin/ocupacion-chart"
import { generarSlots } from "@/lib/slots"
import { LayoutGrid } from "lucide-react"
import { getSport, sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ periodo?: string }>
}

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
}

function getRango(periodo: string, ahora: Date) {
  if (periodo === "hoy") {
    const hoy = ahora.toISOString().split("T")[0]
    return {
      inicio: new Date(`${hoy}T00:00:00.000Z`),
      fin: new Date(`${hoy}T23:59:59.999Z`),
    }
  }
  if (periodo === "semana") {
    const dia = ahora.getUTCDay()
    const lunes = new Date(ahora)
    lunes.setUTCDate(ahora.getUTCDate() - ((dia + 6) % 7))
    lunes.setUTCHours(0, 0, 0, 0)
    const domingo = new Date(lunes)
    domingo.setUTCDate(lunes.getUTCDate() + 6)
    domingo.setUTCHours(23, 59, 59, 999)
    return { inicio: lunes, fin: domingo }
  }
  if (periodo === "año") {
    return {
      inicio: new Date(Date.UTC(ahora.getUTCFullYear(), 0, 1)),
      fin: new Date(Date.UTC(ahora.getUTCFullYear(), 11, 31, 23, 59, 59, 999)),
    }
  }
  return {
    inicio: new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)),
    fin: new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
  }
}

function calcularSlotsTotal(
  schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[],
  inicio: Date,
  fin: Date
) {
  let total = 0
  const cursor = new Date(inicio)
  while (cursor <= fin) {
    const s = schedules.find((s) => s.dayOfWeek === cursor.getUTCDay())
    if (s) total += generarSlots(s.openTime, s.closeTime, s.slotMinutes).length
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return total
}

export default async function OcupacionPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { periodo: periodoParam } = await searchParams
  const periodo = periodoParam ?? "mes"

  const session = await auth()
  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const ahora = new Date()
  const { inicio, fin } = getRango(periodo, ahora)

  const canchas = await prisma.court.findMany({
    where: { tenantId: tenant.id, isActive: true },
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
    const slotsTotal = calcularSlotsTotal(c.schedules, inicio, fin)
    const reservas = c.bookings.length
    const ocupacion = slotsTotal > 0 ? Math.round((reservas / slotsTotal) * 100) : 0
    return { ...c, slotsTotal, reservas, ocupacion }
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
    <main className="min-h-screen bg-[#0C0E14]">
      <header className="bg-[#0C0E14] border-b border-white/[0.07] px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="text-lg font-bold text-white mt-1">Ocupación</h1>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Cards resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Canchas activas</p>
              <LayoutGrid className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display text-3xl font-black text-white">{datosCanchas.length}</p>
          </div>

          <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Ocup. promedio</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-3xl font-black text-[#CAFF00]">{ocupacionPromedio}%</p>
              <p className="text-xs text-white/25">{periodoLabel[periodo].toLowerCase()}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Más reservada</p>
            {cachaMasReservada ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-white leading-tight">{cachaMasReservada.name}</p>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${getSport(cachaMasReservada.sport).badgeClassSolid}`}>
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
              href={`/dashboard/${slug}/ocupacion?periodo=${p}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                periodo === p
                  ? "bg-[#CAFF00] text-black border-[#CAFF00]"
                  : "bg-white/[0.05] hover:bg-white/[0.09] border-white/[0.1] text-white/60 hover:text-white"
              }`}
            >
              {periodoLabel[p]}
            </Link>
          ))}
        </div>

        {/* Gráfico */}
        <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] mb-4">
            % Ocupación por cancha — {periodoLabel[periodo].toLowerCase()}
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
                  <p className="text-sm text-white/25 bg-[#14171F] border border-white/[0.07] rounded-xl px-4 py-3">
                    Sin reservas en este período.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#14171F]">
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
                                r.status === "CONFIRMED" ? "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25"
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
