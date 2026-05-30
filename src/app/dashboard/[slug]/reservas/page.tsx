import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/session"
import { Badge } from "@/components/ui/badge"
import { CancelarReservaBtn } from "@/components/admin/cancelar-reserva-btn"

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ fecha?: string }>
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES_MIN = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]

function formatFechaCorta(isoDate: string) {
  const d = new Date(isoDate + "T12:00:00Z")
  return `${DIAS_CORTOS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES_MIN[d.getUTCMonth()]}`
}

const estadoVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "default",
}

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
}

export default async function ReservasAdminPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { fecha } = await searchParams
  const session = await auth()

  const tenant = await prisma.tenant.findUnique({ where: { slug } })
  if (!tenant) notFound()

  if (!session?.user || session.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    redirect("/dashboard")
  }

  const fechaFiltro = fecha ?? new Date().toISOString().split("T")[0]
  const inicio = new Date(`${fechaFiltro}T00:00:00.000Z`)
  const fin = new Date(`${fechaFiltro}T23:59:59.999Z`)

  const reservas = await prisma.booking.findMany({
    where: {
      tenantId: tenant.id,
      startTime: { gte: inicio, lte: fin },
    },
    include: {
      user: { select: { name: true, email: true } },
      court: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <Link href={`/dashboard/${slug}`} className="text-sm text-gray-500 hover:text-gray-800">
            ← Volver al panel
          </Link>
          <h1 className="text-xl font-bold mt-1">Reservas</h1>
        </div>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-3">
        {/* Navegación de fechas */}
        <div className="flex flex-wrap gap-2 text-sm">
          {[-1, 0, 1, 2].map((offset) => {
            const d = new Date()
            d.setDate(d.getDate() + offset)
            const f = d.toISOString().split("T")[0]
            const label = offset === 0 ? "Hoy" : offset === 1 ? "Mañana" : formatFechaCorta(f)
            return (
              <Link
                key={f}
                href={`/dashboard/${slug}/reservas?fecha=${f}`}
                className={`px-3 py-1 rounded-md border ${f === fechaFiltro ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {reservas.length === 0 ? (
          <p className="text-gray-500">No hay reservas para esta fecha.</p>
        ) : (
          <div className="space-y-3">
            {reservas.map((r) => (
              <div key={r.id} className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {r.startTime.getUTCHours().toString().padStart(2, "0")}:00 hs
                    </p>
                    <Badge variant={estadoVariant[r.status]}>
                      {estadoLabel[r.status]}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{r.court.name}</p>
                  <p className="text-sm text-gray-500">
                    {r.user
                      ? (r.user.name ?? r.user.email)
                      : `${r.guestName} · ${r.guestPhone} (invitado)`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm">
                    ${Number(r.totalPrice).toLocaleString("es-AR")}
                  </p>
                  {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                    <CancelarReservaBtn bookingId={r.id} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
