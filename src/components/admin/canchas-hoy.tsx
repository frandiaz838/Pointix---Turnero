import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { generarSlots } from "@/lib/slots"
import { sportLabel } from "@/lib/sports"
import { SportIcon } from "@/components/ui/sport-icon"
import { SectionTitle } from "@/components/admin/page-header"
import { todayInArIso, todayInArDayOfWeek, nowInArAsArtificialUtc } from "@/lib/timezone"

interface Props {
  tenantId: string
  slug: string
}

type EstadoCancha =
  | { tipo: "cerrada" }
  | { tipo: "completa" }
  | { tipo: "terminada" }
  | { tipo: "libre"; desde: string }

// Minutos desde medianoche de un Date en convención "AR guardado como UTC".
function minutosDelDia(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes()
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/**
 * "Tus canchas hoy": foto rápida de cada cancha activa — turnos reservados
 * sobre el total del día y el próximo turno libre. Agrupado por deporte.
 */
export async function CanchasHoy({ tenantId, slug }: Props) {
  const hoy = todayInArIso()
  const inicio = new Date(`${hoy}T00:00:00.000Z`)
  const fin = new Date(`${hoy}T23:59:59.999Z`)
  const diaSemana = todayInArDayOfWeek()
  const ahora = minutosDelDia(nowInArAsArtificialUtc())

  const [canchas, reservas, bloqueos] = await Promise.all([
    prisma.court.findMany({
      where: { tenantId, isActive: true, archivedAt: null },
      select: { id: true, name: true, sport: true, schedules: { where: { dayOfWeek: diaSemana } } },
      orderBy: [{ sport: "asc" }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: { tenantId, startTime: { gte: inicio, lte: fin }, status: { in: ["PENDING", "CONFIRMED"] } },
      select: { courtId: true, startTime: true, endTime: true },
    }),
    prisma.courtBlock.findMany({
      where: { court: { tenantId }, startTime: { lte: fin }, endTime: { gte: inicio } },
      select: { courtId: true, startTime: true, endTime: true },
    }),
  ])

  if (canchas.length === 0) return null

  const datos = canchas.map((c) => {
    const sch = c.schedules[0]
    if (!sch) return { ...c, total: 0, reservados: 0, estado: { tipo: "cerrada" } as EstadoCancha }

    const slots = generarSlots(sch.openTime, sch.closeTime, sch.slotMinutes)
    // Un bloqueo de otro día que cruza medianoche se recorta al día de hoy.
    const rango = (r: { startTime: Date; endTime: Date }) => ({
      ini: r.startTime < inicio ? 0 : minutosDelDia(r.startTime),
      fin: r.endTime > fin ? 24 * 60 : minutosDelDia(r.endTime),
    })
    const misReservas = reservas.filter((r) => r.courtId === c.id).map(rango)
    const misBloqueos = bloqueos.filter((b) => b.courtId === c.id).map(rango)
    const pisa = (lista: { ini: number; fin: number }[], ini: number, finSlot: number) =>
      lista.some((r) => r.ini < finSlot && r.fin > ini)

    let reservados = 0
    let proximoLibre: string | null = null
    let quedanFuturos = false
    for (const s of slots) {
      const ini = aMinutos(s)
      const finSlot = ini + sch.slotMinutes
      const reservado = pisa(misReservas, ini, finSlot)
      if (reservado) reservados++
      if (ini >= ahora) {
        quedanFuturos = true
        if (!proximoLibre && !reservado && !pisa(misBloqueos, ini, finSlot)) proximoLibre = s
      }
    }

    const estado: EstadoCancha =
      proximoLibre ? { tipo: "libre", desde: proximoLibre }
      : quedanFuturos ? { tipo: "completa" }
      : { tipo: "terminada" }

    return { ...c, total: slots.length, reservados, estado }
  })

  const grupos = new Map<string, typeof datos>()
  for (const d of datos) grupos.set(d.sport, [...(grupos.get(d.sport) ?? []), d])

  return (
    <section className="space-y-4">
      <SectionTitle
        accion={
          <Link href={`/dashboard/${slug}/canchas`} className="text-sm font-semibold text-[#A3FF12] hover:underline">
            Gestionar →
          </Link>
        }
      >
        Tus canchas hoy
      </SectionTitle>

      <div className="space-y-5">
        {[...grupos.entries()].map(([sport, lista]) => (
          <div key={sport} className="space-y-2.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
              <SportIcon sport={sport} size={15} />
              {sportLabel(sport)}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((c) => {
                const pct = c.total > 0 ? Math.round((c.reservados / c.total) * 100) : 0
                const cerrada = c.estado.tipo === "cerrada"
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/${slug}/reservas`}
                      className={`block glass-card rounded-2xl p-4 space-y-3 transition-colors hover:bg-white/[0.06] ${cerrada ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-base font-bold text-white truncate">{c.name}</p>
                        {!cerrada && (
                          <p className="text-sm text-white/60 tabular-nums shrink-0">
                            <span className="font-bold text-white">{c.reservados}</span> de {c.total}
                          </p>
                        )}
                      </div>

                      <div
                        className="h-2 rounded-full bg-white/[0.07] overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${c.reservados} de ${c.total} turnos reservados`}
                      >
                        <div className="h-full rounded-full bg-[#A3FF12]" style={{ width: `${pct}%` }} />
                      </div>

                      <p className="text-sm">
                        {c.estado.tipo === "cerrada" && <span className="text-white/50">Cerrada hoy</span>}
                        {c.estado.tipo === "completa" && <span className="font-semibold text-[#A3FF12]">Completa el resto del día</span>}
                        {c.estado.tipo === "terminada" && <span className="text-white/50">Terminó el día</span>}
                        {c.estado.tipo === "libre" && (
                          <span className="text-white/70">
                            Próximo turno libre: <span className="font-bold text-white tabular-nums">{c.estado.desde}</span>
                          </span>
                        )}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
