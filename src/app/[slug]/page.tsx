import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ArrowRight, Clock, CheckCircle } from "lucide-react"
import { SportIcon } from "@/components/ui/sport-icon"
import { SportPills } from "@/components/landing/sport-pills"
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

  function disponibleHoy(courtId: string, schedules: { dayOfWeek: number; openTime: string; closeTime: string; slotMinutes: number }[]) {
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

  return (
    <main className="min-h-screen bg-[#0C0E14] text-white">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        {/* Textura de líneas de cancha */}
        <div className="bg-court-lines absolute inset-0 pointer-events-none" />
        {/* Fade inferior */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0C0E14] to-transparent pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-6 py-20 text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 mb-7">
            <span className="w-6 h-px bg-[#CAFF00]/70" />
            <span className="text-[#CAFF00] text-[10px] font-bold tracking-[0.3em] uppercase">
              Turnero online
            </span>
            <span className="w-6 h-px bg-[#CAFF00]/70" />
          </div>

          {/* Nombre del complejo */}
          <h1 className="font-display font-black uppercase text-white leading-[0.87] tracking-tight mb-6 text-[clamp(2.8rem,11vw,7rem)]">
            {tenant.name}
          </h1>

          {tenant.description && (
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto mb-8">
              {tenant.description}
            </p>
          )}

          <SportPills
            sports={grupos.map(({ sport, titulo }) => ({
              sport,
              label: titulo,
              emoji: getSport(sport).emoji,
            }))}
          />
        </div>
      </section>

      {/* ── BANNER DE CONFIRMACIÓN ──────────────────────── */}
      {reservado && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="flex items-center gap-3 bg-[#CAFF00]/[0.08] border border-[#CAFF00]/25 text-[#CAFF00] rounded-xl px-5 py-4 text-sm font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            ¡Reserva confirmada! Nos vemos en la cancha.
          </div>
        </div>
      )}

      {/* ── CANCHAS ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-12 space-y-14">

        {tenant.courts.length === 0 ? (
          <p className="text-white/30 font-medium">No hay canchas disponibles por el momento.</p>
        ) : (
          <>
            <h2 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-black uppercase text-white leading-none tracking-tight">
              Nuestras<br />canchas
            </h2>

            {grupos.map(({ titulo, sport, canchas }) => (
              <div key={sport} id={sectionId(sport)} className="space-y-5">

                {/* Cabecera de sección */}
                <div className="flex items-center justify-between border-t border-white/[0.07] pt-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <SportIcon sport={sport} size={20} />
                    <h3 className="font-display text-2xl font-black uppercase text-white leading-none">
                      {titulo}
                    </h3>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${getSport(sport).badgeClassSolid}`}>
                      {canchas.length} {canchas.length === 1 ? "cancha" : "canchas"}
                    </span>
                  </div>
                  <Link
                    href={`/${slug}/reservar?deporte=${sport}`}
                    className="shrink-0 flex items-center gap-1.5 bg-[#CAFF00] hover:bg-[#d4ff1a] active:scale-95 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all ml-4"
                  >
                    Reservar <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Grid de cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canchas.map((court) => {
                    const schHoy = court.schedules.find((s) => s.dayOfWeek === diaSemana)
                    const horario = schHoy ?? court.schedules[0]
                    const libre = disponibleHoy(court.id, court.schedules)
                    const sportInfo = getSport(court.sport)

                    return (
                      <div
                        key={court.id}
                        className="relative overflow-hidden bg-[#14171F] border border-white/[0.07] hover:border-white/[0.15] rounded-xl p-5 space-y-4 transition-colors"
                      >
                        {/* Emoji de fondo decorativo */}
                        {sportInfo.emoji && (
                          <span className="absolute -right-1 -top-3 text-[5.5rem] opacity-[0.055] select-none pointer-events-none leading-none">
                            {sportInfo.emoji}
                          </span>
                        )}

                        {/* Badge disponibilidad */}
                        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          libre
                            ? "bg-[#CAFF00]/10 text-[#CAFF00] border-[#CAFF00]/25"
                            : "bg-white/[0.04] text-white/25 border-white/[0.07]"
                        }`}>
                          {libre ? "● Disponible hoy" : "Sin turnos hoy"}
                        </span>

                        {/* Nombre */}
                        <p className="font-display text-xl font-black uppercase text-white leading-tight">
                          {court.name}
                        </p>

                        {/* Precio */}
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-3xl font-black text-[#CAFF00] leading-none">
                            ${Number(court.pricePerHour).toLocaleString("es-AR")}
                          </span>
                          <span className="text-white/25 text-sm">/ hora</span>
                        </div>

                        {/* Horario */}
                        {horario && (
                          <p className="text-white/35 text-xs flex items-center gap-1.5">
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
      <footer className="border-t border-white/[0.06] py-8 text-center">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          Pointix · Reservas deportivas
        </p>
      </footer>

    </main>
  )
}
