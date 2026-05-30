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
    where: { id: courtId, isActive: true, tenant: { slug } },
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
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href={`/${slug}`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Volver a {cancha.tenant.name}
        </Link>
        <h1 className="text-xl font-bold mt-1">Reservar — {cancha.name}</h1>
        <p className="text-sm text-gray-500">
          {sportLabel(cancha.sport)} ·{" "}
          ${Number(cancha.pricePerHour).toLocaleString("es-AR")} / hora
        </p>
      </header>

      <section className="max-w-lg mx-auto p-6">
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
