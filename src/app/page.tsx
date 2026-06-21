import Link from "next/link"
import Image from "next/image"
import { ArrowRight, CreditCard, MessageCircle, Link2, Sparkles, Zap, ChevronRight } from "lucide-react"

// Número del fundador para el botón "Hablar con un humano".
// Formato wa.me: dígitos, sin "+" ni espacios, con "9" para móvil AR.
const WHATSAPP_FUNDADOR = "5493543697964"
const MENSAJE_WSP_FUNDADOR = "Hola! Quiero sumar mi complejo a Pointix."

export default function Home() {
  const waUrl = `https://wa.me/${WHATSAPP_FUNDADOR}?text=${encodeURIComponent(MENSAJE_WSP_FUNDADOR)}`

  return (
    <main className="min-h-screen bg-toxic-gradient text-white relative overflow-x-hidden">

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <Link href="/" aria-label="Ir al inicio" className="block">
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={180}
            height={54}
            className="h-10 sm:h-11 w-auto"
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
          className="text-xs font-bold text-[#A3FF12]/80 uppercase tracking-[0.32em] mb-6"
          style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
        >
          Para complejos deportivos
        </p>

        <h1
          className="font-display font-black uppercase text-white leading-[0.95] tracking-tight max-w-4xl mx-auto"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5rem)",
            animation: "fadeInUp 0.5s ease 0.3s both",
          }}
        >
          Tus reservas,<br />
          <span className="text-[#A3FF12]">en piloto automático.</span>
        </h1>

        <p
          className="text-white/65 text-lg sm:text-xl mt-8 max-w-2xl mx-auto leading-relaxed"
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

        {/* Mock visual del dashboard */}
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

          <div className="relative glass-card rounded-2xl p-6 sm:p-8 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#A3FF12] animate-pulse" />
                <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                  Reservas de hoy · Club Río
                </span>
              </div>
              <span className="text-xs font-mono text-white/35">14:32</span>
            </div>

            <div className="space-y-3">
              {[
                { cancha: "Cancha 1 · Pádel", slots: ["d","d","o","c","c","c","c","o","o","d","d","d"] },
                { cancha: "Cancha 2 · Pádel", slots: ["d","d","d","c","c","o","c","c","c","c","d","d"] },
                { cancha: "Cancha 3 · Fútbol 5", slots: ["x","x","d","c","c","c","c","c","c","c","c","x"] },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs sm:text-sm font-semibold text-white/70 w-24 sm:w-36 shrink-0 truncate">
                    {row.cancha}
                  </span>
                  <div className="flex-1 grid grid-cols-12 gap-1 sm:gap-1.5">
                    {row.slots.map((s, j) => (
                      <div
                        key={j}
                        className={`h-6 sm:h-7 rounded-md border ${
                          s === "c"
                            ? "bg-[#A3FF12]/15 border-[#A3FF12]/30"
                            : s === "o"
                            ? "bg-red-500/10 border-red-500/20"
                            : s === "x"
                            ? "bg-white/[0.02] border-white/[0.04]"
                            : "bg-white/[0.04] border-white/[0.08]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-white/65">
                  <span className="w-2 h-2 rounded-sm bg-[#A3FF12]/50" /> Confirmado
                </span>
                <span className="flex items-center gap-1.5 text-white/65">
                  <span className="w-2 h-2 rounded-sm bg-red-500/50" /> Pendiente
                </span>
              </div>
              <span className="text-sm font-bold text-[#A3FF12]">
                $128.500 hoy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 sm:py-28">

        <div className="text-center mb-16 sm:mb-20">
          <p className="text-xs font-bold text-[#A3FF12]/80 uppercase tracking-[0.32em] mb-4">
            Cómo funciona
          </p>
          <h2
            className="font-display font-black uppercase text-white leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            En 3 pasos<br />
            <span className="text-white/30">estás cobrando.</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-3">
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
              <div key={i} className="flex md:flex-1 items-center gap-3 md:flex-col">
                <div
                  className="glass-card flex-1 rounded-2xl p-7 sm:p-8 space-y-5 w-full"
                  style={{ animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#A3FF12]" />
                    </div>
                    <span className="text-xs font-bold text-[#A3FF12]/60 uppercase tracking-[0.2em]">
                      Paso {paso.num}
                    </span>
                  </div>
                  <h3 className="font-display font-black uppercase text-white text-xl sm:text-2xl leading-tight tracking-tight">
                    {paso.titulo}
                  </h3>
                  <p className="text-base text-white/55 leading-relaxed">
                    {paso.desc}
                  </p>
                </div>

                {/* Chevron entre cards (no después del último) */}
                {i < arr.length - 1 && (
                  <ChevronRight
                    className="w-6 h-6 text-[#A3FF12]/40 shrink-0 md:rotate-0 rotate-90"
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20 sm:pb-28">

        <div className="separator-lime mx-auto max-w-24 mb-16" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">

          <div className="glass-card rounded-2xl p-7 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/25 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-xl leading-tight tracking-tight">
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
            <h3 className="font-display font-black uppercase text-white text-xl leading-tight tracking-tight">
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
            <h3 className="font-display font-black uppercase text-white text-xl leading-tight tracking-tight">
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
              className="font-display font-black uppercase text-white leading-[0.95] tracking-tight"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
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
            width={140}
            height={42}
            className="h-7 w-auto opacity-50 hover:opacity-80 transition-opacity"
          />
        </Link>
        <p className="text-white/25 text-xs tracking-widest uppercase mt-4">
          Reservas deportivas · {new Date().getFullYear()}
        </p>
      </footer>

    </main>
  )
}
