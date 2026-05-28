import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TenantPage({ params }: Props) {
  const { slug } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      courts: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!tenant) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        {tenant.description && (
          <p className="text-gray-500 text-sm mt-1">{tenant.description}</p>
        )}
      </header>

      <section className="max-w-4xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-4">Canchas disponibles</h2>

        {tenant.courts.length === 0 ? (
          <p className="text-gray-500">No hay canchas disponibles por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tenant.courts.map((court) => (
              <div key={court.id} className="bg-white rounded-lg border p-4 space-y-1">
                <p className="font-medium">{court.name}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {court.sport === "PADEL" ? "Pádel" : "Fútbol"}
                </p>
                <p className="text-sm font-semibold">
                  ${Number(court.pricePerHour).toLocaleString("es-AR")} / hora
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
