import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { MpConfigForm } from "@/components/admin/mp-config-form"
import { Info } from "lucide-react"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MpConfigPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, mpAccessToken: true, mpExpiryMinutes: true },
  })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const token = tenant.mpAccessToken
  const accessTokenConfigurado = !!token
  const accessTokenUltimos4 = token ? token.slice(-4) : null

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">
          MercadoPago
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Conectá tu cuenta MP para que los clientes paguen online al reservar.
        </p>
      </header>

      <section className="relative z-10 max-w-lg mx-auto p-6 space-y-5">

        {/* Info box explicativo */}
        <div className="glass-card rounded-2xl p-4 flex gap-3">
          <Info className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
          <div className="text-xs text-white/55 space-y-2 leading-relaxed">
            <p>
              <span className="text-white/80 font-semibold">¿Cómo funciona?</span> Pointix redirige al cliente a MercadoPago con tu Access Token.
              La plata va <span className="text-[#A3FF12]/80 font-semibold">directo a tu cuenta MP</span>, Pointix no la toca.
            </p>
            <p>
              <span className="text-white/80 font-semibold">¿Y si no lo configuro?</span> Las reservas se crean con estado &ldquo;Pendiente&rdquo;
              y el cliente paga al llegar al complejo (modo actual).
            </p>
          </div>
        </div>

        <MpConfigForm
          tenantId={tenant.id}
          slug={slug}
          configActual={{
            accessTokenConfigurado,
            accessTokenUltimos4,
            expiryMinutes: tenant.mpExpiryMinutes,
          }}
        />
      </section>
    </main>
  )
}
