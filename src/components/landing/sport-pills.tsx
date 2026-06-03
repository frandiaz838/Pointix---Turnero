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
    <div className="flex flex-wrap justify-center gap-2">
      {sports.map(({ sport, label, emoji }) => (
        <button
          key={sport}
          onClick={() => scrollTo(sport)}
          className="flex items-center gap-1.5 bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer tracking-wide uppercase"
        >
          {emoji ?? "🎾"} {label}
        </button>
      ))}
      <span className="flex items-center gap-1.5 bg-[#CAFF00]/[0.08] border border-[#CAFF00]/20 text-[#CAFF00]/60 text-xs font-semibold px-4 py-1.5 rounded-full select-none tracking-wide uppercase">
        📅 Reserva 24hs
      </span>
    </div>
  )
}
