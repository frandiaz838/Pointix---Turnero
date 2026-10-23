import { redirect } from "next/navigation"
import Link from "next/link"
import { Eye, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth, getSuperAdminSession } from "@/lib/session"
import { estadoTenant } from "@/lib/tenant-status"
import { waFundadorUrl } from "@/lib/pointix"
import { salirDeComplejo } from "@/actions/super-admin"

// Puerta de entrada a todo /dashboard/{slug}/*: si la prueba o el plan del
// club vencieron (o sigue pendiente de aprobación), manda al dueño a
// /dashboard, que le explica qué pasa. Cada página sigue validando por su
// cuenta que la sesión sea ADMIN de este tenant.
//
// Arriba muestra una barra según el caso: "viendo como" para el super admin,
// o los días de prueba que le quedan al dueño.
const AVISO_PRUEBA_DIAS = 7

export default async function TenantDashboardLayout({ children, params }: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, pendingApproval: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })
  // Sin tenant o sin sesión de este club: que la página resuelva (notFound / redirect).
  if (!tenant || session?.user.tenantId !== tenant.id) return children

  const info = estadoTenant(tenant)

  if (session.user.impersonating) {
    if (!(await getSuperAdminSession())) redirect("/login")
    return (
      <>
        <div className="relative z-[60] bg-cyan-400 text-[#0C0E14] px-4 py-2 flex items-center justify-center gap-3 text-sm font-semibold">
          <Eye className="w-4 h-4 shrink-0" />
          <span className="truncate">Estás viendo el panel de {tenant.name} como super admin</span>
          <form action={salirDeComplejo}>
            <button type="submit" className="underline underline-offset-2 hover:no-underline whitespace-nowrap">
              Volver al super admin
            </button>
          </form>
        </div>
        {children}
      </>
    )
  }

  if (!info.panelHabilitado) redirect("/dashboard")

  const mostrarAviso =
    info.estado === "prueba" && info.diasRestantes !== null && info.diasRestantes <= AVISO_PRUEBA_DIAS
  if (!mostrarAviso) return children

  const dias = info.diasRestantes!
  return (
    <>
      <div className="relative z-[60] bg-[#A3FF12]/10 border-b border-[#A3FF12]/20 text-white/80 px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <Clock className="w-4 h-4 shrink-0 text-[#A3FF12]" />
        <span>
          Te {dias === 1 ? "queda 1 día" : `quedan ${dias} días`} de prueba.{" "}
          <Link
            href={waFundadorUrl(`Hola! Quiero seguir usando Pointix en ${tenant.name}.`)}
            target="_blank"
            className="text-[#A3FF12] font-semibold hover:underline"
          >
            Seguir con Pointix
          </Link>
        </span>
      </div>
      {children}
    </>
  )
}
