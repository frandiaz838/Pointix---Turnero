import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

interface Accion {
  label: string
  href: string
  variant?: "primary" | "outline"
}

interface Props {
  icon: LucideIcon
  titulo: string
  descripcion?: ReactNode
  acciones?: Accion[]
}

// Empty state accionable: ícono + título + descripción + 1-2 CTAs.
// Centrado, con padding generoso, glass-card.
export function EmptyState({ icon: Icon, titulo, descripcion, acciones }: Props) {
  return (
    <div className="glass-card rounded-2xl px-6 py-10 flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        <Icon className="w-5 h-5 text-white/35" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-sm font-semibold text-white/75">{titulo}</p>
        {descripcion && (
          <p className="text-xs text-white/40 leading-relaxed">{descripcion}</p>
        )}
      </div>
      {acciones && acciones.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {acciones.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className={
                a.variant === "outline"
                  ? "px-3 py-2 rounded-lg text-sm font-medium glass-nav text-white/70 hover:text-white transition-colors"
                  : "btn-lime-glow inline-flex items-center bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-4 py-2 rounded-xl"
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
