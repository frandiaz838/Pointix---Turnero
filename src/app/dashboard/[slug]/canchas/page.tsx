import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Clock, LayoutDashboard, AlertTriangle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"
import { EmptyState } from "@/components/admin/empty-state"
import { SportIcon } from "@/components/ui/sport-icon"
import { sportLabel } from "@/lib/sports"
import { todayInArDayOfWeek } from "@/lib/timezone"
import { PageHeader, PageBody, SectionTitle, btnPrimario, btnSecundario } from "@/components/admin/page-header"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default async function CanchasPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()
  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const canchas = await prisma.court.findMany({
    where: { tenantId: tenant.id, archivedAt: null },
    include: { schedules: true },
    orderBy: { createdAt: "asc" },
  })

  const diaSemana = todayInArDayOfWeek()

  const porDeporte = new Map<string, typeof canchas>()
  for (const c of canchas) porDeporte.set(c.sport, [...(porDeporte.get(c.sport) ?? []), c])
  const grupos = [...porDeporte.entries()].map(([sport, lista]) => ({
    sport,
    canchas: [...lista.filter((c) => c.isActive), ...lista.filter((c) => !c.isActive)],
  }))

  const activas = canchas.filter((c) => c.isActive).length

  return (
    <PageBody>
      <PageHeader
        titulo="Canchas"
        descripcion={
          canchas.length === 0
            ? "Cargá tus canchas para empezar a recibir reservas."
            : `${activas} de ${canchas.length} ${canchas.length === 1 ? "cancha activa" : "canchas activas"} para reservar.`
        }
        acciones={<Link href={`/dashboard/${slug}/canchas/nueva`} className={btnPrimario}>+ Nueva cancha</Link>}
      />

      {canchas.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          titulo="Todavía no tenés canchas"
          descripcion="Creá la primera cancha para empezar a recibir reservas."
          acciones={[{ label: "+ Crear primera cancha", href: `/dashboard/${slug}/canchas/nueva`, variant: "primary" }]}
        />
      ) : (
        grupos.map(({ sport, canchas: lista }) => (
          <section key={sport} className="space-y-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <SportIcon sport={sport} size={16} />
                {sportLabel(sport)}
              </span>
            </SectionTitle>

            <ul className="grid gap-3 md:grid-cols-2">
              {lista.map((cancha) => {
                const hoy = cancha.schedules.find((s) => s.dayOfWeek === diaSemana)
                const diasAbiertos = [...cancha.schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                const sinHorarios = cancha.schedules.length === 0
                return (
                  <li
                    key={cancha.id}
                    className={`glass-card rounded-2xl p-5 flex flex-col gap-4 ${cancha.isActive ? "" : "opacity-60"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-lg font-bold text-white truncate">{cancha.name}</p>
                        <p className="font-display font-black text-2xl text-white leading-none">
                          ${Number(cancha.pricePerHour).toLocaleString("es-AR")}
                          <span className="font-sans font-normal text-sm text-white/50 ml-1.5">por turno</span>
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
                        cancha.isActive
                          ? "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25"
                          : "bg-white/[0.04] text-white/50 border-white/[0.1]"
                      }`}>
                        {cancha.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </div>

                    {sinHorarios ? (
                      <p className="flex items-center gap-2 text-sm text-yellow-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Sin horarios: no aparece para reservar
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm text-white/75">
                          <Clock className="w-4 h-4 text-white/55 shrink-0" />
                          {hoy ? `Hoy abre de ${hoy.openTime} a ${hoy.closeTime}` : "Hoy cerrada"}
                        </p>
                        <p className="text-sm text-white/45 pl-6">
                          {diasAbiertos.map((s) => DIAS_CORTOS[s.dayOfWeek]).join(" · ")}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 mt-auto">
                      <Link
                        href={`/dashboard/${slug}/canchas/${cancha.id}${sinHorarios ? "?tab=horarios" : ""}`}
                        className={sinHorarios ? btnPrimario : btnSecundario}
                      >
                        {sinHorarios ? "Cargar horarios" : "Editar"}
                      </Link>
                      <ToggleActivaBtn courtId={cancha.id} isActive={cancha.isActive} tenantId={tenant.id} slug={slug} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </PageBody>
  )
}
