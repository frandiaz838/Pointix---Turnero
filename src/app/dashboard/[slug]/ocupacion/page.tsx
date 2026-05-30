import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { OcupacionChart } from "@/components/admin/ocupacion-chart"
import { generarSlots } from "@/lib/slots"
import { LayoutGrid } from "lucide-react"

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
  // mes (default)
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

  const canchasPadel  = datosCanchas.filter(c => c.sport === "PADEL")
  const canchasFutbol = datosCanchas.filter(c => c.sport === "FOOTBALL")

  const periodoLabel: Record<string, string> = {
    hoy: "Hoy",
    semana: "Esta semana",
    mes: "Este mes",
    año: "Este año",
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Volver al panel
        </Link>
        <h1 className="text-xl font-bold mt-1">Ocupación</h1>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Cards resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Canchas activas</p>
              <LayoutGrid className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{datosCanchas.length}</p>
          </div>

          <div className="bg-white border rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ocupación promedio</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{ocupacionPromedio}%</p>
              <p className="text-xs text-gray-400">{periodoLabel[periodo].toLowerCase()}</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white border rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Más reservada</p>
            {cachaMasReservada ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold leading-tight">{cachaMasReservada.name}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                    {cachaMasReservada.sport === "PADEL" ? "Pádel" : "Fútbol"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {cachaMasReservada.reservas === 1 ? "1 reserva" : `${cachaMasReservada.reservas} reservas`}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-300">—</p>
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
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {periodoLabel[p]}
            </Link>
          ))}
        </div>

        {/* Gráfico */}
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            % Ocupación por cancha — {periodoLabel[periodo].toLowerCase()}
          </p>
          <OcupacionChart data={chartData} maxDominio={maxDominio} />
        </div>

        {/* Detalle por cancha — agrupado por deporte */}
        {[
          { label: "Pádel", canchas: canchasPadel },
          { label: "Fútbol", canchas: canchasFutbol },
        ].filter(g => g.canchas.length > 0).map(grupo => (
          <div key={grupo.label} className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b pb-2">
              {grupo.label}
            </h2>
            {grupo.canchas.map((cancha) => (
          <div key={cancha.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold">{cancha.name}</h2>
              <span className="text-sm text-gray-500">
                {cancha.reservas === 1 ? "1 reserva" : `${cancha.reservas} reservas`} · {cancha.ocupacion}% ocupación
              </span>
            </div>

            {cancha.bookings.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white border rounded-lg px-4 py-3">
                Sin reservas en este período.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full text-sm min-w-[360px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Fecha</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Hora</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Cliente</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cancha.bookings.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600">
                          {r.startTime.getUTCDate().toString().padStart(2, "0")}/
                          {(r.startTime.getUTCMonth() + 1).toString().padStart(2, "0")}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                        </td>
                        <td className="px-4 py-2">
                          {r.user?.name ?? r.guestName ?? "Invitado"}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            r.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-200"
                            : r.status === "CANCELLED" ? "bg-red-50 text-red-500 border-red-200"
                            : r.status === "PENDING"   ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
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
