import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { IngresosCharts } from "@/components/admin/ingresos-charts"
import { Clock, Calendar, TrendingUp } from "lucide-react"
import { sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string }>
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

const estadoBadge: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-50 text-red-500 border-red-200",
  COMPLETED: "bg-gray-50 text-gray-600 border-gray-200",
}

const estadoLabel: Record<string, string> = {
  CONFIRMED: "Confirmada",
  PENDING:   "Pendiente",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
}

export default async function IngresosPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const ahora = new Date()
  const hoy = ahora.toISOString().split("T")[0]

  const inicioMes = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))
  const finMes    = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0, 23, 59, 59, 999))

  const diaSemana = ahora.getUTCDay()
  const lunes = new Date(ahora)
  lunes.setUTCDate(ahora.getUTCDate() - ((diaSemana + 6) % 7))
  lunes.setUTCHours(0, 0, 0, 0)
  const domingo = new Date(lunes)
  domingo.setUTCDate(lunes.getUTCDate() + 6)
  domingo.setUTCHours(23, 59, 59, 999)

  const reservasMes = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: inicioMes, lte: finMes },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      court: { select: { name: true, sport: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
  })

  // Stats principales
  const ingresosHoy     = reservasMes.filter(r => r.startTime.toISOString().split("T")[0] === hoy).reduce((s, r) => s + Number(r.totalPrice), 0)
  const ingresosSemana  = reservasMes.filter(r => r.startTime >= lunes && r.startTime <= domingo).reduce((s, r) => s + Number(r.totalPrice), 0)
  const ingresosMes     = reservasMes.reduce((s, r) => s + Number(r.totalPrice), 0)

  // Tabla semanal
  const maxDiaSemana = Math.max(
    1,
    ...Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes)
      d.setUTCDate(lunes.getUTCDate() + i)
      const f = d.toISOString().split("T")[0]
      return reservasMes.filter(r => r.startTime.toISOString().split("T")[0] === f).reduce((s, r) => s + Number(r.totalPrice), 0)
    })
  )

  const tablaSemana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(lunes)
    dia.setUTCDate(lunes.getUTCDate() + i)
    const fechaDia = dia.toISOString().split("T")[0]
    const reservasDia = reservasMes.filter(r => r.startTime.toISOString().split("T")[0] === fechaDia)
    const total = reservasDia.reduce((s, r) => s + Number(r.totalPrice), 0)
    return {
      label: `${DIAS_SEMANA[dia.getUTCDay()]} ${dia.getUTCDate()}`,
      fecha: fechaDia,
      cantidad: reservasDia.length,
      total,
      barra: Math.round((total / maxDiaSemana) * 100),
      esHoy: fechaDia === hoy,
    }
  })

  // Por cancha y deporte
  const porCancha = Object.values(
    reservasMes.reduce<Record<string, { name: string; total: number }>>((acc, r) => {
      if (!acc[r.court.name]) acc[r.court.name] = { name: r.court.name, total: 0 }
      acc[r.court.name].total += Number(r.totalPrice)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const porDeporte = Object.values(
    reservasMes.reduce<Record<string, { name: string; total: number }>>((acc, r) => {
      const dep = sportLabel(r.court.sport)
      if (!acc[dep]) acc[dep] = { name: dep, total: 0 }
      acc[dep].total += Number(r.totalPrice)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Volver al panel
        </Link>
        <h1 className="text-xl font-bold mt-1">
          Ingresos — {MESES[ahora.getUTCMonth()]} {ahora.getUTCFullYear()}
        </h1>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hoy</p>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-4xl font-bold tracking-tight">${ingresosHoy.toLocaleString("es-AR")}</p>
          </div>
          <div className="bg-white border rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Esta semana</p>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-4xl font-bold tracking-tight">${ingresosSemana.toLocaleString("es-AR")}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white border-2 border-blue-200 rounded-lg p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Este mes</p>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-4xl font-bold tracking-tight text-blue-600">${ingresosMes.toLocaleString("es-AR")}</p>
          </div>
        </div>

        {/* Tabla semanal con barra */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Semana actual</h2>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Día</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Reservas</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Ingresos</th>
                  <th className="px-4 py-2 w-36 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tablaSemana.map((fila) => (
                  <tr key={fila.fecha} className={fila.esHoy ? "bg-blue-50" : ""}>
                    <td className={`px-4 py-2.5 ${fila.esHoy ? "font-bold" : ""}`}>
                      {fila.label}
                      {fila.esHoy && <span className="ml-2 text-xs text-blue-500 font-medium">hoy</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-gray-500 ${fila.esHoy ? "font-bold" : ""}`}>
                      {fila.cantidad}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${fila.esHoy ? "font-bold" : ""}`}>
                      {fila.total > 0 ? `$${fila.total.toLocaleString("es-AR")}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {fila.total > 0 && (
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${fila.barra}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráficos por cancha y deporte */}
        <IngresosCharts porCancha={porCancha} porDeporte={porDeporte} />

        {/* Listado completo del mes */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Reservas del mes ({reservasMes.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Hora</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Cancha</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Cliente</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Estado</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 whitespace-nowrap">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservasMes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-4 text-gray-400 text-center">Sin reservas este mes</td></tr>
                ) : reservasMes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-600">
                      {r.startTime.getUTCDate().toString().padStart(2, "0")}/
                      {(r.startTime.getUTCMonth() + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                    </td>
                    <td className="px-4 py-2.5">{r.court.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {r.user ? (r.user.name ?? r.user.email) : (r.guestName ?? "Invitado")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoBadge[r.status]}`}>
                        {estadoLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">
                      ${Number(r.totalPrice).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>
    </main>
  )
}
