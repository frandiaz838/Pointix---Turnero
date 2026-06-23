import { Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CreditCard, MessageCircle, Link2, Sparkles, Zap, ChevronRight, Check, Clock, TrendingUp, CalendarDays, LayoutGrid, Settings } from "lucide-react"

// Número del fundador para el botón "Hablar con un humano".
// Formato wa.me: dígitos, sin "+" ni espacios, con "9" para móvil AR.
const WHATSAPP_FUNDADOR = "5493543697964"
const MENSAJE_WSP_FUNDADOR = "Hola! Quiero sumar mi complejo a Pointix."

export default function Home() {
  const waUrl = `https://wa.me/${WHATSAPP_FUNDADOR}?text=${encodeURIComponent(MENSAJE_WSP_FUNDADOR)}`

  return (
    <main className="min-h-screen bg-toxic-gradient text-white relative overflow-x-hidden">

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-7 sm:py-9 flex items-center justify-between">
        <Link href="/" aria-label="Ir al inicio" className="block">
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={260}
            height={78}
            className="h-12 sm:h-16 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-[#A3FF12] hover:bg-[#d4ff1a] text-black text-sm font-bold rounded-xl px-4 py-2.5 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Hablar con un humano
          </a>
          <Link
            href="/login"
            className="text-sm sm:text-base font-medium text-white/75 hover:text-white transition-colors px-3 py-2.5"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-20 text-center">

        <p
          className="text-xs font-bold text-[#A3FF12]/80 uppercase mb-7"
          style={{
            letterSpacing: "0.4em",
            animation: "fadeInUp 0.5s ease 0.1s both",
          }}
        >
          Para complejos deportivos
        </p>

        <h1
          className="font-display font-black uppercase text-white max-w-4xl mx-auto"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5rem)",
            lineHeight: "1.05",
            letterSpacing: "0.025em",
            animation: "fadeInUp 0.5s ease 0.3s both",
          }}
        >
          Tus reservas,<br />
          <span className="text-[#A3FF12]">en piloto automático.</span>
        </h1>

        <p
          className="text-white/65 text-lg sm:text-xl mt-9 max-w-2xl mx-auto leading-relaxed"
          style={{ animation: "fadeInUp 0.5s ease 0.4s both" }}
        >
          Le damos a tu complejo una grilla online de turnos, cobros por MercadoPago y
          confirmaciones automáticas por mail y WhatsApp.
        </p>
        <p
          className="text-white/40 text-base sm:text-lg mt-4 max-w-2xl mx-auto leading-relaxed"
          style={{ animation: "fadeInUp 0.5s ease 0.45s both" }}
        >
          Tus clientes reservan en 30 segundos, vos cobrás antes y dejás de chatear hasta las 11 de la noche.
        </p>

        <div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}
        >
          <Link
            href="/register"
            className="group btn-lime-glow w-full sm:w-auto bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-base rounded-xl px-7 py-4 inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-200"
          >
            Sumar mi complejo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-base font-medium text-white/65 hover:text-white transition-colors px-5 py-4"
          >
            Ya tengo cuenta →
          </Link>
        </div>

        <p
          className="text-sm text-white/35 mt-10"
          style={{ animation: "fadeIn 0.5s ease 0.7s both" }}
        >
          ¿Buscás reservar como cliente? Pedile al complejo que te pase su link directo.
        </p>

        {/* Mock — lista de reservas */}
        <div
          className="relative mt-20 sm:mt-24 max-w-3xl mx-auto"
          style={{ animation: "fadeInUp 0.7s ease 0.8s both" }}
        >
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-40 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(163,255,18,0.35) 0%, transparent 65%)",
            }}
          />

          {/* Preview de la grilla del cliente */}
          <div className="relative glass-card rounded-2xl p-7 sm:p-9 text-left shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div>
                <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.22em]">
                  Así reservan tus clientes
                </p>
                <p
                  className="font-display font-black uppercase text-white text-2xl sm:text-3xl leading-none mt-2"
                  style={{ letterSpacing: "0.035em" }}
                >
                  Club Río
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.22em]">
                  Hoy
                </p>
                <p className="font-semibold text-white text-base mt-2">
                  Sáb 21 jun
                </p>
              </div>
            </div>

            {/* Filtros deporte */}
            <div className="flex items-center gap-2.5 mb-6">
              {[
                { label: "Todos", active: true },
                { label: "Pádel", active: false },
                { label: "Fútbol", active: false },
              ].map((tag, i) => (
                <button
                  key={i}
                  type="button"
                  className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all duration-200 hover:scale-105 ${
                    tag.active
                      ? "bg-[#A3FF12] text-black border-[#A3FF12] shadow-[0_0_16px_rgba(163,255,18,0.3)]"
                      : "bg-white/[0.03] text-white/55 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/85 hover:border-white/[0.15]"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>

            {/* Grilla — header de horas */}
            <div className="flex items-center gap-2 mb-2.5 pl-[96px] sm:pl-[140px]">
              {["17", "18", "19", "20", "21", "22"].map((h) => (
                <div key={h} className="flex-1 text-center text-xs font-mono font-bold text-white/40">
                  {h}:00
                </div>
              ))}
            </div>

            {/* Grilla — filas de canchas */}
            <div className="space-y-2">
              {[
                { cancha: "Cancha 1", sport: "Pádel", slots: ["c", "c", "o", "d", "d", "d"] },
                { cancha: "Cancha 2", sport: "Pádel", slots: ["c", "o", "c", "c", "d", "d"] },
                { cancha: "Cancha 3", sport: "Fútbol 5", slots: ["c", "c", "c", "d", "d", "d"] },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-[88px] sm:w-[132px] shrink-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                      {row.cancha}
                    </p>
                    <p className="text-[11px] text-white/40 leading-tight mt-0.5">{row.sport}</p>
                  </div>
                  {row.slots.map((s, j) => (
                    <div
                      key={j}
                      className={`flex-1 h-12 sm:h-14 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                        s === "c"
                          ? "bg-[#A3FF12]/10 border-[#A3FF12]/30 hover:bg-[#A3FF12]/25 hover:border-[#A3FF12]/60 hover:scale-110 cursor-pointer hover:shadow-[0_0_12px_rgba(163,255,18,0.4)]"
                          : s === "o"
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-white/[0.025] border-white/[0.05]"
                      }`}
                    >
                      {s === "c" && <Check className="w-4 h-4 text-[#A3FF12]" />}
                      {s === "o" && <span className="text-xs font-bold text-red-400">×</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer leyenda + CTA */}
            <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-xs sm:text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF12]/50" /> Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500/50" /> Ocupado
                </span>
              </div>
              <span className="text-sm font-semibold text-[#A3FF12]">
                Reservás en 30 segundos →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28">

        <div className="text-center mb-16 sm:mb-20">
          <p
            className="text-xs font-bold text-[#A3FF12]/80 uppercase mb-5"
            style={{ letterSpacing: "0.4em" }}
          >
            Cómo funciona
          </p>
          <h2
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: "1.08",
              letterSpacing: "0.025em",
            }}
          >
            En 3 pasos<br />
            <span className="text-white/30">estás cobrando.</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-5 md:gap-3">
          {[
            {
              num: "01",
              icon: CreditCard,
              titulo: "Conectás MercadoPago",
              desc: "Pegás tu Access Token de MP en 2 clics. La plata cae directo a tu cuenta — Pointix no toca ni un peso.",
              reaseguro: "¿No sabés cómo? Lo hacemos juntos.",
            },
            {
              num: "02",
              icon: Sparkles,
              titulo: "Cargás canchas y horarios",
              desc: "Definís tus canchas, deportes, precios y horarios de cada día de la semana. Listo en 5 minutos.",
              reaseguro: null,
            },
            {
              num: "03",
              icon: Link2,
              titulo: "Compartís el link",
              desc: "Subís el link a tu Instagram, lo mandás por WhatsApp y empezás a recibir reservas pagas automáticamente.",
              reaseguro: null,
            },
          ].map((paso, i, arr) => {
            const Icon = paso.icon
            return (
              <Fragment key={i}>
                <div
                  className="group glass-card flex-1 rounded-2xl p-7 sm:p-8 space-y-5 border border-white/[0.06] hover:border-[#A3FF12]/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_32px_rgba(163,255,18,0.12)]"
                  style={{ animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/30 flex items-center justify-center group-hover:bg-[#A3FF12]/20 group-hover:border-[#A3FF12]/50 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-5 h-5 text-[#A3FF12]" />
                    </div>
                    <span
                      className="text-[10px] font-bold text-[#A3FF12]/70 uppercase"
                      style={{ letterSpacing: "0.32em" }}
                    >
                      Paso {paso.num}
                    </span>
                  </div>
                  <h3
                    className="font-display font-black uppercase text-white text-xl sm:text-2xl"
                    style={{ lineHeight: "1.15", letterSpacing: "0.04em" }}
                  >
                    {paso.titulo}
                  </h3>
                  <p className="text-base text-white/55 leading-relaxed">
                    {paso.desc}
                  </p>
                  {paso.reaseguro && (
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-white/[0.06] text-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#A3FF12] shrink-0" />
                      <span className="text-[#A3FF12]/90 font-medium">
                        {paso.reaseguro}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chevron entre cards (no después del último) */}
                {i < arr.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 md:py-0 py-1">
                    <ChevronRight className="w-7 h-7 text-[#A3FF12]/40 md:rotate-0 rotate-90" />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </section>

      {/* Panel de admin — mock con KPIs + gráfico */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28">

        <div className="text-center mb-14 sm:mb-16">
          <p
            className="text-xs font-bold text-[#A3FF12]/80 uppercase mb-5"
            style={{ letterSpacing: "0.4em" }}
          >
            Tu panel de control
          </p>
          <h2
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: "1.08",
              letterSpacing: "0.025em",
            }}
          >
            Mirá todo desde<br />
            <span className="text-white/30">un solo lugar.</span>
          </h2>
          <p className="text-white/55 text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Ingresos del día, ocupación por cancha, próximas reservas, canchas activas — todo a un click. Sin planillas, sin Excel, sin perderte de nada.
          </p>
        </div>

        {/* Mock del dashboard admin */}
        <div className="relative max-w-4xl mx-auto">
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 30%, rgba(163,255,18,0.3) 0%, transparent 60%)",
            }}
          />

          <div className="relative glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">

            {/* Header del dashboard */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#A3FF12] animate-pulse" />
                <span
                  className="font-display font-black text-white text-base sm:text-lg leading-none"
                  style={{ letterSpacing: "0.035em" }}
                >
                  Club Río · Admin
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
                  <Settings className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              {[
                { label: "Reservas hoy", value: "12", icon: CalendarDays, accent: "text-white" },
                { label: "Ingresos hoy", value: "$48.500", icon: TrendingUp, accent: "text-[#A3FF12]" },
                { label: "Ocupación", value: "73%", icon: LayoutGrid, accent: "text-white" },
              ].map((kpi, i) => {
                const Icon = kpi.icon
                return (
                  <div
                    key={i}
                    className="group/kpi rounded-xl bg-white/[0.025] border border-white/[0.05] p-3 sm:p-4 hover:bg-white/[0.04] hover:border-[#A3FF12]/25 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover/kpi:text-white/60 transition-colors">
                        {kpi.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-white/30 group-hover/kpi:text-[#A3FF12]/70 transition-colors" />
                    </div>
                    <p
                      className={`font-display font-black ${kpi.accent} text-xl sm:text-3xl leading-none`}
                      style={{ letterSpacing: "0.025em" }}
                    >
                      {kpi.value}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Gráfico de barras */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 sm:p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  Ingresos esta semana
                </span>
                <span className="text-[10px] font-bold text-[#A3FF12]/70 uppercase tracking-wider">
                  +18% vs semana pasada
                </span>
              </div>
              {(() => {
                const data = [
                  { dia: "L", h: 35 },
                  { dia: "M", h: 50 },
                  { dia: "X", h: 42 },
                  { dia: "J", h: 65 },
                  { dia: "V", h: 78 },
                  { dia: "S", h: 100 },
                  { dia: "D", h: 88 },
                ]
                return (
                  <>
                    <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-24 sm:h-28 mb-2">
                      {data.map((d, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md transition-all"
                          style={{
                            height: `${d.h}%`,
                            background:
                              i === 5
                                ? "linear-gradient(180deg, #A3FF12 0%, rgba(163,255,18,0.3) 100%)"
                                : "linear-gradient(180deg, rgba(163,255,18,0.6) 0%, rgba(163,255,18,0.15) 100%)",
                            boxShadow: i === 5 ? "0 0 16px rgba(163,255,18,0.5)" : "none",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                      {data.map((d, i) => (
                        <span
                          key={i}
                          className={`flex-1 text-center text-[10px] font-bold ${
                            i === 5 ? "text-[#A3FF12]" : "text-white/30"
                          }`}
                        >
                          {d.dia}
                        </span>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Canchas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  Canchas activas
                </span>
                <a href="#" className="text-[10px] font-semibold text-[#A3FF12]/70 hover:text-[#A3FF12] flex items-center gap-1">
                  Gestionar <ChevronRight className="w-3 h-3" />
                </a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: "Cancha 1 · Pádel", ocupacion: "85%" },
                  { name: "Cancha 2 · Pádel", ocupacion: "70%" },
                  { name: "Cancha 3 · Fútbol 5", ocupacion: "62%" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5 hover:bg-white/[0.05] hover:border-[#A3FF12]/20 transition-all duration-200 cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-white/40">Ocupación</span>
                      <span className="text-[10px] font-bold text-[#A3FF12]">{c.ocupacion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 sm:pb-28">

        <div className="text-center mb-14 sm:mb-16">
          <p
            className="text-xs font-bold text-[#A3FF12]/80 uppercase mb-5"
            style={{ letterSpacing: "0.4em" }}
          >
            Lo que incluye
          </p>
          <h2
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: "1.08",
              letterSpacing: "0.025em",
            }}
          >
            Todo lo que tu<br />
            <span className="text-white/30">complejo necesita.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">

          <div className="group glass-card rounded-2xl p-7 sm:p-8 space-y-4 border border-white/[0.06] hover:border-[#A3FF12]/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_32px_rgba(163,255,18,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center group-hover:bg-[#A3FF12]/20 group-hover:border-[#A3FF12]/50 group-hover:scale-110 transition-all duration-300">
              <Sparkles className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3
              className="font-display font-black uppercase text-white text-xl"
              style={{ lineHeight: "1.15", letterSpacing: "0.04em" }}
            >
              Grilla en tiempo real
            </h3>
            <p className="text-base text-white/55 leading-relaxed">
              Cada cancha con sus horarios, slots disponibles y reservas pendientes. Tu cliente ve solo lo que está libre.
            </p>
          </div>

          <div className="group glass-card rounded-2xl p-7 sm:p-8 space-y-4 border border-white/[0.06] hover:border-[#A3FF12]/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_32px_rgba(163,255,18,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center group-hover:bg-[#A3FF12]/20 group-hover:border-[#A3FF12]/50 group-hover:scale-110 transition-all duration-300">
              <Zap className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3
              className="font-display font-black uppercase text-white text-xl"
              style={{ lineHeight: "1.15", letterSpacing: "0.04em" }}
            >
              Expira y libera solo
            </h3>
            <p className="text-base text-white/55 leading-relaxed">
              Si el cliente no paga en el tiempo que vos definís, el slot queda libre para otro. Sin reservas fantasma.
            </p>
          </div>

          <div className="group glass-card rounded-2xl p-7 sm:p-8 space-y-4 border border-white/[0.06] hover:border-[#A3FF12]/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_32px_rgba(163,255,18,0.12)]">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center group-hover:bg-[#A3FF12]/20 group-hover:border-[#A3FF12]/50 group-hover:scale-110 transition-all duration-300">
              <MessageCircle className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3
              className="font-display font-black uppercase text-white text-xl"
              style={{ lineHeight: "1.15", letterSpacing: "0.04em" }}
            >
              Mail + WhatsApp
            </h3>
            <p className="text-base text-white/55 leading-relaxed">
              Cada reserva confirmada se notifica por mail. El cliente recibe además un botón para avisarte por WhatsApp con todos los datos prearmados.
            </p>
          </div>

        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24 sm:pb-32">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 0%, rgba(163,255,18,0.18) 0%, transparent 60%)",
            }}
          />

          <div className="relative">
            <h2
              className="font-display font-black uppercase text-white"
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                lineHeight: "1.08",
                letterSpacing: "0.025em",
              }}
            >
              Listo para dejar de<br />
              <span className="text-[#A3FF12]">anotar turnos en papel</span>?
            </h2>
            <p className="text-white/55 text-base sm:text-lg mt-5 max-w-xl mx-auto leading-relaxed">
              Hablamos por WhatsApp y te configuramos tu complejo. Sin tarjeta, sin compromiso, sin letra chica.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-base rounded-xl px-7 py-4 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Hablar por WhatsApp
              </a>
              <Link
                href="/register"
                className="w-full sm:w-auto text-base font-medium text-white/65 hover:text-white transition-colors px-5 py-4"
              >
                Prefiero registrarme yo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center border-t border-white/[0.04]">
        <Link href="/" aria-label="Ir al inicio" className="inline-block">
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={160}
            height={48}
            className="h-8 w-auto opacity-50 hover:opacity-80 transition-opacity"
          />
        </Link>
        <p
          className="text-white/25 text-xs uppercase mt-4"
          style={{ letterSpacing: "0.32em" }}
        >
          Reservas deportivas · {new Date().getFullYear()}
        </p>
      </footer>

    </main>
  )
}
