import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { IngresosCharts } from "@/components/admin/ingresos-charts"
import { PeriodoSelector, type PeriodoIngresos } from "@/components/admin/periodo-selector"
import { TrendingUp, Receipt, Calculator } from "lucide-react"
import { sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ periodo?: string }>
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const DIAS_SEMANA_CORTOS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

const estadoBadge: Record<string, string> = {
  CONFIRMED: "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25",
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

function parsePeriodo(s: string | undefined): PeriodoIngresos {
  if (s === "hoy" || s === "mes-pasado" || s === "este-año" || s === "año-pasado") return s
  return "este-mes"
}

function calcRango(periodo: PeriodoIngresos, ahora: Date) {
  const y = ahora.getUTCFullYear()
  const m = ahora.getUTCMonth()
  const d = ahora.getUTCDate()
  if (periodo === "hoy") {
    const inicio = new Date(Date.UTC(y, m, d, 0, 0, 0, 0))
    const fin    = new Date(Date.UTC(y, m, d, 23, 59, 59, 999))
    return { inicio, fin, tipo: "dia" as const, label: `Hoy · ${d} ${MESES[m]}` }
  }
  if (periodo === "mes-pasado") {
    const inicio = new Date(Date.UTC(y, m - 1, 1))
    const fin    = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999))
    return { inicio, fin, tipo: "mes" as const, label: `${MESES[inicio.getUTCMonth()]} ${inicio.getUTCFullYear()}` }
  }
  if (periodo === "este-año") {
    const inicio = new Date(Date.UTC(y, 0, 1))
    const fin    = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999))
    return { inicio, fin, tipo: "año" as const, label: `${y}` }
  }
  if (periodo === "año-pasado") {
    const inicio = new Date(Date.UTC(y - 1, 0, 1))
    const fin    = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59, 999))
    return { inicio, fin, tipo: "año" as const, label: `${y - 1}` }
  }
  const inicio = new Date(Date.UTC(y, m, 1))
  const fin    = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
  return { inicio, fin, tipo: "mes" as const, label: `${MESES[m]} ${y}` }
}

export default async function IngresosPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { periodo: periodoParam } = await searchParams
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const periodo = parsePeriodo(periodoParam)
  const ahora = new Date()
  const { inicio, fin, tipo, label } = calcRango(periodo, ahora)

  const reservas = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: inicio, lte: fin },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    include: {
      court: { select: { name: true, sport: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
  })

  // Stats
  const confirmadas = reservas.filter(r => r.status === "CONFIRMED" || r.status === "COMPLETED")
  const pendientes  = reservas.filter(r => r.status === "PENDING")
  const totalConfirmado = confirmadas.reduce((s, r) => s + Number(r.totalPrice), 0)
  const totalPendiente  = pendientes.reduce((s, r) => s + Number(r.totalPrice), 0)
  const totalGeneral    = totalConfirmado + totalPendiente
  const promedio = reservas.length > 0 ? Math.round(totalGeneral / reservas.length) : 0

  // Breakdown table — días si es mes, meses si es año
  type FilaBreakdown = { id: string; label: string; cantidad: number; total: number; barra: number; destacado: boolean }
  const hoyStr = ahora.toISOString().split("T")[0]
  let breakdown: FilaBreakdown[] = []

  if (tipo === "mes") {
    const ultDia = fin.getUTCDate()
    const totales = Array.from({ length: ultDia }, () => 0)
    const counts  = Array.from({ length: ultDia }, () => 0)
    reservas.forEach(r => {
      const d = r.startTime.getUTCDate() - 1
      totales[d] += Number(r.totalPrice)
      counts[d] += 1
    })
    const max = Math.max(1, ...totales)
    breakdown = totales.map((total, i) => {
      const dia = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), i + 1))
      const fechaIso = dia.toISOString().split("T")[0]
      return {
        id: fechaIso,
        label: `${DIAS_SEMANA_CORTOS[dia.getUTCDay()]} ${dia.getUTCDate()}`,
        cantidad: counts[i],
        total,
        barra: Math.round((total / max) * 100),
        destacado: fechaIso === hoyStr,
      }
    })
  } else {
    const totales = Array.from({ length: 12 }, () => 0)
    const counts  = Array.from({ length: 12 }, () => 0)
    reservas.forEach(r => {
      const m = r.startTime.getUTCMonth()
      totales[m] += Number(r.totalPrice)
      counts[m] += 1
    })
    const max = Math.max(1, ...totales)
    const mesActual = ahora.getUTCMonth()
    const añoActual = ahora.getUTCFullYear()
    breakdown = totales.map((total, i) => ({
      id: `mes-${i}`,
      label: MESES_CORTOS[i],
      cantidad: counts[i],
      total,
      barra: Math.round((total / max) * 100),
      destacado: i === mesActual && inicio.getUTCFullYear() === añoActual,
    }))
  }

  const porCancha = Object.values(
    reservas.reduce<Record<string, { name: string; total: number }>>((acc, r) => {
      if (!acc[r.court.name]) acc[r.court.name] = { name: r.court.name, total: 0 }
      acc[r.court.name].total += Number(r.totalPrice)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const porDeporte = Object.values(
    reservas.reduce<Record<string, { name: string; total: number }>>((acc, r) => {
      const dep = sportLabel(r.court.sport)
      if (!acc[dep]) acc[dep] = { name: dep, total: 0 }
      acc[dep].total += Number(r.totalPrice)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">
          Ingresos — {label}
        </h1>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto p-6 space-y-8">

        {/* Period selector */}
        <PeriodoSelector slug={slug} activo={periodo} />

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-card border-lime-gradient rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#A3FF12]/60 uppercase tracking-[0.15em]">Confirmado</p>
              <TrendingUp className="w-3.5 h-3.5 text-[#A3FF12]/50" />
            </div>
            <p
              className="font-display font-black text-[#A3FF12] tracking-tight text-glow-lime tabular-nums leading-none"
              style={{ fontSize: "clamp(2.25rem, 8vw, 3.5rem)" }}
            >
              ${totalConfirmado.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-white/30">
              {confirmadas.length} {confirmadas.length === 1 ? "reserva" : "reservas"}
            </p>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Pendiente</p>
              <Receipt className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p
              className="font-display font-black text-white/85 tracking-tight tabular-nums leading-none"
              style={{ fontSize: "clamp(2.25rem, 8vw, 3.5rem)" }}
            >
              ${totalPendiente.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-white/30">
              {pendientes.length} {pendientes.length === 1 ? "reserva" : "reservas"} sin confirmar
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 glass-card rounded-xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">Promedio por reserva</p>
              <Calculator className="w-3.5 h-3.5 text-white/20" />
            </div>
            <p
              className="font-display font-black text-white/85 tracking-tight tabular-nums leading-none"
              style={{ fontSize: "clamp(1.8rem, 6vw, 2.5rem)" }}
            >
              ${promedio.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-white/30">
              Total: ${totalGeneral.toLocaleString("es-AR")}
            </p>
          </div>
        </div>

        {/* Breakdown table — solo para mes o año. Para "hoy" no aplica. */}
        {tipo !== "dia" && (
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
            {tipo === "mes" ? `Desglose diario — ${label}` : `Desglose mensual — ${label}`}
          </h2>
          <div className="overflow-x-auto glass-card rounded-xl">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.07]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-white/40 whitespace-nowrap">{tipo === "mes" ? "Día" : "Mes"}</th>
                  <th className="text-right px-4 py-3 font-medium text-white/40 whitespace-nowrap">Reservas</th>
                  <th className="text-right px-4 py-3 font-medium text-white/40 whitespace-nowrap">Ingresos</th>
                  <th className="px-4 py-3 w-36 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {breakdown.map((fila) => (
                  <tr key={fila.id} className={fila.destacado ? "bg-[#A3FF12]/[0.04]" : ""}>
                    <td className={`px-4 py-3 ${fila.destacado ? "font-bold text-white" : "text-white/70"}`}>
                      {fila.label}
                      {fila.destacado && (
                        <span className="ml-2 text-[10px] text-[#A3FF12] font-bold uppercase tracking-wide">
                          {tipo === "mes" ? "hoy" : "ahora"}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right ${fila.destacado ? "font-bold text-white" : "text-white/40"}`}>
                      {fila.cantidad || "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${fila.destacado ? "text-[#A3FF12]" : fila.total > 0 ? "text-white" : "text-white/20"}`}>
                      {fila.total > 0 ? `$${fila.total.toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {fila.total > 0 && (
                        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#A3FF12] rounded-full"
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
        )}

        {/* Gráficos */}
        <IngresosCharts porCancha={porCancha} porDeporte={porDeporte} />

        {/* Listado completo del período */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
            Reservas del período ({reservas.length})
          </h2>

          {reservas.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-white/25 text-center text-sm">
              Sin reservas este período
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="sm:hidden space-y-2.5">
                {reservas.map((r) => (
                  <div
                    key={r.id}
                    className="glass-card rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {r.court.name}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {r.user ? (r.user.name ?? r.user.email) : (r.guestName ?? "Invitado")}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${estadoBadge[r.status]}`}>
                        {estadoLabel[r.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                      <div className="text-xs text-white/50 tabular-nums">
                        {r.startTime.getUTCDate().toString().padStart(2, "0")}/
                        {(r.startTime.getUTCMonth() + 1).toString().padStart(2, "0")}
                        <span className="mx-1.5 text-white/25">·</span>
                        {r.startTime.getUTCHours().toString().padStart(2, "0")}:00
                      </div>
                      <span className="text-sm font-bold text-white tabular-nums">
                        ${Number(r.totalPrice).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabla */}
              <div className="hidden sm:block glass-card rounded-xl overflow-hidden">
                <table className="w-full text-sm">
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
                    {reservas.map((r) => (
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
            </>
          )}
        </div>

      </section>
    </main>
  )
}
