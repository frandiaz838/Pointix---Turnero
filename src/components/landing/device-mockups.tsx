import { CalendarDays, TrendingUp, LayoutGrid, Settings, ChevronRight, Check } from "lucide-react"

// ─── Data compartida ─────────────────────────────────────────────────────────

const KPIS = [
  { label: "Reservas hoy", value: "12",       icon: CalendarDays, accent: "text-white"        as const },
  { label: "Ingresos hoy", value: "$48.500", icon: TrendingUp,   accent: "text-[#A3FF12]"   as const },
  { label: "Ocupación",    value: "73%",     icon: LayoutGrid,   accent: "text-white"        as const },
]

const SEMANA = [
  { dia: "L", h: 35 },
  { dia: "M", h: 50 },
  { dia: "X", h: 42 },
  { dia: "J", h: 65 },
  { dia: "V", h: 78 },
  { dia: "S", h: 100 },
  { dia: "D", h: 88 },
]
const HOY_INDEX = 5

const RESERVAS = [
  { hora: "18:00", cancha: "Cancha 1 · Pádel",    cliente: "Juan P.",   monto: "$5.000",   ok: true  },
  { hora: "19:00", cancha: "Cancha 2 · Pádel",    cliente: "María L.",  monto: "$5.000",   ok: false },
  { hora: "20:00", cancha: "Cancha 3 · Fútbol 5", cliente: "Carlos R.", monto: "$6.500",   ok: true  },
]

const CANCHAS = [
  { name: "Cancha 1 · Pádel",    ocupacion: "85%" },
  { name: "Cancha 2 · Pádel",    ocupacion: "70%" },
  { name: "Cancha 3 · Fútbol 5", ocupacion: "62%" },
]

// ─── Mockup MacBook ──────────────────────────────────────────────────────────

export function MacBookMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Pantalla (bisel) */}
      <div
        className="rounded-t-2xl p-2 shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #2c2c2e 0%, #1a1a1c 100%)",
          aspectRatio: "16 / 10",
        }}
      >
        <div
          className="w-full h-full rounded-md overflow-hidden relative"
          style={{ background: "#0C0E14" }}
        >
          {/* Cámara webcam */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-700/70 z-10" />

          {/* Dashboard desktop */}
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col gap-3 overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A3FF12] animate-pulse" />
                <span
                  className="font-display font-black text-white text-sm leading-none"
                  style={{ letterSpacing: "0.035em" }}
                >
                  Club Río · Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="p-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
                  <Settings className="w-3 h-3 text-white/55" />
                </button>
              </div>
            </div>

            {/* KPIs (3 col) */}
            <div className="grid grid-cols-3 gap-2">
              {KPIS.map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <div key={i} className="rounded-lg bg-white/[0.025] border border-white/[0.05] p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em]">
                        {kpi.label}
                      </span>
                      <Icon className="w-2.5 h-2.5 text-white/30" />
                    </div>
                    <p
                      className={`font-display font-black ${kpi.accent} text-xl leading-none tabular-nums`}
                      style={{ letterSpacing: "0.025em" }}
                    >
                      {kpi.value}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Layout 2 cols: gráfico + lista */}
            <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">

              {/* Gráfico (3 cols) */}
              <div className="col-span-3 rounded-lg bg-white/[0.02] border border-white/[0.05] p-2.5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em]">
                    Ingresos esta semana
                  </span>
                  <span className="text-[8px] font-bold text-[#A3FF12]/70 uppercase tracking-wider">
                    +18%
                  </span>
                </div>
                <div className="flex items-end justify-between gap-1 flex-1">
                  {SEMANA.map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${d.h}%`,
                        background: i === HOY_INDEX
                          ? "linear-gradient(180deg, #A3FF12 0%, rgba(163,255,18,0.3) 100%)"
                          : "linear-gradient(180deg, rgba(163,255,18,0.6) 0%, rgba(163,255,18,0.15) 100%)",
                        boxShadow: i === HOY_INDEX ? "0 0 8px rgba(163,255,18,0.5)" : "none",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-1 mt-1.5">
                  {SEMANA.map((d, i) => (
                    <span
                      key={i}
                      className={`flex-1 text-center text-[8px] font-bold ${
                        i === HOY_INDEX ? "text-[#A3FF12]" : "text-white/30"
                      }`}
                    >
                      {d.dia}
                    </span>
                  ))}
                </div>
              </div>

              {/* Próximas reservas (2 cols) */}
              <div className="col-span-2 rounded-lg bg-white/[0.02] border border-white/[0.05] p-2.5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em]">
                    Próximas
                  </span>
                  <ChevronRight className="w-2.5 h-2.5 text-white/30" />
                </div>
                <div className="space-y-1 flex-1 overflow-hidden">
                  {RESERVAS.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-white/[0.02] border border-white/[0.04]"
                    >
                      <span className="text-[9px] font-mono font-bold text-white/55 tabular-nums shrink-0">
                        {r.hora}
                      </span>
                      <span className="text-[9px] text-white/60 truncate flex-1">{r.cliente}</span>
                      <div
                        className={`w-3 h-3 shrink-0 rounded-full flex items-center justify-center ${
                          r.ok
                            ? "bg-[#A3FF12]/20 text-[#A3FF12]"
                            : "bg-yellow-400/15 text-yellow-400"
                        }`}
                      >
                        {r.ok ? <Check className="w-2 h-2" /> : <span className="text-[7px] font-bold">…</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canchas activas */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              {CANCHAS.map((c, i) => (
                <div key={i} className="rounded-md bg-white/[0.02] border border-white/[0.04] px-2 py-1.5">
                  <p className="text-[9px] font-semibold text-white truncate leading-tight">{c.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[8px] text-white/40">Ocupación</span>
                    <span className="text-[8px] font-bold text-[#A3FF12]">{c.ocupacion}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Base de la MacBook */}
      <div
        className="relative h-3 rounded-b-2xl mx-auto"
        style={{
          width: "112%",
          marginLeft: "-6%",
          background: "linear-gradient(180deg, #2c2c2e 0%, #18181a 100%)",
        }}
      >
        {/* Trackpad notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-1 rounded-b-md"
          style={{
            width: "12%",
            background: "#0F0F11",
          }}
        />
      </div>
    </div>
  )
}

// ─── Mockup iPhone con Dynamic Island ────────────────────────────────────────

export function IPhoneMockup() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: "260px", aspectRatio: "9 / 19.5" }}
    >
      {/* Chasis */}
      <div
        className="absolute inset-0 rounded-[2.75rem] p-[6px] shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #3a3a3c 0%, #1a1a1c 100%)",
        }}
      >
        {/* Pantalla */}
        <div
          className="w-full h-full rounded-[2.4rem] overflow-hidden relative"
          style={{ background: "#0C0E14" }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[78px] h-[26px] rounded-full bg-black z-20 flex items-center justify-end pr-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A3FF12]/40 animate-pulse" />
          </div>

          {/* Status bar (hora a la izq, signal/wifi/battery a la der) */}
          <div className="absolute top-2 inset-x-0 px-6 flex items-center justify-between z-10 pointer-events-none">
            <span className="text-[10px] font-bold text-white tabular-nums">9:41</span>
            <div className="flex items-center gap-1">
              {/* Signal */}
              <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
                <rect x="0" y="6" width="2" height="3" rx="0.5" fill="white" />
                <rect x="3" y="4" width="2" height="5" rx="0.5" fill="white" />
                <rect x="6" y="2" width="2" height="7" rx="0.5" fill="white" />
                <rect x="9" y="0" width="2" height="9" rx="0.5" fill="white" />
              </svg>
              {/* Battery */}
              <div className="flex items-center">
                <div className="w-5 h-2.5 rounded-[3px] border border-white/90 px-px py-px">
                  <div className="h-full w-[80%] rounded-[1px] bg-white" />
                </div>
                <div className="w-0.5 h-1 rounded-r bg-white/90 -ml-px" />
              </div>
            </div>
          </div>

          {/* Contenido del dashboard mobile */}
          <div className="absolute inset-0 pt-11 pb-3 px-3 flex flex-col gap-2.5 overflow-hidden">

            {/* Header club */}
            <div className="pb-2 border-b border-white/[0.06]">
              <p
                className="font-display font-black uppercase text-white text-base leading-none"
                style={{ letterSpacing: "0.035em" }}
              >
                Club Río
              </p>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.18em] mt-1">
                Panel admin · Hoy
              </p>
            </div>

            {/* KPI principal: ingresos hoy */}
            <div className="rounded-lg bg-[#A3FF12]/[0.04] border border-[#A3FF12]/15 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-bold text-[#A3FF12]/60 uppercase tracking-[0.18em]">
                  Ingresos hoy
                </span>
                <TrendingUp className="w-2.5 h-2.5 text-[#A3FF12]/50" />
              </div>
              <p
                className="font-display font-black text-[#A3FF12] text-2xl leading-none tabular-nums"
                style={{ letterSpacing: "0.025em" }}
              >
                $48.500
              </p>
            </div>

            {/* KPIs secundarios (2 cols) */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-white/[0.025] border border-white/[0.05] p-2">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em] block mb-0.5">
                  Reservas
                </span>
                <p className="font-display font-black text-white text-base leading-none">12</p>
              </div>
              <div className="rounded-lg bg-white/[0.025] border border-white/[0.05] p-2">
                <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em] block mb-0.5">
                  Ocupación
                </span>
                <p className="font-display font-black text-white text-base leading-none">73%</p>
              </div>
            </div>

            {/* Mini gráfico */}
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em]">
                Esta semana
              </span>
              <div className="flex items-end justify-between gap-0.5 h-10">
                {SEMANA.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${d.h}%`,
                      background: i === HOY_INDEX
                        ? "linear-gradient(180deg, #A3FF12 0%, rgba(163,255,18,0.3) 100%)"
                        : "linear-gradient(180deg, rgba(163,255,18,0.5) 0%, rgba(163,255,18,0.1) 100%)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Próximas reservas (lista compacta) */}
            <div className="space-y-1 flex-1 min-h-0">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.18em]">
                Próximas
              </span>
              {RESERVAS.slice(0, 3).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-[9px] font-mono font-bold text-white/55 tabular-nums shrink-0 w-8">
                    {r.hora}
                  </span>
                  <span className="text-[9px] text-white/65 truncate flex-1">{r.cliente}</span>
                  <span className="text-[9px] font-bold text-white tabular-nums shrink-0">{r.monto}</span>
                </div>
              ))}
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[100px] h-1 rounded-full bg-white/35" />
          </div>
        </div>
      </div>
    </div>
  )
}
