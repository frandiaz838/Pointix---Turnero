"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { buttonVariants } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { es } from "date-fns/locale"

interface Props {
  slug: string
  periodoActivo: string
  fechaSeleccionada: string | null
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES_MIN = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

function formatFechaCorta(iso: string) {
  const d = new Date(iso + "T12:00:00Z")
  return `${DIAS_CORTOS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES_MIN[d.getUTCMonth()]}`
}

const BOTONES = [
  { key: "hoy",      label: "Hoy",                  href: (s: string) => `/dashboard/${s}/reservas` },
  { key: "manana",   label: "Mañana",                href: (s: string) => `/dashboard/${s}/reservas?periodo=manana` },
  { key: "semana",   label: "Esta semana",           href: (s: string) => `/dashboard/${s}/reservas?periodo=semana` },
  { key: "2semanas", label: "Próximas 2 semanas",    href: (s: string) => `/dashboard/${s}/reservas?periodo=2semanas` },
]

export function ReservasControles({ slug, periodoActivo, fechaSeleccionada }: Props) {
  const router = useRouter()

  const selectedDate = fechaSeleccionada ? new Date(fechaSeleccionada + "T12:00:00Z") : undefined

  function handleDaySelect(date: Date | undefined) {
    if (!date) return
    const iso = date.toISOString().split("T")[0]
    router.push(`/dashboard/${slug}/reservas?fecha=${iso}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {BOTONES.map(({ key, label, href }) => (
        <Link
          key={key}
          href={href(slug)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            periodoActivo === key
              ? "btn-lime-glow bg-[#A3FF12] text-black border border-[#A3FF12]"
              : "glass-nav text-white/60 hover:text-white"
          }`}
        >
          {label}
        </Link>
      ))}

      <Popover>
        <PopoverTrigger
          className={`${buttonVariants({ variant: "outline", size: "sm" })} gap-1.5 ${
            periodoActivo === "custom"
              ? "border-[#A3FF12]/50 bg-[#A3FF12]/[0.08] text-[#A3FF12]"
              : ""
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          {periodoActivo === "custom" && fechaSeleccionada
            ? formatFechaCorta(fechaSeleccionada)
            : "Elegir fecha"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
