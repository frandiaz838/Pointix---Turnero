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
    <main className="min-h-screen bg-[#0C0E14] relative">
      <div
        className="pointer-events-none fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)" }}
      />
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <Link href={`/dashboard/${slug}`} className="text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
          ← Volver al panel
        </Link>
        <h1 className="font-display font-black uppercase text-white text-xl leading-none tracking-tight mt-1">Nueva cancha</h1>
      </header>

      <section className="relative z-10 max-w-lg mx-auto p-6">
        <CanchaForm tenantId={tenant.id} slug={slug} />
      </section>
    </main>
  )
}
