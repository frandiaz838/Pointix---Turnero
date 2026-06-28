import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { CalendarDays, User, Phone, Inbox, Pencil } from "lucide-react"
import { EmptyState } from "@/components/admin/empty-state"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { sportLabel } from "@/lib/sports"
import { SportIcon } from "@/components/ui/sport-icon"
import { CancelarReservaBtn } from "@/components/admin/cancelar-reserva-btn"
import { ConfirmarReservaBtn } from "@/components/admin/confirmar-reserva-btn"
import { MarcarNoShowBtn } from "@/components/admin/marcar-noshow-btn"
import { ReservasControles } from "@/components/admin/reservas-controles"
import { ReservasSearch } from "@/components/admin/reservas-search"
import { ReservasEstadoFilter, type EstadoFiltro } from "@/components/admin/reservas-estado-filter"
import { Paginacion } from "@/components/admin/paginacion"
import { AdminToast } from "@/components/admin/admin-toast"
import { UndoConfirmacionToast } from "@/components/admin/undo-confirmacion-toast"
import { nowInArAsArtificialUtc, todayInArIso } from "@/lib/timezone"
import { expireStalePendings } from "@/lib/bookings"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string; periodo?: string; q?: string; estado?: string; pagina?: string }>
}

const ITEMS_POR_PAGINA = 25
const ESTADOS_VALIDOS = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const

const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFechaDia(iso: string) {
  const d = new Date(iso + "T12:00:00Z")
  return `${DIAS_FULL[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}

// Formato compacto de rango de fechas.
// - Mismo mes: "8 al 14 de junio"
// - Distinto mes mismo año: "29 jun al 5 jul"
// - Distinto año: "29 dic 2026 al 5 ene 2027"
function formatRangoFechas(inicio: Date, fin: Date) {
  const dA = inicio.getUTCDate(), mA = inicio.getUTCMonth(), yA = inicio.getUTCFullYear()
  const dB = fin.getUTCDate(),    mB = fin.getUTCMonth(),    yB = fin.getUTCFullYear()
  const corto = (m: number) => MESES[m].slice(0, 3)
  if (mA === mB && yA === yB) return `${dA} al ${dB} de ${MESES[mA]}`
  if (yA === yB)              return `${dA} ${corto(mA)} al ${dB} ${corto(mB)}`
  return `${dA} ${corto(mA)} ${yA} al ${dB} ${corto(mB)} ${yB}`
}

function formatHora(date: Date) {
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`
}

const estadoBadge: Record<string, string> = {
  PENDING:   "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  CONFIRMED: "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-white/[0.05] text-white/40 border-white/[0.1]",
  NO_SHOW:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
}

const estadoLabel: Record<string, string> = {
  PENDING:   "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW:   "No vino",
}

// Para reservas que ya pasaron (endTime < now), reinterpretamos el estado
// visualmente: una CONFIRMED en el pasado = "Cumplida", una PENDING = "Expirada".
const estadoBadgePasado: Record<string, string> = {
  PENDING:   "bg-white/[0.05] text-white/35 border-white/[0.08]",
  CONFIRMED: "bg-white/[0.05] text-white/45 border-white/[0.1]",
  CANCELLED: "bg-red-500/[0.05] text-red-400/50 border-red-500/[0.12]",
  COMPLETED: "bg-white/[0.05] text-white/40 border-white/[0.1]",
  NO_SHOW:   "bg-orange-500/[0.05] text-orange-400/55 border-orange-500/[0.15]",
}

const estadoLabelPasado: Record<string, string> = {
  PENDING:   "Expirada",
  CONFIRMED: "Cumplida",
  CANCELLED: "Cancelada",
  COMPLETED: "Cumplida",
  NO_SHOW:   "No vino",
}

export default async function ReservasAdminPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { fecha, periodo, q, estado: estadoParam, pagina: paginaParam } = await searchParams
  const session = await auth()

  // Filtro por estado
  const estadoFiltro: EstadoFiltro =
    estadoParam && (ESTADOS_VALIDOS as readonly string[]).includes(estadoParam)
      ? (estadoParam as EstadoFiltro)
      : "todos"

  // Paginación
  const paginaNum = parseInt(paginaParam ?? "1", 10)
  const pagina = Math.max(1, Number.isFinite(paginaNum) && paginaNum > 0 ? paginaNum : 1)

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  await expireStalePendings(tenant.id)

  const queryBusqueda = q?.trim() ?? ""
  const enModoBusqueda = queryBusqueda.length > 0

  // Fecha real del club (zona horaria AR), no UTC del server.
  const hoyStr = todayInArIso()
  const [yHoy, mHoy, dHoy] = hoyStr.split("-").map(Number)

  // Sumar N días en calendar-time AR (sin saltos por horarios de verano), siempre
  // sobre la base de hoyStr ya anclada a Argentina.
  function fechaAr(offsetDias: number): string {
    return new Date(Date.UTC(yHoy, mHoy - 1, dHoy + offsetDias)).toISOString().split("T")[0]
  }

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
    const manStr = fechaAr(1)
    inicioRango = new Date(`${manStr}T00:00:00.000Z`)
    finRango = new Date(`${manStr}T23:59:59.999Z`)
    periodoActivo = "manana"
  } else if (periodo === "semana") {
    const finStr = fechaAr(6)
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${finStr}T23:59:59.999Z`)
    esMultiple = true
    periodoActivo = "semana"
  } else if (periodo === "2semanas") {
    const finStr = fechaAr(13)
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${finStr}T23:59:59.999Z`)
    esMultiple = true
    periodoActivo = "2semanas"
  } else {
    inicioRango = new Date(`${hoyStr}T00:00:00.000Z`)
    finRango = new Date(`${hoyStr}T23:59:59.999Z`)
    periodoActivo = "hoy"
  }

  // En modo búsqueda ignoramos el período para encontrar al cliente en cualquier fecha,
  // pero limitamos a los últimos 12 meses para que la query no explote.
  const filtroBusqueda = enModoBusqueda
    ? {
        OR: [
          { guestName:  { contains: queryBusqueda, mode: "insensitive" as const } },
          { guestPhone: { contains: queryBusqueda } },
          { guestEmail: { contains: queryBusqueda, mode: "insensitive" as const } },
          { user: { name:  { contains: queryBusqueda, mode: "insensitive" as const } } },
          { user: { email: { contains: queryBusqueda, mode: "insensitive" as const } } },
        ],
      }
    : null

  const inicioBusqueda = new Date(Date.UTC(yHoy, mHoy - 1 - 12, dHoy))

  // Where común a count + findMany: filtros tenant + período/búsqueda + estado
  const filtroEstado = estadoFiltro !== "todos" ? { status: estadoFiltro } : {}

  const where = {
    tenantId: tenant.id,
    ...filtroEstado,
    ...(enModoBusqueda
      ? { startTime: { gte: inicioBusqueda }, ...filtroBusqueda }
      : { startTime: { gte: inicioRango, lte: finRango } }),
  }

  const [reservas, totalReservas] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        court: { select: { name: true, sport: true } },
      },
      orderBy: { startTime: enModoBusqueda ? "desc" : "asc" },
      skip: (pagina - 1) * ITEMS_POR_PAGINA,
      take: ITEMS_POR_PAGINA,
    }),
    prisma.booking.count({ where }),
  ])

  const totalPaginas = Math.max(1, Math.ceil(totalReservas / ITEMS_POR_PAGINA))

  // En modo búsqueda mostramos los resultados agrupados por fecha (visualizar cuándo
  // jugó el cliente a lo largo del año).
  if (enModoBusqueda) esMultiple = true

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

  // Para que "Hoy" / "Mañana" muestren también la fecha real al lado.
  // Reutilizamos hoyStr y fechaAr declarados arriba para no recalcular.
  const mañanaArIso = fechaAr(1)

  const tituloFecha =
    periodoActivo === "hoy"
      ? `Hoy · ${formatFechaDia(hoyStr)}`
      : periodoActivo === "manana"
      ? `Mañana · ${formatFechaDia(mañanaArIso)}`
      : periodoActivo === "semana"
      ? `Esta semana · ${formatRangoFechas(inicioRango, finRango)}`
      : periodoActivo === "2semanas"
      ? `Próximas 2 semanas · ${formatRangoFechas(inicioRango, finRango)}`
      : periodoActivo === "custom" && fecha
      ? formatFechaDia(fecha)
      : ""

  const nowAr = nowInArAsArtificialUtc()

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <AdminToast param="creada" mensaje="Reserva creada" />
      <AdminToast param="editada" mensaje="Reserva editada" />
      <UndoConfirmacionToast />
      <header className="glass-header sticky top-0 z-50 px-6 py-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
            ← Volver al panel
          </Link>
          <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">Reservas</h1>
        </div>
        <Link
          href={`/dashboard/${slug}/reservas/nueva`}
          className="btn-lime-glow shrink-0 flex items-center gap-1.5 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-3 py-2 rounded-lg"
        >
          + Nueva
        </Link>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto p-6 space-y-5">
        <ReservasSearch initial={queryBusqueda} />

        {!enModoBusqueda && (
          <ReservasControles
            slug={slug}
            periodoActivo={periodoActivo}
            fechaSeleccionada={fechaSeleccionada}
          />
        )}

        <ReservasEstadoFilter activo={estadoFiltro} />

        {enModoBusqueda && (
          <p className="text-xs text-white/40">
            {totalReservas === 0
              ? <>Sin resultados para <span className="text-white/70 font-semibold">&ldquo;{queryBusqueda}&rdquo;</span></>
              : <>{totalReservas} {totalReservas === 1 ? "resultado" : "resultados"} para <span className="text-white/70 font-semibold">&ldquo;{queryBusqueda}&rdquo;</span> (últimos 12 meses)</>
            }
          </p>
        )}

        {!esMultiple && (
          <div className="space-y-3">
            {tituloFecha && (
              <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                {tituloFecha}
              </h2>
            )}
            {reservas.length === 0 ? (
              <EmptyState
                icon={Inbox}
                titulo={
                  enModoBusqueda ? "Ningún cliente coincide" :
                  estadoFiltro !== "todos" ? "No hay reservas con ese estado" :
                  "No hay reservas para este período"
                }
                descripcion={
                  enModoBusqueda ? "Probá buscar con otro nombre o teléfono." :
                  "¿El cliente te confirmó por WhatsApp? Cargala vos manualmente."
                }
                acciones={
                  enModoBusqueda ? undefined :
                  [{ label: "+ Nueva reserva", href: `/dashboard/${slug}/reservas/nueva`, variant: "primary" }]
                }
              />
            ) : (
              reservas.map((r) => <ReservaCard key={r.id} reserva={r} nowAr={nowAr} slug={slug} />)
            )}
          </div>
        )}

        {esMultiple && (
          <div className="space-y-6">
            {!enModoBusqueda && tituloFecha && (
              <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
                {tituloFecha}
              </h2>
            )}
            {gruposFecha.length === 0 ? (
              <EmptyState
                icon={Inbox}
                titulo={enModoBusqueda ? "Ningún cliente coincide" : "No hay reservas para este período"}
                descripcion={enModoBusqueda ? "Probá con otro término de búsqueda." : undefined}
                acciones={
                  enModoBusqueda ? undefined :
                  [{ label: "+ Nueva reserva", href: `/dashboard/${slug}/reservas/nueva`, variant: "primary" }]
                }
              />
            ) : (
              gruposFecha.map(({ label, reservas: lista }) => (
                <div key={label} className="space-y-3">
                  <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em] border-b border-white/[0.06] pb-2">
                    {label}
                  </h2>
                  {lista.map((r) => <ReservaCard key={r.id} reserva={r} nowAr={nowAr} slug={slug} />)}
                </div>
              ))
            )}
          </div>
        )}

        {totalReservas > 0 && (
          <Paginacion
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalItems={totalReservas}
            itemsPorPagina={ITEMS_POR_PAGINA}
          />
        )}
      </section>
    </main>
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

function ReservaCard({ reserva: r, nowAr, slug }: { reserva: Reserva; nowAr: Date; slug: string }) {
  const duracionMin = Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60000)
  const horaInicio = formatHora(r.startTime)
  const horaFin = formatHora(r.endTime)
  const nombreCliente = r.user ? (r.user.name ?? "(sin nombre)") : (r.guestName ?? "(sin nombre)")
  const telefono = !r.user && r.guestPhone ? formatTelefono(r.guestPhone) : null

  const esPasada = r.endTime < nowAr
  const badgeClasses = esPasada
    ? estadoBadgePasado[r.status] ?? estadoBadgePasado.PENDING
    : estadoBadge[r.status]    ?? estadoBadge.PENDING
  const badgeLabel = esPasada
    ? estadoLabelPasado[r.status] ?? r.status
    : estadoLabel[r.status]    ?? r.status

  // Si ya pasó, no tiene sentido confirmar/cancelar — la jugada ya ocurrió.
  const mostrarAcciones = !esPasada && (r.status === "PENDING" || r.status === "CONFIRMED")
  // Si ya pasó y aún estaba CONFIRMED/PENDING, ofrecer "Marcar no-show".
  const mostrarNoShow = esPasada && (r.status === "CONFIRMED" || r.status === "PENDING")

  return (
    <div className={`card-float glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 transition-opacity ${esPasada ? "opacity-55" : ""}`}>
      <div className="space-y-1.5 min-w-0">
        {/* Hora y estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-white tabular-nums">
            {horaInicio} — {horaFin}
            <span className="text-white/30 font-normal ml-1.5">({duracionMin} min)</span>
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badgeLabel}
          </span>
        </div>

        {/* Cancha + deporte */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <SportIcon sport={r.court.sport} size={14} />
          <span className="text-sm font-medium text-white/80">{r.court.name}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/55 border-white/[0.1]">
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
      <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
        <p
          className={`font-bold text-base sm:text-sm tabular-nums break-all ${esPasada ? "text-white/60" : "text-white"}`}
        >
          ${Number(r.totalPrice).toLocaleString("es-AR")}
        </p>
        {mostrarAcciones && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full sm:w-auto">
            {r.status === "PENDING" && <ConfirmarReservaBtn bookingId={r.id} />}
            <Link
              href={`/dashboard/${slug}/reservas/${r.id}/editar`}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md glass-nav text-white/65 hover:text-white transition-colors"
              title="Editar reserva"
            >
              <Pencil className="w-3 h-3" />
              Editar
            </Link>
            <CancelarReservaBtn bookingId={r.id} />
          </div>
        )}
        {mostrarNoShow && <MarcarNoShowBtn bookingId={r.id} />}
      </div>
    </div>
  )
}
