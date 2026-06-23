import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { CanchaForm } from "@/components/admin/cancha-form"
import { HorariosForm } from "@/components/admin/horarios-form"
import { BloqueoForm } from "@/components/admin/bloqueos-form"
import { EliminarBloqueoBtn } from "@/components/admin/eliminar-bloqueo-btn"
import { ToggleActivaBtn } from "@/components/admin/toggle-activa-btn"
import { EliminarCanchaBtn } from "@/components/admin/eliminar-cancha-btn"
import { sportLabel } from "@/lib/sports"
import {
  ArrowLeft,
  Sliders,
  Clock,
  Ban,
  ShieldAlert,
  Calendar,
  AlertCircle,
} from "lucide-react"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
  searchParams: Promise<{ tab?: string }>
}

type Tab = "datos" | "horarios" | "bloqueos" | "peligro"
const TABS: { key: Tab; label: string; icon: typeof Sliders }[] = [
  { key: "datos",     label: "Datos",         icon: Sliders },
  { key: "horarios",  label: "Horarios",      icon: Clock },
  { key: "bloqueos",  label: "Bloqueos",      icon: Ban },
  { key: "peligro",   label: "Zona peligro",  icon: ShieldAlert },
]

function parseTab(s: string | undefined): Tab {
  if (s === "horarios" || s === "bloqueos" || s === "peligro") return s
  return "datos"
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

export default async function EditarCanchaPage({ params, searchParams }: Props) {
  const { slug, courtId } = await params
  const { tab: tabParam } = await searchParams
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

  const tab = parseTab(tabParam)

  // Bloqueos solo si la tab es bloqueos (evitar query innecesaria)
  const bloqueos = tab === "bloqueos"
    ? await prisma.courtBlock.findMany({
        where: { courtId, endTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
      })
    : []

  // Conteo de reservas futuras pendientes/confirmadas — para advertir en
  // zona peligro lo que se perderia al eliminar.
  const reservasFuturas = tab === "peligro"
    ? await prisma.booking.count({
        where: {
          courtId,
          startTime: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      })
    : 0
  const totalReservas = tab === "peligro"
    ? await prisma.booking.count({ where: { courtId } })
    : 0

  return (
    <main className="min-h-screen bg-toxic-gradient relative">

      {/* Header sticky con nombre + estado */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link
          href={`/dashboard/${slug}`}
          className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Volver al panel
        </Link>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight">
            {cancha.name}
          </h1>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            cancha.isActive
              ? "bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/25"
              : "bg-white/[0.04] text-white/30 border-white/[0.06]"
          }`}>
            {cancha.isActive ? "Activa" : "Inactiva"}
          </span>
          <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.18em]">
            {sportLabel(cancha.sport as string)}
          </span>
        </div>
      </header>

      <section className="relative z-10 max-w-2xl mx-auto p-6 space-y-6">

        {/* Tabs nav */}
        <nav className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key
            const danger = key === "peligro"
            return (
              <Link
                key={key}
                href={key === "datos"
                  ? `/dashboard/${slug}/canchas/${courtId}`
                  : `/dashboard/${slug}/canchas/${courtId}?tab=${key}`
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                  active
                    ? danger
                      ? "bg-red-500/15 text-red-300 border border-red-500/30"
                      : "bg-[#A3FF12] text-black border border-[#A3FF12]"
                    : danger
                      ? "glass-nav text-red-400/70 hover:text-red-300 hover:border-red-500/20"
                      : "glass-nav text-white/55 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Content por tab */}
        {tab === "datos" && (
          <CanchaForm
            tenantId={tenant.id}
            slug={slug}
            cancha={{
              id: cancha.id,
              name: cancha.name,
              sport: cancha.sport,
              pricePerHour: Number(cancha.pricePerHour),
            }}
          />
        )}

        {tab === "horarios" && (
          <div className="space-y-3">
            <p className="text-sm text-white/45 leading-relaxed">
              Configurá los días y horarios en que esta cancha acepta reservas. Podés copiar el horario de un día a otros para no tipear todo.
            </p>
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
          </div>
        )}

        {tab === "bloqueos" && (
          <div className="space-y-6">
            <p className="text-sm text-white/45 leading-relaxed">
              Cerrá esta cancha por mantenimiento, evento privado o cualquier motivo puntual. Las reservas existentes en ese horario no se cancelan automáticamente.
            </p>

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
          </div>
        )}

        {tab === "peligro" && (
          <div className="space-y-5">
            <p className="text-sm text-white/45 leading-relaxed">
              Acciones que cambian el comportamiento de la cancha. Estos cambios son reversibles, pero pueden afectar a tus clientes — manejá con cuidado.
            </p>

            {/* Activa / Inactiva */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-white/[0.06] space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">
                    {cancha.isActive ? "Cancha activa" : "Cancha inactiva"}
                  </p>
                  <p className="text-sm text-white/50 mt-0.5 leading-relaxed">
                    {cancha.isActive
                      ? "Aparece en la grilla pública y acepta reservas nuevas."
                      : "Está oculta — los clientes no pueden reservarla. Las reservas existentes no se cancelan."}
                  </p>
                </div>
                <ToggleActivaBtn
                  courtId={cancha.id}
                  isActive={cancha.isActive}
                  tenantId={tenant.id}
                  slug={slug}
                />
              </div>
            </div>

            {/* Eliminar definitivamente */}
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-red-300 text-sm">Eliminar definitivamente</p>
                  <p className="text-sm text-white/45 leading-relaxed">
                    Borra la cancha, sus horarios, bloqueos y todas las reservas asociadas — pasadas y futuras. No se puede deshacer. Si solo querés que deje de aparecer, mejor desactivala arriba.
                  </p>
                </div>
              </div>

              {reservasFuturas > 0 && (
                <div className="rounded-lg bg-yellow-400/[0.08] border border-yellow-400/20 px-3 py-2 text-xs text-yellow-300/90 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Esta cancha tiene <span className="font-bold">{reservasFuturas} reserva{reservasFuturas === 1 ? "" : "s"} futura{reservasFuturas === 1 ? "" : "s"}</span> sin completarse. Si la eliminás, esa{reservasFuturas === 1 ? "" : "s"} reserva{reservasFuturas === 1 ? "" : "s"} también se borra{reservasFuturas === 1 ? "" : "n"}.
                  </span>
                </div>
              )}

              {totalReservas > 0 && (
                <p className="text-xs text-white/30">
                  Histórico total: {totalReservas} reserva{totalReservas === 1 ? "" : "s"}.
                </p>
              )}

              <EliminarCanchaBtn
                courtId={cancha.id}
                tenantId={tenant.id}
                slug={slug}
                canchaName={cancha.name}
              />
            </div>
          </div>
        )}

      </section>
    </main>
  )
}
