import Link from "next/link"

export type PeriodoIngresos = "hoy" | "este-mes" | "mes-pasado" | "este-año" | "año-pasado"

const OPCIONES: { key: PeriodoIngresos; label: string }[] = [
  { key: "hoy",        label: "Hoy" },
  { key: "este-mes",   label: "Este mes" },
  { key: "mes-pasado", label: "Mes pasado" },
  { key: "este-año",   label: "Este año" },
  { key: "año-pasado", label: "Año pasado" },
]

export function PeriodoSelector({
  slug,
  activo,
  basePath = "ingresos",
}: {
  slug: string
  activo: PeriodoIngresos
  basePath?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPCIONES.map(({ key, label }) => (
        <Link
          key={key}
          href={
            key === "este-mes"
              ? `/dashboard/${slug}/${basePath}`
              : `/dashboard/${slug}/${basePath}?periodo=${key}`
          }
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activo === key
              ? "btn-lime-glow bg-[#A3FF12] text-black"
              : "glass-nav text-white/60 hover:text-white"
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
