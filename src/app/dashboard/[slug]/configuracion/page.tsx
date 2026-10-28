import { notFound, redirect } from "next/navigation"
import { PageHeader, PageBody, SectionTitle } from "@/components/admin/page-header"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { MpConfigForm } from "@/components/admin/mp-config-form"
import { SenaForm } from "@/components/admin/sena-form"
import { TransferConfigForm } from "@/components/admin/transfer-config-form"
import { DatosClubForm } from "@/components/admin/datos-club-form"
import { ShareLinkCard } from "@/components/admin/share-link-card"
import { CerrarSesionTodosBtn } from "@/components/admin/cerrar-sesion-todos-btn"
import { tokenSuffix } from "@/lib/crypto"

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
      transferEnabled: true,
      transferAlias: true,
      transferCbu: true,
      transferHolder: true,
      transferBank: true,
      transferExpiryMinutes: true,
      courts: { where: { archivedAt: null }, select: { pricePerHour: true }, take: 1, orderBy: { createdAt: "asc" } },
    },
  })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const token = tenant.mpAccessToken
  const accessTokenConfigurado = !!token
  // El token puede estar cifrado en la DB — tokenSuffix lo descifra y
  // devuelve los últimos 4 chars del valor plaintext real (fingerprint UI).
  const accessTokenUltimos4 = tokenSuffix(token, 4)

  // URL publica de reservas del club. Fallback al dominio canonical
  // para que aunque NEXT_PUBLIC_APP_URL no este seteada en dev/preview,
  // el link mostrado siga apuntando al sitio real.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pointix.com.ar"
  const linkPublico = `${appUrl}/${slug}`

  return (
    <PageBody angosto>
      <PageHeader titulo="Configuración" descripcion="Datos del club, link de reservas, cobros con MercadoPago y seguridad." />

      <div className="space-y-10">

        {/* Sección: link público de reservas */}
        <div className="space-y-3">
          <SectionTitle>Link para compartir</SectionTitle>
          <ShareLinkCard url={linkPublico} clubName={tenant.name} />
        </div>

        {/* Sección 1: Datos del club */}
        <div className="space-y-3">
          <SectionTitle>Datos del club</SectionTitle>
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

        {/* Sección 2: Cobro de la seña — % común + los dos medios */}
        <div className="space-y-3">
          <SectionTitle>Seña</SectionTitle>
          <SenaForm
            tenantId={tenant.id}
            slug={slug}
            senaActual={tenant.mpSenaPercentage}
            precioEjemplo={tenant.courts[0] ? Number(tenant.courts[0].pricePerHour) : 20000}
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>Cobro con MercadoPago</SectionTitle>
          <MpConfigForm
            tenantId={tenant.id}
            slug={slug}
            configActual={{
              accessTokenConfigurado,
              accessTokenUltimos4,
              expiryMinutes: tenant.mpExpiryMinutes,
            }}
          />
        </div>

        <div className="space-y-3">
          <SectionTitle>Cobro por transferencia</SectionTitle>
          <TransferConfigForm
            tenantId={tenant.id}
            slug={slug}
            tieneWhatsapp={!!tenant.whatsappNumber}
            inicial={{
              enabled: tenant.transferEnabled,
              alias: tenant.transferAlias ?? "",
              cbu: tenant.transferCbu ?? "",
              holder: tenant.transferHolder ?? "",
              bank: tenant.transferBank ?? "",
              expiryMinutes: tenant.transferExpiryMinutes,
            }}
          />
        </div>

        {/* Sección 3: Seguridad */}
        <div className="space-y-3">
          <SectionTitle>Seguridad</SectionTitle>
          <CerrarSesionTodosBtn />
        </div>

      </div>
    </PageBody>
  )
}
