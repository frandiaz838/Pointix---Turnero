import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { CanchaForm } from "@/components/admin/cancha-form"
import { PageHeader, PageBody } from "@/components/admin/page-header"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function NuevaCanchaPage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  return (
    <PageBody angosto>
      <PageHeader
        titulo="Nueva cancha"
        descripcion="Después de crearla vas a poder cargar sus horarios."
        volver={{ href: `/dashboard/${slug}/canchas`, label: "Canchas" }}
      />
      <CanchaForm tenantId={tenant.id} slug={slug} />
    </PageBody>
  )
}
