import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { obtenerSlotsOcupados } from "@/actions/reservas"
import { generarSlots } from "@/lib/slots"
import { ReservaForm } from "@/components/booking/reserva-form"
import { sportLabel } from "@/lib/sports"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
  searchParams: Promise<{ fecha?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug, courtId } = await params
  const { fecha } = await searchParams

  const session = await auth()
  const isLoggedIn = !!session?.user

  const cancha = await prisma.court.findFirst({
    where: { id: courtId, isActive: true, archivedAt: null, tenant: { slug } },
    include: { tenant: true, schedules: true },
  })
  if (!cancha) notFound()

  const fechaSeleccionada = fecha ?? new Date().toISOString().split("T")[0]

  const [year, month, day] = fechaSeleccionada.split("-").map(Number)
  const diaSemana = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const schedule = cancha.schedules.find((s) => s.dayOfWeek === diaSemana) ?? null

  const todosLosSlots = schedule
    ? generarSlots(schedule.openTime, schedule.closeTime, schedule.slotMinutes)
    : []

  const slotsOcupados = await obtenerSlotsOcupados(courtId, fechaSeleccionada)
  const slotsDisponibles = todosLosSlots.filter((s) => !slotsOcupados.includes(s))

  return (
    <main className="min-h-screen bg-[#0C0E14] relative">
      <div
        className="pointer-events-none fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(163,255,18,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)" }}
      />
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver a {cancha.tenant.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-1">
          <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight">Reservar — {cancha.name}</h1>
        </div>
        <p className="text-sm text-white/40 mt-0.5">
          {sportLabel(cancha.sport)} ·{" "}
          <span className="text-[#A3FF12]/70 font-semibold">${Number(cancha.pricePerHour).toLocaleString("es-AR")}</span> / hora
        </p>
      </header>

      <section className="relative z-10 max-w-lg mx-auto p-6">
        <ReservaForm
          courtId={courtId}
          slug={slug}
          fechaSeleccionada={fechaSeleccionada}
          todosLosSlots={todosLosSlots}
          slotsDisponibles={slotsDisponibles}
          slotsOcupados={slotsOcupados}
          isLoggedIn={isLoggedIn}
          canchaAbierta={!!schedule}
          diasAbiertos={cancha.schedules.map((s) => s.dayOfWeek)}
        />
      </section>
    </main>
  )
}
