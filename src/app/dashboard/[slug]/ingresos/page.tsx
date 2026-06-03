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
  CONFIRMED: "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25",
  PENDING:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-white/[0.05] text-white/40 border-white/[0.1]",
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

  const ingresosHoy     = reservasMes.filter(r => r.startTime.toISOString().split("T")[0] === hoy).reduce((s, r) => s + Number(r.totalPrice), 0)
  const ingresosSemana  = reservasMes.filter(r => r.startTime >= lunes && r.startTime <= domingo).reduce((s, r) => s + Number(r.totalPrice), 0)
  const ingresosMes     = reservasMes.reduce((s, r) => s + Number(r.totalPrice), 0)

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
    <main className="min-h-screen bg-[#0C0E14]">
      <header className="bg-[#0C0E14] border-b border-white/[0.07] px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="text-lg font-bold text-white mt-1">
          Ingresos — {MESES[ahora.getUTCMonth()]} {ahora.getUTCFullYear()}
        </h1>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-8">

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Hoy</p>
              <Clock className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display text-4xl font-black text-white tracking-tight">
              ${ingresosHoy.toLocaleString("es-AR")}
            </p>
          </div>

          <div className="bg-[#14171F] border border-white/[0.07] rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Esta semana</p>
              <Calendar className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p className="font-display text-4xl font-black text-white tracking-tight">
              ${ingresosSemana.toLocaleString("es-AR")}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-[#14171F] border border-[#CAFF00]/20 rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#CAFF00]/60 uppercase tracking-[0.15em]">Este mes</p>
              <TrendingUp className="w-3.5 h-3.5 text-[#CAFF00]/50" />
            </div>
            <p className="font-display text-4xl font-black text-[#CAFF00] tracking-tight">
              ${ingresosMes.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* Tabla semanal */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Semana actual</h2>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#14171F]">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.07]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Día</th>
                  <th className="text-right px-4 py-3 font-medium text-white/40 whitespace-nowrap">Reservas</th>
                  <th className="text-right px-4 py-3 font-medium text-white/40 whitespace-nowrap">Ingresos</th>
                  <th className="px-4 py-3 w-36 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {tablaSemana.map((fila) => (
                  <tr key={fila.fecha} className={fila.esHoy ? "bg-[#CAFF00]/[0.04]" : ""}>
                    <td className={`px-4 py-3 ${fila.esHoy ? "font-bold text-white" : "text-white/70"}`}>
                      {fila.label}
                      {fila.esHoy && (
                        <span className="ml-2 text-[10px] text-[#CAFF00] font-bold uppercase tracking-wide">hoy</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right ${fila.esHoy ? "font-bold text-white" : "text-white/40"}`}>
                      {fila.cantidad}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${fila.esHoy ? "text-[#CAFF00]" : fila.total > 0 ? "text-white" : "text-white/20"}`}>
                      {fila.total > 0 ? `$${fila.total.toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {fila.total > 0 && (
                        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#CAFF00] rounded-full"
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

        {/* Gráficos */}
        <IngresosCharts porCancha={porCancha} porDeporte={porDeporte} />

        {/* Listado completo del mes */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
            Reservas del mes ({reservasMes.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#14171F]">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-white/[0.07]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Hora</th>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Cancha</th>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-white/40 whitespace-nowrap">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {reservasMes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-white/25 text-center">
                      Sin reservas este mes
                    </td>
                  </tr>
                ) : reservasMes.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/50 tabular-nums">
                      {r.startTime.getUTCDate().toString().padStart(2, "0")}/
                      {(r.startTime.getUTCMonth() + 1).toString().padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 text-white/50 tabular-nums">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                    </td>
                    <td className="px-4 py-3 text-white/80">{r.court.name}</td>
                    <td className="px-4 py-3 text-white/50">
                      {r.user ? (r.user.name ?? r.user.email) : (r.guestName ?? "Invitado")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoBadge[r.status]}`}>
                        {estadoLabel[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
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
