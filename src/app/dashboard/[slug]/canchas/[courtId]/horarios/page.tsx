import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { HorariosForm } from "@/components/admin/horarios-form"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
}

export default async function HorariosPage({ params }: Props) {
  const { slug, courtId } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const cancha = await prisma.court.findFirst({
    where: { id: courtId, tenantId: tenant.id },
    include: { schedules: true },
  })
  if (!cancha) notFound()

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
            <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">Horarios — {cancha.name}</h1>
        <p className="text-sm text-white/35 mt-0.5">Configurá los días y horarios en que esta cancha acepta reservas.</p>
      </header>

      <section className="relative z-10 max-w-2xl mx-auto p-6">
        <HorariosForm
          courtId={cancha.id}
          tenantId={tenant.id}
          slug={slug}
          horariosActuales={cancha.schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime,
            closeTime: s.closeTime,
            slotMinutes: s.slotMinutes,
          }))}
        />
      </section>
    </main>
  )
}
