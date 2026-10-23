import { redirect } from "next/navigation"
import Image from "next/image"
import { Hourglass, Lock, UserRound, MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { auth, getSuperAdminSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cerrarSesion } from "@/actions/auth"
import { estadoTenant } from "@/lib/tenant-status"
import { waFundadorUrl } from "@/lib/pointix"

export const dynamic = "force-dynamic"

// Distribuidor post-login: manda a cada usuario a donde corresponde, o le
// explica por qué no puede entrar a su panel todavía.
export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user.impersonating && (await getSuperAdminSession())) redirect("/admin")

  const tenant = session?.user.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true, slug: true, pendingApproval: true, subscriptionStatus: true, subscriptionEndsAt: true },
      })
    : null

  if (session?.user.role === "ADMIN" && tenant) {
    const { estado, panelHabilitado } = estadoTenant(tenant)
    if (panelHabilitado || session.user.impersonating) redirect(`/dashboard/${tenant.slug}`)

    if (estado === "pendiente") {
      return (
        <Pantalla
          icon={Hourglass}
          titulo="Estamos revisando tu complejo"
          texto={`Recibimos el alta de ${tenant.name}. La revisamos a mano y te avisamos por mail en cuanto esté aprobada (normalmente en el día). Ahí arrancan tus 30 días de prueba.`}
          waMensaje={`Hola! Acabo de registrar ${tenant.name} en Pointix.`}
          waLabel="Escribinos para acelerar"
        />
      )
    }

    return (
      <Pantalla
        icon={Lock}
        titulo={estado === "suspendido" ? "Tu cuenta está suspendida" : "Tu período terminó"}
        texto={
          estado === "suspendido"
            ? `El panel de ${tenant.name} está suspendido. Escribinos para resolverlo.`
            : `El período de ${tenant.name} venció, así que el panel quedó bloqueado. Tus clientes pueden seguir reservando y no se perdió nada: escribinos para renovar y lo reactivamos al instante.`
        }
        waMensaje={`Hola! Quiero renovar Pointix para ${tenant.name}.`}
        waLabel="Renovar por WhatsApp"
      />
    )
  }

  return (
    <Pantalla
      icon={UserRound}
      titulo={`Hola${session?.user.name ? `, ${session.user.name}` : ""}`}
      texto="Tu cuenta no tiene un complejo asociado. Si administrás un complejo y querés sumarlo a Pointix, escribinos."
      waMensaje="Hola! Tengo cuenta en Pointix pero no veo mi complejo."
      waLabel="Hablar por WhatsApp"
    />
  )
}

function Pantalla({ icon: Icon, titulo, texto, waMensaje, waLabel }: {
  icon: LucideIcon
  titulo: string
  texto: string
  waMensaje: string
  waLabel: string
}) {
  return (
    <main className="min-h-screen bg-toxic-gradient flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Image src="/logo-wordmark-white.svg" alt="Pointix" width={200} height={60} className="h-11 w-auto" priority />
        </div>
        <div className="glass-card rounded-2xl p-8 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#A3FF12]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display font-black uppercase text-white text-2xl leading-tight tracking-tight">{titulo}</h1>
            <p className="text-sm text-white/55 leading-relaxed">{texto}</p>
          </div>
          <a
            href={waFundadorUrl(waMensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-sm rounded-xl px-5 py-3 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {waLabel}
          </a>
          <form action={cerrarSesion}>
            <button type="submit" className="text-sm text-white/40 hover:text-white transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
