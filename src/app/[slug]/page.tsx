import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Clock } from "lucide-react"
import { auth } from "@/lib/session"
import { GrillaReservas } from "@/components/booking/grilla-reservas"
import { ConfirmationToast } from "@/components/booking/confirmation-toast"
import { BookingSuccessCard } from "@/components/booking/booking-success-card"
import { generarSlots } from "@/lib/slots"
import { buildMensajeReserva, buildWhatsappUrl } from "@/lib/whatsapp"
import { calcularDesglose } from "@/lib/pricing"
import { sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reservado?: string; fecha?: string; deporte?: string }>
}

const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
function formatFechaLarga(d: Date): string {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}
function formatHoraUtc(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { reservado: reservadoParam, fecha: fechaParam, deporte: deporteParam } = await searchParams
  const session = await auth()

  const hoyAr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())

  const fecha = fechaParam ?? hoyAr
  const deporte = deporteParam ?? "todos"
  const diaSemana = new Date(hoyAr + "T12:00:00Z").getUTCDay()

  // Rango de la fecha del filtro (para la grilla)
  const inicio = new Date(`${fecha}T00:00:00.000Z`)
  const fin = new Date(`${fecha}T23:59:59.999Z`)

  // Rango de HOY real (para el info row del hero)
  const inicioHoy = new Date(`${hoyAr}T00:00:00.000Z`)
  const finHoy = new Date(`${hoyAr}T23:59:59.999Z`)

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      courts: {
        where: { isActive: true },
        include: { schedules: true },
        orderBy: [{ sport: "asc" }, { name: "asc" }],
      },
    },
  })
  if (!tenant) notFound()

  // Si reservado es un bookingId (no "true"), buscar la reserva para mostrar
  // la tarjeta de éxito con CTA de WhatsApp.
  const esBookingIdValido = !!reservadoParam && reservadoParam !== "true" && reservadoParam.length > 10
  const bookingExitoso = esBookingIdValido
    ? await prisma.booking.findFirst({
        where: { id: reservadoParam, tenantId: tenant.id },
        include: { court: { select: { name: true, sport: true } } },
      })
    : null

  // Marca como EXPIRED las reservas PENDING que pasaron su expiresAt sin pagar.
  // Esto libera los slots automáticamente sin necesidad de cron.
  await prisma.booking.updateMany({
    where: {
      tenantId: tenant.id,
      status: "PENDING",
      expiresAt: { lt: new Date(), not: null },
    },
    data: { status: "EXPIRED" },
  })

  const [reservas, bookingsHoy, bloqueos, bloqueosHoy] = await Promise.all([
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicio, lte: fin },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { courtId: true, startTime: true },
    }),
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicioHoy, lte: finHoy },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { courtId: true },
    }),
    prisma.courtBlock.findMany({
      where: {
        court: { tenantId: tenant.id },
        startTime: { lt: fin },
        endTime:   { gt: inicio },
      },
      select: { courtId: true, startTime: true, endTime: true },
    }),
    prisma.courtBlock.findMany({
      where: {
        court: { tenantId: tenant.id },
        startTime: { lt: finHoy },
        endTime:   { gt: inicioHoy },
      },
      select: { courtId: true, startTime: true, endTime: true },
    }),
  ])

  // ── Info del hero (basada en HOY real, no en la fecha del filtro) ──
  const ocupadosPorCanchaHoy = new Map<string, number>()
  bookingsHoy.forEach((b) => {
    ocupadosPorCanchaHoy.set(b.courtId, (ocupadosPorCanchaHoy.get(b.courtId) ?? 0) + 1)
  })
  bloqueosHoy.forEach((b) => {
    const endM   = b.endTime.getUTCMinutes()
    const startH = b.startTime.getUTCHours()
    const endH   = endM >= 59 ? b.endTime.getUTCHours() + 1 : b.endTime.getUTCHours()
    const horasBloqueadas = Math.max(0, endH - startH)
    ocupadosPorCanchaHoy.set(b.courtId, (ocupadosPorCanchaHoy.get(b.courtId) ?? 0) + horasBloqueadas)
  })

  const schedulesHoy = tenant.courts.flatMap((c) => {
    const s = c.schedules.find((s) => s.dayOfWeek === diaSemana)
    return s ? [s] : []
  })

  const horarioHoy = schedulesHoy.length > 0
    ? {
        apertura: schedulesHoy.reduce((min, s) => (s.openTime < min ? s.openTime : min), schedulesHoy[0].openTime),
        cierre:   schedulesHoy.reduce((max, s) => (s.closeTime > max ? s.closeTime : max), schedulesHoy[0].closeTime),
      }
    : null

  const turnosLibresHoy = tenant.courts.reduce((sum, c) => {
    const sch = c.schedules.find((s) => s.dayOfWeek === diaSemana)
    if (!sch) return sum
    const total = generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).length
    const ocupados = ocupadosPorCanchaHoy.get(c.id) ?? 0
    return sum + Math.max(0, total - ocupados)
  }, 0)

  // ── Data para la grilla ──
  const canchasData = tenant.courts.map((c) => ({
    id: c.id,
    name: c.name,
    sport: c.sport as string,
    pricePerHour: Number(c.pricePerHour),
    schedules: c.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      openTime: s.openTime,
      closeTime: s.closeTime,
      slotMinutes: s.slotMinutes,
    })),
  }))

  const reservasData = reservas.map((r) => ({
    courtId: r.courtId,
    hora: `${String(r.startTime.getUTCHours()).padStart(2, "0")}:${String(r.startTime.getUTCMinutes()).padStart(2, "0")}`,
  }))

  // Expandir bloqueos a un slot por hora (la grilla los trata como "ocupados")
  const bloqueosData = bloqueos.flatMap(b => {
    const horas: { courtId: string; hora: string }[] = []
    const startH = b.startTime.getUTCHours()
    const endH   = b.endTime.getUTCHours()
    const endM   = b.endTime.getUTCMinutes()
    // Si endTime es 23:59 lo tratamos como hasta fin de día
    const limiteH = endM >= 59 ? endH + 1 : endH
    for (let h = startH; h < limiteH; h++) {
      horas.push({ courtId: b.courtId, hora: `${String(h).padStart(2, "0")}:00` })
    }
    return horas
  })

  const reservasYBloqueos = [...reservasData, ...bloqueosData]

  const deportesDisponibles = [...new Set(tenant.courts.map((c) => c.sport as string))]

  // Armar datos para el success card si corresponde
  let successCardProps: React.ComponentProps<typeof BookingSuccessCard> | null = null
  if (bookingExitoso) {
    const paidOnline = bookingExitoso.status === "CONFIRMED" && !!bookingExitoso.mpPaymentId
    const desglose = calcularDesglose(Number(bookingExitoso.totalPrice), tenant.mpSenaPercentage)
    const desgloseParaUi = paidOnline && desglose.esSeña ? desglose : null

    const mensaje = buildMensajeReserva({
      clienteNombre: bookingExitoso.guestName ?? "Cliente",
      clubNombre: tenant.name,
      canchaName: bookingExitoso.court.name,
      sport: sportLabel(bookingExitoso.court.sport as string),
      startTime: bookingExitoso.startTime,
      endTime: bookingExitoso.endTime,
      precio: Number(bookingExitoso.totalPrice),
      paidOnline,
      desglose: desgloseParaUi,
    })
    const whatsappUrl = tenant.whatsappNumber ? buildWhatsappUrl(tenant.whatsappNumber, mensaje) : null
    successCardProps = {
      clubNombre: tenant.name,
      canchaName: bookingExitoso.court.name,
      sport: sportLabel(bookingExitoso.court.sport as string),
      fechaTexto: formatFechaLarga(bookingExitoso.startTime),
      horaInicio: formatHoraUtc(bookingExitoso.startTime),
      horaFin: formatHoraUtc(bookingExitoso.endTime),
      precio: Number(bookingExitoso.totalPrice),
      paidOnline,
      estadoConfirmado: bookingExitoso.status === "CONFIRMED",
      whatsappUrl,
      desglose: desgloseParaUi,
    }
  }

  return (
    <main className="min-h-screen bg-toxic-gradient text-white relative overflow-x-hidden">

      {/* Tarjeta de éxito post-pago (con CTA WhatsApp) o toast simple */}
      {successCardProps ? <BookingSuccessCard {...successCardProps} /> : <ConfirmationToast />}

      {/* ── ORBS DE FONDO (sutiles) ───────────────────────── */}
      <div
        className="animate-orb pointer-events-none fixed -left-[120px] -top-[120px] w-[420px] h-[420px] sm:-left-[200px] sm:-top-[200px] sm:w-[800px] sm:h-[800px] rounded-full opacity-50 sm:opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(163,255,18,0.22) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="animate-orb-alt pointer-events-none fixed -right-[120px] -bottom-[120px] w-[420px] h-[420px] sm:-right-[200px] sm:-bottom-[200px] sm:w-[700px] sm:h-[700px] rounded-full opacity-60 sm:opacity-90"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.24) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />

      {/* ── HERO COMPACTO — identidad del club ─────────────── */}
      <section className="relative z-10">
        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-8 sm:pt-20 sm:pb-12">

          {/* Nombre del club */}
          <h1
            className="font-display font-black uppercase text-white leading-[0.9] tracking-tight"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
              animation: "fadeInUp 0.5s ease 0.1s both",
            }}
          >
            {tenant.name}
          </h1>

          {tenant.description && (
            <p
              className="text-white/40 text-sm sm:text-base mt-3 max-w-xl leading-relaxed"
              style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}
            >
              {tenant.description}
            </p>
          )}

          {/* Separador lime */}
          <div
            className="separator-lime mt-6 max-w-32"
            style={{ animation: "fadeIn 0.5s ease 0.3s both" }}
          />

          {/* Info row */}
          <div
            className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-white/40"
            style={{ animation: "fadeInUp 0.5s ease 0.35s both" }}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {horarioHoy
                ? `Abierto hoy ${horarioHoy.apertura} – ${horarioHoy.cierre}`
                : "Cerrado hoy"}
            </span>
            <span className="text-white/20" aria-hidden>·</span>
            <span>
              {turnosLibresHoy > 0
                ? `${turnosLibresHoy} turnos disponibles`
                : "Sin turnos hoy"}
            </span>
          </div>
        </div>
      </section>

      {/* ── GRILLA DE RESERVAS ─────────────────────────────── */}
      <div className="relative z-10">
        <GrillaReservas
          slug={slug}
          canchas={canchasData}
          reservas={reservasYBloqueos}
          fecha={fecha}
          deporte={deporte}
          deportesDisponibles={deportesDisponibles}
          isLoggedIn={!!session?.user}
        />
      </div>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 text-center">
        <div className="separator-subtle max-w-xs mx-auto mb-6" />
        <a href="/" className="inline-block">
          <img
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            className="h-5 w-auto opacity-30 hover:opacity-60 transition-opacity"
          />
        </a>
        <p className="text-white/20 text-[10px] tracking-widest uppercase mt-3">
          Reservas deportivas
        </p>
      </footer>

    </main>
  )
}
