import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { BloqueoForm } from "@/components/admin/bloqueos-form"
import { EliminarBloqueoBtn } from "@/components/admin/eliminar-bloqueo-btn"
import { Ban, Calendar } from "lucide-react"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
}

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFechaCompleta(d: Date) {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

function formatHora(d: Date) {
  return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`
}

function esTodoElDia(b: { startTime: Date; endTime: Date }) {
  const inicio = b.startTime.getUTCHours() === 0 && b.startTime.getUTCMinutes() === 0
  const fin = b.endTime.getUTCHours() === 23 && b.endTime.getUTCMinutes() === 59
  return inicio && fin
}

export default async function BloqueosPage({ params }: Props) {
  const { slug, courtId } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const cancha = await prisma.court.findFirst({
    where: { id: courtId, tenantId: tenant.id },
  })
  if (!cancha) notFound()

  // Solo mostrar bloqueos futuros (endTime >= ahora) — los del pasado no importan
  const ahora = new Date()
  const bloqueos = await prisma.courtBlock.findMany({
    where: { courtId, endTime: { gte: ahora } },
    orderBy: { startTime: "asc" },
  })

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">
          Bloqueos — {cancha.name}
        </h1>
        <p className="text-sm text-white/40 mt-0.5">
          Cerrá esta cancha por mantenimiento, evento o cualquier motivo puntual.
        </p>
      </header>

      <section className="relative z-10 max-w-2xl mx-auto p-6 space-y-6">

        <BloqueoForm slug={slug} courtId={courtId} />

        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">
            Bloqueos activos ({bloqueos.length})
          </h2>

          {bloqueos.length === 0 ? (
            <div className="glass-card rounded-xl px-6 py-8 flex flex-col items-center gap-2 text-center">
              <Ban className="w-6 h-6 text-white/15" />
              <p className="text-sm text-white/35">No hay bloqueos activos</p>
              <p className="text-xs text-white/25">
                Los bloqueos pasados se ocultan automáticamente.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-xl divide-y divide-white/[0.05]">
              {bloqueos.map(b => {
                const todoElDia = esTodoElDia(b)
                return (
                  <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25">
                          {cancha.name}
                        </span>
                        {todoElDia ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Todo el día
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-white/55 border border-white/[0.1] tabular-nums">
                            {formatHora(b.startTime)} — {formatHora(b.endTime)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        <span className="text-sm font-medium text-white/80">
                          {formatFechaCompleta(b.startTime)}
                        </span>
                      </div>
                      {b.reason && (
                        <p className="text-xs text-white/40 truncate">{b.reason}</p>
                      )}
                    </div>
                    <EliminarBloqueoBtn bloqueoId={b.id} slug={slug} courtId={courtId} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </section>
    </main>
  )
}
