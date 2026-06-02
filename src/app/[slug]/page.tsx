import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { CalendarCheck, Clock, ArrowRight } from "lucide-react"
import { SportIcon } from "@/components/ui/sport-icon"
import { SportPills } from "@/components/landing/sport-pills"
import { generarSlots } from "@/lib/slots"
import { getSport, sportLabel } from "@/lib/sports"

function sectionId(sport: string) {
  return `seccion-${sport.toLowerCase().replace(/_/g, "-")}`
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ reservado?: string }>
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

  // Agrupar canchas por deporte, manteniendo el orden de aparición
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
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border-b">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center space-y-4">
          <div className="flex justify-center mb-2">
            <CalendarCheck className="w-10 h-10 text-gray-800" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{tenant.name}</h1>
          {tenant.description && (
            <p className="text-base font-medium text-gray-500">{tenant.description}</p>
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

      <section className="max-w-4xl mx-auto p-6 mt-8 space-y-8">

        {reservado && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm font-medium">
            ¡Reserva confirmada! Nos vemos en la cancha.
          </div>
        )}

        {tenant.courts.length === 0 ? (
          <p className="text-gray-500 font-medium">No hay canchas disponibles por el momento.</p>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900">Nuestras canchas</h2>

            {grupos.map(({ titulo, sport, canchas }) => (
              <div key={sport} id={sectionId(sport)} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getSport(sport).badgeClass}`}>
                      {canchas.length} {canchas.length === 1 ? "cancha" : "canchas"}
                    </span>
                  </div>
                  <Link
                    href={`/${slug}/reservar?deporte=${sport}`}
                    className="inline-flex items-center gap-1.5 border border-gray-900 text-gray-900 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors"
                  >
                    Reservar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {canchas.map((court) => {
                    const schHoy = court.schedules.find((s) => s.dayOfWeek === diaSemana)
                    const horario = schHoy ?? court.schedules[0]
                    const libre = disponibleHoy(court.id, court.schedules)

                    return (
                      <div key={court.id} className="bg-white rounded-lg border p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <SportIcon sport={court.sport} />
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                            libre
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}>
                            {libre ? "Disponible hoy" : "Sin turnos hoy"}
                          </span>
                        </div>

                        <p className="font-semibold text-gray-900 text-lg">{court.name}</p>

                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(court.pricePerHour).toLocaleString("es-AR")}
                          <span className="text-sm font-medium text-gray-400 ml-1">/ hora</span>
                        </p>

                        {horario && (
                          <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {horario.openTime} - {horario.closeTime}
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
    </main>
  )
}
