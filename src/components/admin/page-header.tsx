import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"

interface Props {
  titulo: ReactNode
  descripcion?: ReactNode
  /** Solo para sub-pantallas (editar, nueva…). Las secciones principales se navegan desde el menú. */
  volver?: { href: string; label: string }
  /** Acción principal (y opcionalmente una secundaria) a la derecha. */
  acciones?: ReactNode
}

// Encabezado común de todas las pantallas del panel del club.
export function PageHeader({ titulo, descripcion, volver, acciones }: Props) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        {volver && (
          <Link
            href={volver.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {volver.label}
          </Link>
        )}
        <h1 className="font-display font-black uppercase text-white text-3xl sm:text-4xl leading-none tracking-tight">
          {titulo}
        </h1>
        {descripcion && <p className="text-base text-white/55">{descripcion}</p>}
      </div>
      {/* En mobile las acciones ocupan el ancho completo, repartidas en partes iguales */}
      {acciones && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
          {acciones}
        </div>
      )}
    </header>
  )
}

/** Contenedor de contenido estándar de las pantallas del panel. */
export function PageBody({ children, angosto = false }: { children: ReactNode; angosto?: boolean }) {
  return (
    <div className={`relative z-10 mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 ${angosto ? "max-w-3xl" : "max-w-6xl"}`}>
      {children}
    </div>
  )
}

/** Título de sección dentro de una pantalla. */
export function SectionTitle({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-bold text-white/60 uppercase tracking-[0.14em]">{children}</h2>
      {accion}
    </div>
  )
}

export const btnPrimario =
  "btn-lime-glow inline-flex items-center justify-center gap-2 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
export const btnSecundario =
  "inline-flex items-center justify-center gap-2 border border-white/12 hover:border-white/30 hover:bg-white/[0.04] text-white/85 hover:text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
