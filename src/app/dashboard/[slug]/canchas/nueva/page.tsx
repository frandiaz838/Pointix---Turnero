import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { CanchaForm } from "@/components/admin/cancha-form"

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
    <main className="min-h-screen bg-[#0C0E14]">
      <header className="bg-[#0C0E14] border-b border-white/[0.07] px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="text-lg font-bold text-white mt-1">Nueva cancha</h1>
      </header>

      <section className="max-w-lg mx-auto p-6">
        <CanchaForm tenantId={tenant.id} slug={slug} />
      </section>
    </main>
  )
}
