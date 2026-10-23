import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ExternalLink, MessageCircle, Check, X, BellRing } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getSuperAdminSession } from "@/lib/session"
import { estadoTenant, ESTADO_LABEL, ESTADO_BADGE, type EstadoTenant } from "@/lib/tenant-status"
import { LogoutBtn } from "@/components/admin/logout-btn"
import { TenantActions } from "@/components/super-admin/tenant-actions"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ estado?: string; q?: string }>
}

const FILTROS: { key: EstadoTenant | "todos"; label: string }[] = [
  { key: "todos",      label: "Todos" },
  { key: "pendiente",  label: "Pendientes" },
  { key: "prueba",     label: "En prueba" },
  { key: "activo",     label: "Activos" },
  { key: "vencido",    label: "Vencidos" },
  { key: "suspendido", label: "Suspendidos" },
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
  const filtro = FILTROS.some((f) => f.key === filtroParam) ? (filtroParam as EstadoTenant) : "todos"
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

  const visibles = conEstado.filter((t) => {
    if (filtro !== "todos" && t.info.estado !== filtro) return false
    if (!q) return true
    return [t.name, t.slug, ...t.users.map((u) => u.email)].some((s) => s.toLowerCase().includes(q))
  })

  const kpis = [
    { label: "Complejos",        valor: tenants.length },
    { label: "Pendientes",       valor: conteo("pendiente"), destacar: conteo("pendiente") > 0 },
    { label: "En prueba",        valor: conteo("prueba") },
    { label: "Activos (pagan)",  valor: conteo("activo") },
    { label: "Vencidos",         valor: conteo("vencido") },
    { label: "Altas 30 días",    valor: nuevos30 },
    { label: "Reservas 30 días", valor: reservas30 },
  ]

  return (
    <div className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image src="/logo-wordmark-white.svg" alt="Pointix" width={110} height={32} className="h-6 w-auto" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300 border border-cyan-400/30 rounded-full px-2 py-0.5">
            Super admin
          </span>
        </div>
        <LogoutBtn />
      </header>

      <main className="relative z-10 max-w-5xl mx-auto p-6 space-y-8">
        {conteo("pendiente") > 0 && filtro !== "pendiente" && (
          <Link
            href="/admin?estado=pendiente"
            className="flex items-center justify-between gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-5 py-4 hover:bg-yellow-400/15 transition-colors"
          >
            <span className="flex items-center gap-3">
              <BellRing className="w-5 h-5 text-yellow-400 shrink-0" />
              <span className="text-sm text-white">
                <strong className="text-yellow-400">
                  {conteo("pendiente") === 1 ? "1 complejo quiere sumarse" : `${conteo("pendiente")} complejos quieren sumarse`}
                </strong>{" "}
                a Pointix. Revisalos y aprobalos.
              </span>
            </span>
            <span className="text-xs font-semibold text-yellow-400 whitespace-nowrap">Ver solicitudes →</span>
          </Link>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className={`glass-card rounded-2xl p-4 space-y-2 ${k.destacar ? "border border-yellow-400/40" : ""}`}>
              <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.14em] leading-tight">{k.label}</p>
              <p className={`font-display font-black leading-none text-3xl ${k.destacar ? "text-yellow-400" : "text-white"}`}>
                {k.valor.toLocaleString("es-AR")}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <nav className="flex flex-wrap gap-1.5">
            {FILTROS.map((f) => {
              const activo = filtro === f.key
              const href = f.key === "todos" ? "/admin" : `/admin?estado=${f.key}`
              const n = f.key === "todos" ? tenants.length : conteo(f.key)
              return (
                <Link
                  key={f.key}
                  href={href}
                  className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                    activo ? "bg-[#A3FF12] text-black border-transparent" : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {f.label} <span className={activo ? "text-black/60" : "text-white/30"}>{n}</span>
                </Link>
              )
            })}
          </nav>
          <form className="sm:w-64">
            {filtro !== "todos" && <input type="hidden" name="estado" value={filtro} />}
            <input
              name="q"
              defaultValue={qParam ?? ""}
              placeholder="Buscar club, slug o email…"
              className="w-full text-sm bg-[#1A1E2A] border border-white/10 rounded-lg px-3 py-2 text-white/85 placeholder:text-white/25"
            />
          </form>
        </div>

        {visibles.length === 0 ? (
          <div className="glass-card rounded-2xl px-6 py-10 text-center text-sm text-white/40">
            No hay complejos para este filtro.
          </div>
        ) : (
          <ul className="space-y-3">
            {visibles.map((t) => {
              const dueno = t.users[0]
              const { estado, diasRestantes } = t.info
              return (
                <li key={t.id} className={`glass-card rounded-2xl p-5 space-y-4 ${estado === "pendiente" ? "border border-yellow-400/40" : ""}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display font-black uppercase text-white text-lg leading-none tracking-tight">{t.name}</h2>
                        <span className={`text-[10px] font-bold uppercase tracking-wider border rounded-full px-2 py-0.5 ${ESTADO_BADGE[estado]}`}>
                          {ESTADO_LABEL[estado]}
                        </span>
                      </div>
                      <p className="text-xs text-white/45 break-all">
                        {!dueno
                          ? "Sin dueño asignado"
                          : dueno.id === session.user.id
                            ? <span className="text-cyan-300 font-semibold">Vos (super admin) · club de prueba</span>
                            : `${dueno.name ?? "—"} · ${dueno.email}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {estado !== "pendiente" && (
                          <Link href={`/${t.slug}`} target="_blank" className="inline-flex items-center gap-1 text-white/55 hover:text-white">
                            /{t.slug} <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                        {t.whatsappNumber && (
                          <a href={`https://wa.me/${t.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#25D366] hover:underline">
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <dl className="grid grid-cols-3 gap-4 text-xs shrink-0">
                      <div>
                        <dt className="text-white/35">Canchas</dt>
                        <dd className="text-white/80 font-semibold">{t._count.courts}</dd>
                      </div>
                      <div>
                        <dt className="text-white/35" title="Reservas confirmadas en los últimos 30 días">Reservas 30d</dt>
                        <dd className="text-white/80 font-semibold">{t._count.bookings}</dd>
                      </div>
                      <div>
                        <dt className="text-white/35">MP</dt>
                        <dd>{t.mpAccessToken ? <Check className="w-4 h-4 text-[#A3FF12]" /> : <X className="w-4 h-4 text-white/25" />}</dd>
                      </div>
                    </dl>
                  </div>

                  <p className={`text-sm font-medium ${estado === "vencido" || estado === "suspendido" ? "text-orange-300" : estado === "pendiente" ? "text-yellow-300" : "text-white/75"}`}>
                    {resumenEstado(estado, t.subscriptionEndsAt, diasRestantes)}
                  </p>

                  {t.adminNotes && (
                    <p className="text-xs text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 whitespace-pre-wrap">
                      {t.adminNotes}
                    </p>
                  )}

                  <div className="border-t border-white/[0.06] pt-4">
                    <TenantActions
                      tenantId={t.id}
                      estado={estado}
                      venceIso={t.subscriptionEndsAt?.toISOString() ?? null}
                      notas={t.adminNotes}
                    />
                  </div>
                  <p className="text-[11px] text-white/25">Alta: {fechaCorta(t.createdAt)}</p>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
