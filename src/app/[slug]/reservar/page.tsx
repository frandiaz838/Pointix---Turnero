import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { GrillaReservas } from "@/components/booking/grilla-reservas"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string; deporte?: string }>
}

export default async function ReservarPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { fecha: fechaParam, deporte: deporteParam } = await searchParams

  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  const fecha = fechaParam ?? new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())
  const deporte = deporteParam ?? "todos"

  const inicio = new Date(`${fecha}T00:00:00.000Z`)
  const fin = new Date(`${fecha}T23:59:59.999Z`)

  const [canchas, reservas] = await Promise.all([
    prisma.court.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: { schedules: true },
      orderBy: [{ sport: "asc" }, { name: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: { gte: inicio, lte: fin },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { courtId: true, startTime: true },
    }),
  ])

  const canchasData = canchas.map((c) => ({
    id: c.id,
    name: c.name,
    sport: c.sport as string,
    pricePerHour: Number(c.pricePerHour),
    schedules: c.schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      openTime: s.openTime,
      closeTime: s.closeTime,
      slotMinutes: s.slotMinutes,
    })),
  }))

  const reservasData = reservas.map((r) => ({
    courtId: r.courtId,
    hora: `${String(r.startTime.getUTCHours()).padStart(2, "0")}:${String(r.startTime.getUTCMinutes()).padStart(2, "0")}`,
  }))

  const deportesDisponibles = [...new Set(canchas.map((c) => c.sport as string))]

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href={`/${slug}`} className="text-sm font-medium text-gray-500 hover:text-gray-800">
          ← {tenant.name}
        </Link>
        <h1 className="text-xl font-bold mt-1">¿Cuándo querés jugar?</h1>
      </header>

      <GrillaReservas
        slug={slug}
        canchas={canchasData}
        reservas={reservasData}
        fecha={fecha}
        deporte={deporte}
        deportesDisponibles={deportesDisponibles}
        isLoggedIn={!!session?.user}
      />
    </main>
  )
}
