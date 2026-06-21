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
            className="btn-lime-glow w-full sm:w-auto bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold text-base rounded-xl px-7 py-4 inline-flex items-center justify-center gap-2"
          >
            Sumar mi complejo
            <ArrowRight className="w-5 h-5" />
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
          className="relative mt-20 sm:mt-24 max-w-2xl mx-auto"
          style={{ animation: "fadeInUp 0.7s ease 0.8s both" }}
        >
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-40 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(163,255,18,0.35) 0%, transparent 65%)",
            }}
          />

          <div className="relative glass-card rounded-2xl p-6 sm:p-7 text-left shadow-2xl">
            {/* Header del mock */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  Reservas de hoy
                </p>
                <p
                  className="font-display font-black text-white text-lg leading-none mt-1.5"
                  style={{ letterSpacing: "0.035em" }}
                >
                  Club Río
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                  Ingresos
                </p>
                <p
                  className="font-display font-black text-[#A3FF12] text-xl leading-none mt-1.5"
                  style={{ letterSpacing: "0.035em" }}
                >
                  $128.500
                </p>
              </div>
            </div>

            {/* Lista de reservas */}
            <div className="space-y-2.5">
              {[
                { nombre: "Juan P.", cancha: "Cancha 1 · Pádel", hora: "18:00", monto: "$5.000", estado: "ok" },
                { nombre: "María L.", cancha: "Cancha 2 · Pádel", hora: "19:00", monto: "$5.000", estado: "wait" },
                { nombre: "Carlos R.", cancha: "Cancha 3 · Fútbol 5", hora: "20:00", monto: "$6.500", estado: "ok" },
                { nombre: "Sofía M.", cancha: "Cancha 1 · Pádel", hora: "21:00", monto: "$5.500", estado: "ok" },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 sm:gap-4 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05]"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br from-[#A3FF12]/15 to-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#A3FF12] text-sm font-bold">
                    {r.nombre[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {r.nombre}
                    </p>
                    <p className="text-[11px] sm:text-xs text-white/40 truncate">
                      {r.cancha}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/55">
                    <Clock className="w-3 h-3" />
                    {r.hora}
                  </div>
                  <div className="text-sm font-bold text-white shrink-0 tabular-nums">
                    {r.monto}
                  </div>
                  <div
                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                      r.estado === "ok"
                        ? "bg-[#A3FF12]/15 border border-[#A3FF12]/30 text-[#A3FF12]"
                        : "bg-yellow-400/10 border border-yellow-400/25 text-yellow-400"
                    }`}
                  >
                    {r.estado === "ok" ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-white/45">
                4 reservas confirmadas
              </span>
              <a
                href="#"
                className="text-xs font-semibold text-[#A3FF12]/80 hover:text-[#A3FF12] transition-colors flex items-center gap-1"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </a>
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
            },
            {
              num: "02",
              icon: Sparkles,
              titulo: "Cargás canchas y horarios",
              desc: "Definís tus canchas, deportes, precios y horarios de cada día de la semana. Listo en 5 minutos.",
            },
            {
              num: "03",
              icon: Link2,
              titulo: "Compartís el link",
              desc: "Subís el link a tu Instagram, lo mandás por WhatsApp y empezás a recibir reservas pagas automáticamente.",
            },
          ].map((paso, i, arr) => {
            const Icon = paso.icon
            return (
              <Fragment key={i}>
                <div
                  className="glass-card flex-1 rounded-2xl p-7 sm:p-8 space-y-5"
                  style={{ animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/30 flex items-center justify-center">
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
                  <div key={i} className="rounded-xl bg-white/[0.025] border border-white/[0.05] p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                        {kpi.label}
                      </span>
                      <Icon className="w-3.5 h-3.5 text-white/30" />
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
              <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-24 sm:h-28">
                {[
                  { dia: "L", h: 35 },
                  { dia: "M", h: 50 },
                  { dia: "X", h: 42 },
                  { dia: "J", h: 65 },
                  { dia: "V", h: 78 },
                  { dia: "S", h: 100 },
                  { dia: "D", h: 88 },
                ].map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full relative h-full flex items-end">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${d.h}%`,
                          background:
                            i === 5
                              ? "linear-gradient(180deg, #A3FF12 0%, rgba(163,255,18,0.3) 100%)"
                              : "linear-gradient(180deg, rgba(163,255,18,0.6) 0%, rgba(163,255,18,0.15) 100%)",
                          boxShadow: i === 5 ? "0 0 16px rgba(163,255,18,0.5)" : "none",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${i === 5 ? "text-[#A3FF12]" : "text-white/30"}`}>
                      {d.dia}
                    </span>
                  </div>
                ))}
              </div>
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
                  <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
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

          <div className="glass-card rounded-2xl p-7 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center">
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

          <div className="glass-card rounded-2xl p-7 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center">
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

          <div className="glass-card rounded-2xl p-7 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center">
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
