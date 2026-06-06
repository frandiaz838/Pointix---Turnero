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

  const canchas = await prisma.court.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: [{ sport: "asc" }, { name: "asc" }],
  })

  const hoyAr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date())

  return (
    <main className="min-h-screen bg-[#0C0E14] relative">
      <div
        className="pointer-events-none fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(163,255,18,0.14) 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full opacity-40"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)" }}
      />

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
            }))}
          />
        )}
      </section>
    </main>
  )
}
