"use client"

interface Props {
  sports: Array<{
    sport: string
    label: string
    emoji: string | null
  }>
}

function sectionId(sport: string) {
  return `seccion-${sport.toLowerCase().replace(/_/g, "-")}`
}

export function SportPills({ sports }: Props) {
  function scrollTo(sport: string) {
    document.getElementById(sectionId(sport))?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 pt-1">
      {sports.map(({ sport, label, emoji }) => (
        <button
          key={sport}
          onClick={() => scrollTo(sport)}
          className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-200 hover:text-gray-800 transition-colors cursor-pointer"
        >
          {(emoji ?? "🎾")} {label}
        </button>
      ))}
      <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 select-none">
        📅 Reserva online 24hs
      </span>
    </div>
  )
}
