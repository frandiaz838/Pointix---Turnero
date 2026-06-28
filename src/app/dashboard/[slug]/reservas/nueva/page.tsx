import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { NuevaReservaForm } from "@/components/admin/nueva-reserva-form"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

export default async function NuevaReservaAdminPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { fecha: fechaParam } = await searchParams
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

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

  // Construir ocupacion: array de { courtId, fecha (YYYY-MM-DD), hora (HH:00) }
  // a partir de reservas + bloqueos. La grilla del form los filtra.
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

  const hoyAr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())

  return (
    <main className="min-h-screen bg-toxic-gradient relative">

      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}/reservas`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver a reservas
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">
          Nueva reserva
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Cargá la reserva que te confirmaron por teléfono o WhatsApp.
        </p>
      </header>

      <section className="relative z-10 max-w-lg mx-auto p-6">
        {canchas.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-3">
            <p className="text-white/55">No hay canchas activas todavía.</p>
            <Link
              href={`/dashboard/${slug}/canchas/nueva`}
              className="btn-lime-glow inline-flex items-center bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-4 py-2 rounded-xl"
            >
              Crear la primera cancha
            </Link>
          </div>
        ) : (
          <NuevaReservaForm
            slug={slug}
            fechaInicial={fechaParam ?? hoyAr}
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
          />
        )}
      </section>
    </main>
  )
}
