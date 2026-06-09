import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { crearPreferenciaParaReserva } from "@/actions/mp"
import { AlertCircle, Clock, CalendarDays, Loader2 } from "lucide-react"
import { nowInArAsArtificialUtc } from "@/lib/timezone"

interface Props {
  params: Promise<{ slug: string; bookingId: string }>
  searchParams: Promise<{ status?: string }>
}

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFecha(d: Date) {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}
function formatHora(d: Date) {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

export default async function PagarPage({ params, searchParams }: Props) {
  const { slug, bookingId } = await params
  const { status } = await searchParams

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, mpAccessToken: true },
  })
  if (!tenant) notFound()

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: tenant.id },
    include: { court: { select: { name: true } } },
  })
  if (!booking) notFound()

  // Si la reserva no está más en PENDING, ya fue resuelta
  if (booking.status === "CONFIRMED") {
    redirect(`/${slug}?reservado=true`)
  }

  // Estados terminales que no se pueden pagar
  if (booking.status === "CANCELLED" || booking.status === "EXPIRED" || booking.status === "NO_SHOW") {
    return (
      <main className="min-h-screen bg-toxic-gradient text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">
            Reserva no disponible
          </h1>
          <p className="text-white/55 text-sm">
            Esta reserva expiró o fue cancelada. Volvé y elegí otro horario.
          </p>
          <Link
            href={`/${slug}`}
            className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-5 py-2.5 rounded-xl"
          >
            Volver a reservar
          </Link>
        </div>
      </main>
    )
  }

  // Si el complejo no tiene MP configurado, redirigir con mensaje
  if (!tenant.mpAccessToken) {
    return (
      <main className="min-h-screen bg-toxic-gradient text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">
            Pago en el complejo
          </h1>
          <p className="text-white/55 text-sm">
            Este complejo no acepta pagos online. Tu reserva está confirmada — pagás al llegar.
          </p>
          <Link
            href={`/${slug}`}
            className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-5 py-2.5 rounded-xl"
          >
            Volver al complejo
          </Link>
        </div>
      </main>
    )
  }

  // Si el slot ya pasó o la reserva expiró por tiempo, libera el slot
  if (booking.expiresAt && booking.expiresAt < nowInArAsArtificialUtc()) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } })
    redirect(`/${slug}/pagar/${booking.id}`)
  }

  // Si vino con ?status=failure desde MP
  if (status === "failure") {
    return (
      <main className="min-h-screen bg-toxic-gradient text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">
            Pago no completado
          </h1>
          <p className="text-white/55 text-sm">
            Tu reserva sigue apartada por unos minutos más. Reintentá el pago.
          </p>
          <div className="glass-nav rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/65">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatFecha(booking.startTime)}
            </div>
            <div className="flex items-center gap-2 text-white/65">
              <Clock className="w-3.5 h-3.5" />
              {formatHora(booking.startTime)} — {formatHora(booking.endTime)}
            </div>
            <p className="text-white/40 text-xs pt-1">{booking.court.name}</p>
          </div>
          <RetryPagoButton slug={slug} bookingId={booking.id} />
        </div>
      </main>
    )
  }

  // Si vino con ?status=pending desde MP (efectivo, RapiPago, etc.)
  if (status === "pending") {
    return (
      <main className="min-h-screen bg-toxic-gradient text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/25 flex items-center justify-center mx-auto">
            <Loader2 className="w-5 h-5 text-[#00E5FF] animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight">
            Pago en proceso
          </h1>
          <p className="text-white/55 text-sm leading-relaxed">
            Tu pago se está acreditando. En cuanto se confirme, recibís el comprobante por mail y la reserva queda lista.
          </p>
          <div className="glass-nav rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/65">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatFecha(booking.startTime)}
            </div>
            <div className="flex items-center gap-2 text-white/65">
              <Clock className="w-3.5 h-3.5" />
              {formatHora(booking.startTime)} — {formatHora(booking.endTime)}
            </div>
            <p className="text-white/40 text-xs pt-1">{booking.court.name}</p>
          </div>
          <Link
            href={`/${slug}`}
            className="text-xs text-white/50 hover:text-white inline-block"
          >
            ← Volver al complejo
          </Link>
        </div>
      </main>
    )
  }

  // Crear la preference y redirigir al Checkout de MP
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"

  try {
    const { initPoint } = await crearPreferenciaParaReserva(booking.id, appUrl)
    redirect(initPoint)
  } catch (err) {
    // Si hubo error creando la preference, mostrar pantalla con retry
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err
    const mensaje = err instanceof Error ? err.message : "Error inesperado"
    return (
      <main className="min-h-screen bg-toxic-gradient text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="font-display text-xl font-black uppercase tracking-tight">
            No pudimos generar el pago
          </h1>
          <p className="text-white/55 text-sm">{mensaje}</p>
          <div className="glass-nav rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex items-center gap-2 text-white/65">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatFecha(booking.startTime)}
            </div>
            <div className="flex items-center gap-2 text-white/65">
              <Clock className="w-3.5 h-3.5" />
              {formatHora(booking.startTime)} — {formatHora(booking.endTime)}
            </div>
            <p className="text-white/40 text-xs pt-1">{booking.court.name}</p>
          </div>
          <Link
            href={`/${slug}`}
            className="text-xs text-white/50 hover:text-white inline-block"
          >
            ← Volver al complejo
          </Link>
        </div>
      </main>
    )
  }
}

// Botón cliente que recarga la página para volver a crear la Preference
function RetryPagoButton({ slug, bookingId }: { slug: string; bookingId: string }) {
  return (
    <Link
      href={`/${slug}/pagar/${bookingId}`}
      className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-5 py-2.5 rounded-xl"
    >
      Reintentar pago
    </Link>
  )
}
