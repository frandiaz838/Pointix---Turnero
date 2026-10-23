import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, MessageCircle, Check, X, BellRing, Search } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "@/lib/session"
import { estadoTenant, ESTADO_LABEL, ESTADO_BADGE, type EstadoTenant } from "@/lib/tenant-status"
import { LogoutBtn } from "@/components/admin/logout-btn"
import { TenantActions } from "@/components/super-admin/tenant-actions"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ estado?: string; q?: string }>
}

// Las tarjetas de estado son a la vez contador y filtro.
const ESTADOS: { key: EstadoTenant; label: string; ayuda: string; acento: string }[] = [
  { key: "pendiente",  label: "Pendientes", ayuda: "Esperan tu aprobación", acento: "text-yellow-400" },
  { key: "prueba",     label: "En prueba",  ayuda: "Prueba gratis en curso", acento: "text-cyan-300" },
  { key: "activo",     label: "Activos",    ayuda: "Pagan el servicio",      acento: "text-[#A3FF12]" },
  { key: "vencido",    label: "Vencidos",   ayuda: "Panel bloqueado",        acento: "text-orange-400" },
  { key: "suspendido", label: "Suspendidos", ayuda: "Bloqueados por vos",    acento: "text-red-400" },
]

// Orden de la lista: lo que requiere acción primero.
const PRIORIDAD: Record<EstadoTenant, number> = { pendiente: 0, vencido: 1, prueba: 2, activo: 3, suspendido: 4 }

function haceDias(n: number): Date {
  return new Date(Date.now() - n * 86_400_000)
}

function fechaCorta(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })
}

// Frase que explica en qué situación está el club y hasta cuándo.
function resumenEstado(estado: EstadoTenant, vence: Date | null, dias: number | null): string {
  const cuenta = dias !== null && dias > 0 ? ` · ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`}` : ""
  switch (estado) {
    case "pendiente":  return "Esperando tu aprobación. La prueba de 30 días arranca cuando lo aprobás."
    case "prueba":     return vence ? `En prueba gratis hasta el ${fechaCorta(vence)}${cuenta}` : "En prueba, sin fecha de vencimiento"
    case "activo":     return vence ? `Pagó hasta el ${fechaCorta(vence)}${cuenta}` : "Activo, sin fecha de vencimiento"
    case "vencido":    return vence ? `Venció el ${fechaCorta(vence)} · panel bloqueado, sigue recibiendo reservas` : "Vencido · panel bloqueado"
    case "suspendido": return "Suspendido · panel y página pública bloqueados"
  }
}

export default async function SuperAdminPage({ searchParams }: Props) {
  const session = await getSuperAdminSession()
  if (!session) redirect("/dashboard")
  if (session.user.impersonating) redirect("/dashboard")

  const { estado: filtroParam, q: qParam } = await searchParams
  const filtro = ESTADOS.find((e) => e.key === filtroParam)?.key ?? null
  const q = (qParam ?? "").trim().toLowerCase()

  const hace30 = haceDias(30)

  const [tenants, reservas30, nuevos30] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true, name: true, slug: true, whatsappNumber: true, createdAt: true,
        pendingApproval: true, subscriptionStatus: true, subscriptionEndsAt: true,
        mpAccessToken: true, adminNotes: true,
        users: { where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, select: { id: true, name: true, email: true } },
        _count: {
          select: {
            courts: { where: { archivedAt: null } },
            bookings: { where: { createdAt: { gte: hace30 }, status: { in: ["CONFIRMED", "COMPLETED"] } } },
          },
        },
      },
    }),
    prisma.booking.count({ where: { createdAt: { gte: hace30 }, status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    prisma.tenant.count({ where: { createdAt: { gte: hace30 } } }),
  ])

  const conEstado = tenants
    .map((t) => ({ ...t, info: estadoTenant(t) }))
    .sort((a, b) => PRIORIDAD[a.info.estado] - PRIORIDAD[b.info.estado] || b.createdAt.getTime() - a.createdAt.getTime())

  const conteo = (e: EstadoTenant) => conEstado.filter((t) => t.info.estado === e).length
  const pendientes = conteo("pendiente")

  const visibles = conEstado.filter((t) => {
    if (filtro && t.info.estado !== filtro) return false
    if (!q) return true
    return [t.name, t.slug, ...t.users.map((u) => u.email)].some((s) => s.toLowerCase().includes(q))
  })

  return (
    <div className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo-wordmark-white.svg" alt="Pointix" width={130} height={38} className="h-7 w-auto" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300 border border-cyan-400/30 rounded-full px-2.5 py-1">
            Super admin
          </span>
        </div>
        <LogoutBtn />
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {pendientes > 0 && filtro !== "pendiente" && (
          <Link
            href="/admin?estado=pendiente"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-6 py-5 hover:bg-yellow-400/15 transition-colors"
          >
            <span className="flex items-center gap-3">
              <BellRing className="w-6 h-6 text-yellow-400 shrink-0" />
              <span className="text-base text-white">
                <strong className="text-yellow-400">
                  {pendientes === 1 ? "1 complejo quiere sumarse" : `${pendientes} complejos quieren sumarse`}
                </strong>{" "}
                a Pointix. Revisalos y aprobalos.
              </span>
            </span>
            <span className="text-sm font-semibold text-yellow-400 whitespace-nowrap">Ver solicitudes →</span>
          </Link>
        )}

        {/* Estados: contador + filtro */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ESTADOS.map((e) => {
              const n = conteo(e.key)
              const activo = filtro === e.key
              const alerta = e.key === "pendiente" && n > 0
              return (
                <Link
                  key={e.key}
                  href={activo ? "/admin" : `/admin?estado=${e.key}`}
                  aria-current={activo ? "true" : undefined}
                  className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 border transition-colors first:col-span-2 sm:first:col-span-1 ${
                    activo
                      ? "border-[#A3FF12]/60 bg-white/[0.06]"
                      : alerta
                        ? "border-yellow-400/40"
                        : "border-transparent hover:border-white/15"
                  }`}
                >
                  <span className="text-xs font-bold text-white/50 uppercase tracking-[0.14em]">{e.label}</span>
                  <span className={`font-display font-black leading-none text-4xl sm:text-5xl ${n > 0 ? e.acento : "text-white/25"}`}>
                    {n}
                  </span>
                  <span className="text-xs text-white/40">{e.ayuda}</span>
                </Link>
              )
            })}
          </div>
          <p className="text-sm text-white/50">
            <span className="text-white font-semibold">{tenants.length}</span> {tenants.length === 1 ? "complejo" : "complejos"} en total
            <span className="mx-2 text-white/20">·</span>
            <span className="text-white font-semibold">{nuevos30}</span> {nuevos30 === 1 ? "alta" : "altas"} en los últimos 30 días
            <span className="mx-2 text-white/20">·</span>
            <span className="text-white font-semibold">{reservas30.toLocaleString("es-AR")}</span> reservas confirmadas en 30 días
          </p>
        </section>

        {/* Lista */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display font-black uppercase text-white text-2xl tracking-tight">
                {filtro ? ESTADOS.find((e) => e.key === filtro)!.label : "Todos los complejos"}
              </h1>
              {filtro && (
                <Link href="/admin" className="text-sm text-white/50 hover:text-white">Ver todos</Link>
              )}
            </div>
            <form className="relative sm:w-80">
              {filtro && <input type="hidden" name="estado" value={filtro} />}
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                name="q"
                defaultValue={qParam ?? ""}
                placeholder="Buscar club, slug o email…"
                className="w-full text-sm bg-[#1A1E2A] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white/85 placeholder:text-white/30"
              />
            </form>
          </div>

          {visibles.length === 0 ? (
            <div className="glass-card rounded-2xl px-6 py-12 text-center text-base text-white/45">
              No hay complejos para este filtro.
            </div>
          ) : (
            <ul className="space-y-4">
              {visibles.map((t) => {
                const dueno = t.users[0]
                const { estado, diasRestantes } = t.info
                const alerta = estado === "vencido" || estado === "suspendido"
                return (
                  <li
                    key={t.id}
                    className={`glass-card rounded-2xl p-6 space-y-5 border ${estado === "pendiente" ? "border-yellow-400/40" : "border-transparent"}`}
                  >
                    {/* Identidad */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display font-black uppercase text-white text-2xl leading-none tracking-tight">{t.name}</h2>
                        <span className={`text-xs font-bold uppercase tracking-wider border rounded-full px-2.5 py-1 ${ESTADO_BADGE[estado]}`}>
                          {ESTADO_LABEL[estado]}
                        </span>
                      </div>
                      <p className="text-sm text-white/55 break-all">
                        {!dueno
                          ? "Sin dueño asignado"
                          : dueno.id === session.user.id
                            ? <span className="text-cyan-300 font-semibold">Vos (super admin) · club de prueba</span>
                            : `${dueno.name ?? "—"} · ${dueno.email}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {estado !== "pendiente" && (
                          <Link href={`/${t.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white">
                            pointix.com.ar/{t.slug} <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {t.whatsappNumber && (
                          <a href={`https://wa.me/${t.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline">
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Estado + datos */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                      <p className={`text-base font-semibold flex-1 ${alerta ? "text-orange-300" : estado === "pendiente" ? "text-yellow-300" : "text-white/85"}`}>
                        {resumenEstado(estado, t.subscriptionEndsAt, diasRestantes)}
                      </p>
                      <dl className="flex gap-8 text-sm shrink-0">
                        <div>
                          <dt className="text-white/40">Canchas</dt>
                          <dd className="text-white font-bold text-lg leading-tight">{t._count.courts}</dd>
                        </div>
                        <div>
                          <dt className="text-white/40" title="Reservas confirmadas en los últimos 30 días">Reservas 30d</dt>
                          <dd className="text-white font-bold text-lg leading-tight">{t._count.bookings}</dd>
                        </div>
                        <div>
                          <dt className="text-white/40">MercadoPago</dt>
                          <dd className="text-lg leading-tight">
                            {t.mpAccessToken
                              ? <span className="inline-flex items-center gap-1 text-[#A3FF12] font-bold"><Check className="w-4 h-4" /> Sí</span>
                              : <span className="inline-flex items-center gap-1 text-white/35 font-bold"><X className="w-4 h-4" /> No</span>}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {t.adminNotes && (
                      <p className="text-sm text-white/65 border-l-2 border-cyan-400/40 pl-3 whitespace-pre-wrap">
                        {t.adminNotes}
                      </p>
                    )}

                    <TenantActions
                      tenantId={t.id}
                      estado={estado}
                      venceIso={t.subscriptionEndsAt?.toISOString() ?? null}
                      notas={t.adminNotes}
                    />

                    <p className="text-xs text-white/30">Alta: {fechaCorta(t.createdAt)}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
