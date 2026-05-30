import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { CanchaForm } from "@/components/admin/cancha-form"

interface Props {
  params: Promise<{ slug: string; courtId: string }>
}

export default async function EditarCanchaPage({ params }: Props) {
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

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-sm text-gray-500 hover:text-gray-800">
          ← Volver al panel
        </Link>
        <h1 className="text-xl font-bold mt-1">Editar cancha</h1>
      </header>

      <section className="max-w-lg mx-auto p-6">
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
      </section>
    </main>
  )
}
