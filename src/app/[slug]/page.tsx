import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ArrowRight, Clock, CheckCircle, ChevronDown } from "lucide-react"
import { SportIcon } from "@/components/ui/sport-icon"
import { SportPills } from "@/components/landing/sport-pills"
import { HeroTitle } from "@/components/landing/hero-title"
import { generarSlots } from "@/lib/slots"
import { getSport, sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reservado?: string }>
}

function sectionId(sport: string) {
  return `seccion-${sport.toLowerCase().replace(/_/g, "-")}`
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { reservado } = await searchParams

  const hoyAr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())
  const diaSemana = new Date(hoyAr + "T12:00:00Z").getUTCDay()
  const inicio = new Date(`${hoyAr}T00:00:00.000Z`)
  const fin = new Date(`${hoyAr}T23:59:59.999Z`)

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      courts: {
        where: { isActive: true },
        include: { schedules: true },
        orderBy: { name: "asc" },
      },
    },
  })
  if (!tenant) notFound()

  const bookingsHoy = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: inicio, lte: fin },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { courtId: true },
  })

  const ocupadosPorCancha = new Map<string, number>()
  bookingsHoy.forEach((b) => {
    ocupadosPorCancha.set(b.courtId, (ocupadosPorCancha.get(b.courtId) ?? 0) + 1)
  })

  function disponibleHoy(
    courtId: string,
    schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[]
  ) {
    const sch = schedules.find((s) => s.dayOfWeek === diaSemana)
    if (!sch) return false
    const totalSlots = generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes).length
    const ocupados = ocupadosPorCancha.get(courtId) ?? 0
    return totalSlots > 0 && ocupados < totalSlots
  }

  const sportMap = new Map<string, typeof tenant.courts>()
  for (const court of tenant.courts) {
    const arr = sportMap.get(court.sport) ?? []
    arr.push(court)
    sportMap.set(court.sport, arr)
  }
  const grupos = [...sportMap.entries()].map(([sport, canchas]) => ({
    sport,
    titulo: sportLabel(sport),
    canchas,
  }))

  // Datos para el hero — horario de hoy + turnos libres
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
    const ocupados = ocupadosPorCancha.get(c.id) ?? 0
    return sum + Math.max(0, total - ocupados)
  }, 0)

  return (
    <main className="min-h-screen bg-[#0C0E14] text-white relative overflow-x-hidden">

      {/* ── ORBS DE FONDO (mesh gradient) ─────────────────── */}
      <div
        className="animate-orb pointer-events-none fixed -left-[120px] -top-[120px] w-[420px] h-[420px] sm:-left-[200px] sm:-top-[200px] sm:w-[800px] sm:h-[800px] rounded-full opacity-50 sm:opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="animate-orb-alt pointer-events-none fixed -right-[120px] -bottom-[120px] w-[420px] h-[420px] sm:-right-[200px] sm:-bottom-[200px] sm:w-[700px] sm:h-[700px] rounded-full opacity-50 sm:opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 60%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full opacity-60 sm:opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(202,255,0,0.04) 0%, transparent 55%)",
          filter: "blur(90px)",
        }}
      />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 min-h-dvh flex flex-col items-center justify-center">
        <div className="bg-court-lines absolute inset-0 pointer-events-none opacity-50" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0C0E14] to-transparent pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 py-12 text-center">

          {/* Brand — Pointix (a futuro: logo) */}
          <div
            className="mb-10"
            style={{ animation: "fadeIn 0.6s ease 0.1s both" }}
          >
            <span className="text-[#CAFF00] text-xs font-bold tracking-[0.45em] uppercase">
              Pointix
            </span>
          </div>

          {/* Nombre del complejo — animación letra a letra */}
          <div className="text-[clamp(2.5rem,8vw,9rem)] mb-10 overflow-hidden">
            <HeroTitle text={tenant.name} />
          </div>

          {tenant.description && (
            <p
              className="text-white/35 text-sm leading-relaxed max-w-xs mx-auto mb-10"
              style={{ animation: "fadeInUp 0.5s ease 0.8s both" }}
            >
              {tenant.description}
            </p>
          )}

          {/* CTA principal */}
          <div
            className="flex justify-center mb-10"
            style={{ animation: "fadeInUp 0.5s ease 0.85s both" }}
          >
            <Link
              href={`/${slug}/reservar`}
              className="btn-lime-glow inline-flex items-center gap-2 bg-[#CAFF00] hover:bg-[#d4ff1a] text-black font-bold text-base px-7 py-3.5 rounded-xl"
            >
              Reservar ahora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Separador lime */}
          <div className="separator-lime max-w-48 mx-auto mb-10" style={{ animation: "fadeIn 0.6s ease 0.6s both" }} />

          {/* Sport pills glassmorphism */}
          <div style={{ animation: "fadeInUp 0.5s ease 0.9s both" }}>
            <SportPills
              sports={grupos.map(({ sport, titulo }) => ({
                sport,
                label: titulo,
                emoji: getSport(sport).emoji,
              }))}
            />
          </div>

          {/* Info row — horario y turnos libres */}
          <div
            className="mt-8 flex items-center justify-center gap-2 text-xs text-white/40"
            style={{ animation: "fadeInUp 0.5s ease 1s both" }}
          >
            <Clock className="w-3 h-3 shrink-0" />
            <span>
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

        {/* Flecha indicadora — bajar a canchas */}
        <a
          href="#canchas"
          aria-label="Ir a las canchas"
          className="animate-float-hint absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-[#CAFF00]/80 hover:text-[#CAFF00] transition-colors"
        >
          <ChevronDown className="w-5 h-5 opacity-30 -mb-2" />
          <ChevronDown className="w-5 h-5 opacity-60 -mb-2" />
          <ChevronDown className="w-5 h-5 opacity-100" />
        </a>
      </section>

      {/* ── BANNER DE CONFIRMACIÓN ──────────────────────── */}
      {reservado && (
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-6">
          <div className="glass-card flex items-center gap-3 text-[#CAFF00] rounded-2xl px-5 py-4 text-sm font-semibold glow-lime">
            <CheckCircle className="w-4 h-4 shrink-0" />
            ¡Reserva confirmada! Nos vemos en la cancha.
          </div>
        </div>
      )}

      {/* ── CANCHAS ─────────────────────────────────────── */}
      <section id="canchas" className="relative z-10 max-w-4xl mx-auto px-6 py-20 space-y-20">

        {tenant.courts.length === 0 ? (
          <p className="text-white/30 font-medium">No hay canchas disponibles por el momento.</p>
        ) : (
          <>
            {/* Título sección */}
            <div style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}>
              <h2 className="font-display text-[clamp(3rem,8vw,5rem)] font-black uppercase text-white leading-none tracking-tight">
                Nuestras<br />canchas
              </h2>
              <div className="separator-lime mt-5 max-w-36" />
            </div>

            {grupos.map(({ titulo, sport, canchas }) => (
              <div key={sport} id={sectionId(sport)} className="space-y-6">

                {/* Cabecera de sección */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg glass-nav">
                      <SportIcon sport={sport} size={18} />
                    </div>
                    <h3 className="font-display text-2xl font-black uppercase text-white leading-none">
                      {titulo}
                    </h3>
                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border bg-white/[0.06] text-white/50 border-white/[0.1]">
                      {canchas.length} {canchas.length === 1 ? "cancha" : "canchas"}
                    </span>
                  </div>
                  <Link
                    href={`/${slug}/reservar?deporte=${sport}`}
                    className="btn-lime-glow shrink-0 flex items-center gap-1.5 bg-[#CAFF00] hover:bg-[#d4ff1a] text-black font-bold text-sm px-4 py-2 rounded-xl ml-4"
                  >
                    Reservar <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Grid de cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {canchas.map((court) => {
                    const schHoy = court.schedules.find((s) => s.dayOfWeek === diaSemana)
                    const horario = schHoy ?? court.schedules[0]
                    const libre = disponibleHoy(court.id, court.schedules)
                    const sportInfo = getSport(court.sport)

                    return (
                      <div
                        key={court.id}
                        className="card-float glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden"
                      >
                        {/* Emoji watermark */}
                        {sportInfo.emoji && (
                          <span className="absolute -right-2 -top-4 text-[6.5rem] opacity-[0.07] select-none pointer-events-none leading-none">
                            {sportInfo.emoji}
                          </span>
                        )}

                        {/* Badge disponibilidad */}
                        <span
                          className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            libre
                              ? "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25 badge-available-pulse"
                              : "bg-white/[0.04] text-white/25 border-white/[0.06]"
                          }`}
                        >
                          {libre ? "● Disponible hoy" : "Sin turnos hoy"}
                        </span>

                        {/* Nombre */}
                        <p className="font-display text-xl font-black uppercase text-white leading-tight">
                          {court.name}
                        </p>

                        {/* Precio con glow */}
                        <div className="flex items-baseline gap-1.5">
                          <span className={`font-display text-[2.2rem] font-black leading-none ${libre ? "text-[#CAFF00] text-glow-lime" : "text-[#CAFF00]"}`}>
                            ${Number(court.pricePerHour).toLocaleString("es-AR")}
                          </span>
                          <span className="text-white/25 text-sm">/ hora</span>
                        </div>

                        {/* Horario */}
                        {horario && (
                          <p className="text-white/30 text-xs flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {horario.openTime} — {horario.closeTime}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="relative z-10 py-10 text-center">
        <div className="separator-subtle max-w-xs mx-auto mb-8" />
        <p className="text-white/15 text-xs tracking-widest uppercase">
          Pointix · Reservas deportivas
        </p>
      </footer>

    </main>
  )
}
