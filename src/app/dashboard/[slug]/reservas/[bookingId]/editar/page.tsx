import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { PageHeader, PageBody } from "@/components/admin/page-header"
import { EditarReservaForm } from "@/components/admin/editar-reserva-form"

interface Props {
  params: Promise<{ slug: string; bookingId: string }>
}

export default async function EditarReservaPage({ params }: Props) {
  const { slug, bookingId } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const reserva = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: tenant.id },
  })
  if (!reserva) notFound()

  // Cancha + reservas/bloqueos para validar conflictos en el form
  const ahora = new Date()
  const en90dias = new Date(ahora)
  en90dias.setDate(ahora.getDate() + 90)

  const [canchas, reservasOcupando, bloqueos] = await Promise.all([
    prisma.court.findMany({
      where: { tenantId: tenant.id, isActive: true, archivedAt: null },
      include: { schedules: true },
      orderBy: [{ sport: "asc" }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { gte: ahora, lte: en90dias },
        // Excluimos esta misma reserva para no auto-bloquearla
        id: { not: bookingId },
      },
      select: { courtId: true, startTime: true },
    }),
    prisma.courtBlock.findMany({
      where: {
        court: { tenantId: tenant.id },
        endTime: { gte: ahora },
      },
      select: { courtId: true, startTime: true, endTime: true },
    }),
  ])

  const ocupacion: { courtId: string; fecha: string; hora: string }[] = []
  reservasOcupando.forEach(r => {
    const f = `${r.startTime.getUTCFullYear()}-${String(r.startTime.getUTCMonth() + 1).padStart(2, "0")}-${String(r.startTime.getUTCDate()).padStart(2, "0")}`
    const h = `${String(r.startTime.getUTCHours()).padStart(2, "0")}:00`
    ocupacion.push({ courtId: r.courtId, fecha: f, hora: h })
  })
  bloqueos.forEach(b => {
    const cursor = new Date(b.startTime)
    while (cursor < b.endTime) {
      const f = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`
      const h = `${String(cursor.getUTCHours()).padStart(2, "0")}:00`
      ocupacion.push({ courtId: b.courtId, fecha: f, hora: h })
      cursor.setUTCHours(cursor.getUTCHours() + 1)
    }
  })

  const fechaInicial = `${reserva.startTime.getUTCFullYear()}-${String(reserva.startTime.getUTCMonth() + 1).padStart(2, "0")}-${String(reserva.startTime.getUTCDate()).padStart(2, "0")}`
  const horaInicial  = `${String(reserva.startTime.getUTCHours()).padStart(2, "0")}:00`

  return (
    <PageBody angosto>
      <PageHeader
        titulo="Editar reserva"
        descripcion="Cambiá cancha, fecha, hora o datos del cliente."
        volver={{ href: `/dashboard/${slug}/reservas`, label: "Reservas" }}
      />

        <EditarReservaForm
          slug={slug}
          canchas={canchas.map(c => ({
            id: c.id,
            name: c.name,
            sport: c.sport as string,
            pricePerHour: Number(c.pricePerHour),
            schedules: c.schedules.map(s => ({
              dayOfWeek: s.dayOfWeek,
              openTime: s.openTime,
              closeTime: s.closeTime,
              slotMinutes: s.slotMinutes,
            })),
          }))}
          ocupacion={ocupacion}
          reservaInicial={{
            id: reserva.id,
            courtId: reserva.courtId,
            fecha: fechaInicial,
            hora: horaInicial,
            guestName: reserva.guestName ?? "",
            guestPhone: reserva.guestPhone ?? "",
            guestEmail: reserva.guestEmail ?? "",
          }}
        />
      </PageBody>
  )
}
