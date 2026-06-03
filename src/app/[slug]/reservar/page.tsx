import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
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
    <main className="min-h-screen bg-[#0C0E14] relative">
      {/* Orbs */}
      <div
        className="pointer-events-none fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
      />
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← {tenant.name}
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">¿Cuándo querés jugar?</h1>
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
