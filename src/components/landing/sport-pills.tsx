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
    <div className="flex flex-wrap justify-center gap-2.5">
      {sports.map(({ sport, label, emoji }) => (
        <button
          key={sport}
          onClick={() => scrollTo(sport)}
          className="flex items-center gap-2 glass-nav text-white/60 hover:text-white text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer tracking-wide uppercase hover:bg-white/[0.1] hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-95"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
        >
          {emoji ?? "🎾"} {label}
        </button>
      ))}
      <span
        className="flex items-center gap-2 text-[#A3FF12]/70 text-xs font-bold px-4 py-2 rounded-full select-none tracking-wide uppercase"
        style={{
          background: "rgba(163,255,18,0.07)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(163,255,18,0.2)",
          boxShadow: "0 0 20px rgba(163,255,18,0.08), 0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        📅 Reserva 24hs
      </span>
    </div>
  )
}
