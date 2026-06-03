import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { CalendarDays, User, Phone } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { getSport, sportLabel } from "@/lib/sports"
import { SportIcon } from "@/components/ui/sport-icon"
import { CancelarReservaBtn } from "@/components/admin/cancelar-reserva-btn"
import { ConfirmarReservaBtn } from "@/components/admin/confirmar-reserva-btn"
import { ReservasControles } from "@/components/admin/reservas-controles"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string; periodo?: string }>
}

const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFechaDia(iso: string) {
  const d = new Date(iso + "T12:00:00Z")
  return `${DIAS_FULL[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}

function formatHora(date: Date) {
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`
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

export default async function ReservasAdminPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { fecha, periodo } = await searchParams
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const ahora = new Date()
  const hoyStr = ahora.toISOString().split("T")[0]

  let inicioRango: Date
  let finRango: Date
  let esMultiple = false
  let periodoActivo: string
  let fechaSeleccionada: string | null = null

  if (fecha) {
    inicioRango = new Date(`${fecha}T00:00:00.000Z`)
    finRango = new Date(`${fecha}T23:59:59.999Z`)
    periodoActivo = "custom"
    fechaSeleccionada = fecha
  } else if (periodo === "manana") {
    const d = new Date(ahora)
    d.setUTCDate(ahora.getUTCDate() + 1)
    const manStr = d.toISOString().split("T")[0]
    inicioRango = new Date(`${manStr}T00:00:00.000Z`)
    finRango = new Date(`${manStr}T23:59:59.999Z`)
    periodoActivo = "manana"
  } else if (periodo === "semana") {
    const d = new Date(ahora)
    d.setUTCDate(ahora.getUTCDate() + 6)
    const finStr = d.toISOString().split("T")[0]
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${finStr}T23:59:59.999Z`)
    esMultiple = true
    periodoActivo = "semana"
  } else if (periodo === "2semanas") {
    const d = new Date(ahora)
    d.setUTCDate(ahora.getUTCDate() + 13)
    const finStr = d.toISOString().split("T")[0]
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${finStr}T23:59:59.999Z`)
    esMultiple = true
    periodoActivo = "2semanas"
  } else {
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${hoyStr}T23:59:59.999Z`)
    periodoActivo = "hoy"
  }

  const reservas = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: inicioRango, lte: finRango },
    },
    include: {
      user: { select: { name: true } },
      court: { select: { name: true, sport: true } },
    },
    orderBy: { startTime: "asc" },
  })

  const gruposFecha: Array<{ label: string; reservas: typeof reservas }> = []
  if (esMultiple) {
    const mapaFecha = new Map<string, typeof reservas>()
    for (const r of reservas) {
      const f = r.startTime.toISOString().split("T")[0]
      const arr = mapaFecha.get(f) ?? []
      arr.push(r)
      mapaFecha.set(f, arr)
    }
    for (const [f, lista] of mapaFecha) {
      gruposFecha.push({ label: formatFechaDia(f), reservas: lista })
    }
  }

  const tituloFecha =
    periodoActivo === "hoy"
      ? "Hoy"
      : periodoActivo === "manana"
      ? "Mañana"
      : periodoActivo === "custom" && fecha
      ? formatFechaDia(fecha)
      : ""

  return (
    <main className="min-h-screen bg-[#0C0E14] relative">
      {/* Orbs */}
      <div
        className="pointer-events-none fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }}
      />
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">Reservas</h1>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto p-6 space-y-5">
        <ReservasControles
          slug={slug}
          periodoActivo={periodoActivo}
          fechaSeleccionada={fechaSeleccionada}
        />

        {!esMultiple && (
          <div className="space-y-3">
            {tituloFecha && (
              <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                {tituloFecha}
              </h2>
            )}
            {reservas.length === 0 ? (
              <EstadoVacio />
            ) : (
              reservas.map((r) => <ReservaCard key={r.id} reserva={r} />)
            )}
          </div>
        )}

        {esMultiple && (
          <div className="space-y-6">
            {gruposFecha.length === 0 ? (
              <EstadoVacio />
            ) : (
              gruposFecha.map(({ label, reservas: lista }) => (
                <div key={label} className="space-y-3">
                  <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] border-b border-white/[0.06] pb-2">
                    {label}
                  </h2>
                  {lista.map((r) => <ReservaCard key={r.id} reserva={r} />)}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function EstadoVacio() {
  return (
    <div className="glass-card rounded-xl px-6 py-10 flex flex-col items-center gap-3 text-center">
      <CalendarDays className="w-7 h-7 text-white/15" />
      <p className="text-sm font-medium text-white/30">No hay reservas para este período</p>
    </div>
  )
}

type Reserva = {
  id: string
  startTime: Date
  endTime: Date
  totalPrice: unknown
  status: string
  guestName: string | null
  guestPhone: string | null
  user: { name: string | null } | null
  court: { name: string; sport: string }
}

function formatTelefono(tel: string) {
  const digits = tel.replace(/\D/g, "")
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return tel
}

function ReservaCard({ reserva: r }: { reserva: Reserva }) {
  const duracionMin = Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60000)
  const horaInicio = formatHora(r.startTime)
  const horaFin = formatHora(r.endTime)
  const sport = getSport(r.court.sport)
  const nombreCliente = r.user ? (r.user.name ?? "(sin nombre)") : (r.guestName ?? "(sin nombre)")
  const telefono = !r.user && r.guestPhone ? formatTelefono(r.guestPhone) : null

  return (
    <div className="card-float glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="space-y-1.5 min-w-0">
        {/* Hora y estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-white tabular-nums">
            {horaInicio} — {horaFin}
            <span className="text-white/30 font-normal ml-1.5">({duracionMin} min)</span>
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${estadoBadge[r.status] ?? estadoBadge.PENDING}`}>
            {estadoLabel[r.status] ?? r.status}
          </span>
        </div>

        {/* Cancha + deporte */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SportIcon sport={r.court.sport} size={14} />
          <span className="text-sm font-medium text-white/80">{r.court.name}</span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border ${sport.badgeClassSolid}`}>
            {sportLabel(r.court.sport)}
          </span>
        </div>

        {/* Cliente y teléfono */}
        <div className="flex items-center gap-3 flex-wrap text-sm text-white/40">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-white/20" />
            {nombreCliente}
          </span>
          {telefono && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-white/20" />
              {telefono}
            </span>
          )}
        </div>
      </div>

      {/* Precio y acciones */}
      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
        <p className="font-bold text-sm text-white">${Number(r.totalPrice).toLocaleString("es-AR")}</p>
        {(r.status === "PENDING" || r.status === "CONFIRMED") && (
          <div className="flex items-center gap-2">
            {r.status === "PENDING" && <ConfirmarReservaBtn bookingId={r.id} />}
            <CancelarReservaBtn bookingId={r.id} />
          </div>
        )}
      </div>
    </div>
  )
}
