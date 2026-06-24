import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { MpConfigForm } from "@/components/admin/mp-config-form"
import { DatosClubForm } from "@/components/admin/datos-club-form"
import { ShareLinkCard } from "@/components/admin/share-link-card"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ConfiguracionPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      whatsappNumber: true,
      mpAccessToken: true,
      mpExpiryMinutes: true,
      mpSenaPercentage: true,
    },
  })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const token = tenant.mpAccessToken
  const accessTokenConfigurado = !!token
  const accessTokenUltimos4 = token ? token.slice(-4) : null

  // URL publica de reservas del club. Fallback al dominio canonical
  // para que aunque NEXT_PUBLIC_APP_URL no este seteada en dev/preview,
  // el link mostrado siga apuntando al sitio real.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pointix.com.ar"
  const linkPublico = `${appUrl}/${slug}`

  return (
    <main className="min-h-screen bg-toxic-gradient relative">
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">
          Configuración
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Datos del club, WhatsApp y MercadoPago.
        </p>
      </header>

      <section className="relative z-10 max-w-lg mx-auto p-6 space-y-8">

        {/* Sección: link público de reservas */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
            Link para compartir
          </h2>
          <ShareLinkCard url={linkPublico} clubName={tenant.name} />
        </div>

        {/* Sección 1: Datos del club */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Datos del club</h2>
          <DatosClubForm
            tenantId={tenant.id}
            slug={slug}
            inicial={{
              description: tenant.description ?? "",
              address: tenant.address ?? "",
              whatsappNumber: tenant.whatsappNumber ?? "",
            }}
          />
        </div>

        {/* Sección 2: MercadoPago */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Cobros online</h2>
          <MpConfigForm
            tenantId={tenant.id}
            slug={slug}
            configActual={{
              accessTokenConfigurado,
              accessTokenUltimos4,
              expiryMinutes: tenant.mpExpiryMinutes,
              senaPercentage: tenant.mpSenaPercentage,
            }}
          />
        </div>

      </section>
    </main>
  )
}
