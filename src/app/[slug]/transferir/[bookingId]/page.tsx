import { notFound } from "next/navigation"
import Link from "next/link"
import { AlertCircle, CalendarDays, CheckCircle2, Clock, MessageCircle, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { calcularDesglose } from "@/lib/pricing"
import { buildWhatsappUrl } from "@/lib/whatsapp"
import { CopyField } from "@/components/booking/copy-field"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string; bookingId: string }>
}

const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

// startTime/endTime están en convención "AR guardado como UTC"
function formatFecha(d: Date) {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`
}
function formatHora(d: Date) {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}
// expiresAt es un instante real (UTC de verdad): se muestra en hora AR
function horaLimiteAr(d: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d)
}
function pesos(n: number) {
  return `$${n.toLocaleString("es-AR")}`
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-toxic-gradient text-white px-4 py-8 sm:py-12 flex justify-center">
      <div className="w-full max-w-md space-y-5">{children}</div>
    </main>
  )
}

/**
 * Pantalla post-reserva cuando la seña se paga por transferencia: datos del
 * alias para copiar, monto exacto y botón para mandar el comprobante por
 * WhatsApp al club. El club confirma la reserva desde su panel.
 */
export default async function TransferirPage({ params }: Props) {
  const { slug, bookingId } = await params

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenant: { slug } },
    include: {
      court: { select: { name: true } },
      user: { select: { name: true } },
      tenant: {
        select: {
          name: true, address: true, whatsappNumber: true, mpSenaPercentage: true,
          transferAlias: true, transferCbu: true, transferHolder: true, transferBank: true,
        },
      },
    },
  })
  if (!booking || booking.paymentMethod !== "TRANSFER") notFound()

  const t = booking.tenant
  const vencida =
    booking.status === "EXPIRED" ||
    booking.status === "CANCELLED" ||
    (booking.status === "PENDING" && !!booking.expiresAt && booking.expiresAt < new Date())

  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    return (
      <Tarjeta>
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-[#A3FF12] mx-auto" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">¡Reserva confirmada!</h1>
          <p className="text-white/65">
            {t.name} recibió tu transferencia. Te esperamos el {formatFecha(booking.startTime)} a las {formatHora(booking.startTime)}.
          </p>
          <Link href={`/${slug}`} className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-5 py-3 rounded-xl">
            Volver al complejo
          </Link>
        </div>
      </Tarjeta>
    )
  }

  if (vencida) {
    return (
      <Tarjeta>
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">Reserva vencida</h1>
          <p className="text-white/65">
            Pasó el tiempo para confirmar la transferencia y el turno se liberó. Si ya transferiste, escribile al complejo.
          </p>
          <Link href={`/${slug}`} className="btn-lime-glow inline-flex bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold px-5 py-3 rounded-xl">
            Elegir otro turno
          </Link>
        </div>
      </Tarjeta>
    )
  }

  const desglose = calcularDesglose(Number(booking.totalPrice), t.mpSenaPercentage)
  const cliente = booking.guestName ?? booking.user?.name ?? ""
  const mensaje = [
    `Hola ${t.name}! Reservé un turno por Pointix y te mando el comprobante de la transferencia.`,
    ``,
    `*Cancha:* ${booking.court.name}`,
    `*Día:* ${formatFecha(booking.startTime)}`,
    `*Hora:* ${formatHora(booking.startTime)} a ${formatHora(booking.endTime)}`,
    cliente ? `*A nombre de:* ${cliente}` : null,
    `*${desglose.esSeña ? "Seña" : "Monto"} transferido:* ${pesos(desglose.online)}`,
  ].filter((l) => l !== null).join("\n")
  const waUrl = t.whatsappNumber ? buildWhatsappUrl(t.whatsappNumber, mensaje) : null

  return (
    <Tarjeta>
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-[#A3FF12] uppercase tracking-wider">Turno apartado</p>
        <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
          Transferí para confirmar
        </h1>
        {booking.expiresAt && (
          <p className="text-white/65">
            Te guardamos el turno hasta las <span className="font-bold text-white">{horaLimiteAr(booking.expiresAt)} hs</span>.
          </p>
        )}
      </div>

      {/* Resumen del turno */}
      <div className="glass-card rounded-2xl p-5 space-y-2 text-sm">
        <p className="text-base font-bold text-white">{t.name} · {booking.court.name}</p>
        <p className="flex items-center gap-2 text-white/70">
          <CalendarDays className="w-4 h-4 text-white/45 shrink-0" />
          <span className="first-letter:uppercase">{formatFecha(booking.startTime)}</span>
        </p>
        <p className="flex items-center gap-2 text-white/70">
          <Clock className="w-4 h-4 text-white/45 shrink-0" />
          {formatHora(booking.startTime)} a {formatHora(booking.endTime)} hs
        </p>
        {t.address && (
          <p className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4 text-white/45 shrink-0" />
            {t.address}
          </p>
        )}
      </div>

      {/* Paso 1: transferir */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <span className="w-6 h-6 rounded-full bg-[#A3FF12] text-black text-sm font-black flex items-center justify-center">1</span>
          Transferí {desglose.esSeña ? "la seña" : "el total"}
        </h2>
        <CopyField label={desglose.esSeña ? `Seña (${desglose.porcentajeSeña}%)` : "Monto"} valor={pesos(desglose.online)} copiar={String(desglose.online)} destacado />
        {t.transferAlias && <CopyField label="Alias" valor={t.transferAlias} />}
        {t.transferCbu && <CopyField label="CBU / CVU" valor={t.transferCbu} />}
        {(t.transferHolder || t.transferBank) && (
          <p className="text-sm text-white/60 px-1">
            {t.transferHolder && <>A nombre de <span className="font-semibold text-white/85">{t.transferHolder}</span></>}
            {t.transferHolder && t.transferBank && " · "}
            {t.transferBank}
          </p>
        )}
        {desglose.esSeña && (
          <p className="text-sm text-white/60 px-1">
            El resto (<span className="font-semibold text-white/85">{pesos(desglose.enComplejo)}</span>) lo pagás en el complejo.
          </p>
        )}
      </section>

      {/* Paso 2: comprobante */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <span className="w-6 h-6 rounded-full bg-[#A3FF12] text-black text-sm font-black flex items-center justify-center">2</span>
          Mandá el comprobante
        </h2>
        <p className="text-sm text-white/65">
          Se abre WhatsApp con los datos de tu reserva. Adjuntá la captura de la transferencia y enviala.
        </p>
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-base rounded-xl px-5 py-3.5 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar comprobante por WhatsApp
          </a>
        )}
      </section>

      <p className="text-sm text-white/55 text-center px-2">
        Cuando el complejo confirme el pago, tu reserva queda confirmada
        {booking.guestEmail ? " y te llega un mail" : ""}. Podés volver a esta página para ver el estado.
      </p>
    </Tarjeta>
  )
}
