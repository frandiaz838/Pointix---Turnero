import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"
import { prisma } from "@/lib/prisma"

interface Props {
  tenantId: string
  slug: string
  tieneMp: boolean
}

// Primeros pasos para un club nuevo. Cada paso se tacha solo según los datos
// reales; la tarjeta desaparece cuando el club ya recibió su primera reserva
// con todo lo demás configurado.
export async function OnboardingChecklist({ tenantId, slug, tieneMp }: Props) {
  const [canchas, horarios, reservas, canchaSinHorario] = await Promise.all([
    prisma.court.count({ where: { tenantId, archivedAt: null } }),
    prisma.schedule.count({ where: { court: { tenantId, archivedAt: null } } }),
    prisma.booking.count({ where: { tenantId } }),
    prisma.court.findFirst({
      where: { tenantId, archivedAt: null, schedules: { none: {} } },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const pasos = [
    {
      hecho: canchas > 0,
      titulo: "Creá tu primera cancha",
      desc: "Deporte y precio por turno.",
      href: `/dashboard/${slug}/canchas/nueva`,
    },
    {
      hecho: horarios > 0,
      titulo: "Configurá los horarios",
      desc: "Qué días abrís y en qué franja. Sin horarios no se muestran turnos.",
      href: canchaSinHorario
        ? `/dashboard/${slug}/canchas/${canchaSinHorario.id}?tab=horarios`
        : `/dashboard/${slug}/canchas/nueva`,
    },
    {
      hecho: tieneMp,
      titulo: "Configurá cómo cobrar la seña (opcional)",
      desc: "MercadoPago o transferencia, para cobrar por adelantado.",
      href: `/dashboard/${slug}/configuracion`,
    },
    {
      hecho: reservas > 0,
      titulo: "Compartí tu link y recibí la primera reserva",
      desc: `pointix.com.ar/${slug} — pasalo por WhatsApp o ponelo en tu Instagram.`,
      href: `/dashboard/${slug}/configuracion`,
    },
  ]

  // MP es opcional: no frena que la tarjeta se cierre.
  const completo = pasos.filter((p, i) => i !== 2).every((p) => p.hecho)
  if (completo) return null

  const hechos = pasos.filter((p) => p.hecho).length

  return (
    <section className="glass-card rounded-2xl p-5 space-y-4 border border-[#A3FF12]/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#A3FF12] uppercase tracking-[0.18em]">Primeros pasos</p>
          <h2 className="font-display font-black uppercase text-white text-xl leading-tight tracking-tight">
            Dejá tu complejo listo para reservar
          </h2>
        </div>
        <span className="text-xs font-semibold text-white/55 whitespace-nowrap">{hechos} de {pasos.length}</span>
      </div>

      <ol className="space-y-2">
        {pasos.map((p) => (
          <li key={p.titulo}>
            <Link
              href={p.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                p.hecho ? "border-transparent opacity-50" : "border-white/[0.06] hover:border-[#A3FF12]/30 hover:bg-white/[0.03]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                  p.hecho ? "bg-[#A3FF12] border-transparent" : "border-white/20"
                }`}
              >
                {p.hecho && <Check className="w-3.5 h-3.5 text-black" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${p.hecho ? "text-white/60 line-through" : "text-white"}`}>{p.titulo}</span>
                {!p.hecho && <span className="block text-xs text-white/55">{p.desc}</span>}
              </span>
              {!p.hecho && <ChevronRight className="w-4 h-4 text-white/45 shrink-0" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
