import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Calendar, CreditCard, MessageCircle, Link2, Sparkles, Zap } from "lucide-react"

// Número del fundador para el botón "Hablar con un humano".
// Formato wa.me: dígitos, sin "+" ni espacios, con "9" para móvil AR.
const WHATSAPP_FUNDADOR = "5493543697964"
const MENSAJE_WSP_FUNDADOR = "Hola! Quiero sumar mi complejo a Pointix."

export default function Home() {
  const waUrl = `https://wa.me/${WHATSAPP_FUNDADOR}?text=${encodeURIComponent(MENSAJE_WSP_FUNDADOR)}`

  return (
    <main className="min-h-screen bg-toxic-gradient text-white relative overflow-x-hidden">

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto px-6 py-5 sm:py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo-isotype-white.svg"
            alt="Pointix"
            width={28}
            height={50}
            className="h-8 w-auto"
            priority
          />
          <span className="font-display font-black uppercase text-white text-lg tracking-tight group-hover:text-[#A3FF12] transition-colors">
            Pointix
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex text-sm font-medium text-white/65 hover:text-white transition-colors px-3 py-2"
          >
            Hablar con un humano
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-white/75 hover:text-white transition-colors px-3 py-2"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-12 sm:pt-20 pb-16 text-center">

        <p
          className="text-[10px] font-bold text-[#A3FF12]/70 uppercase tracking-[0.3em] mb-5"
          style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
        >
          Para complejos deportivos
        </p>

        {/* Wordmark grande */}
        <div
          className="flex justify-center mb-6 sm:mb-8"
          style={{ animation: "fadeInUp 0.5s ease 0.2s both" }}
        >
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={400}
            height={120}
            className="h-16 sm:h-20 md:h-24 w-auto"
            priority
          />
        </div>

        <h1
          className="font-display font-black uppercase text-white leading-[0.95] tracking-tight max-w-4xl mx-auto"
          style={{
            fontSize: "clamp(2rem, 6vw, 4.25rem)",
            animation: "fadeInUp 0.5s ease 0.3s both",
          }}
        >
          Tus reservas,<br />
          <span className="text-[#A3FF12]">en piloto automático.</span>
        </h1>

        <p
          className="text-white/55 text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          style={{ animation: "fadeInUp 0.5s ease 0.4s both" }}
        >
          Le damos a tu complejo una grilla online de turnos, cobros por MercadoPago y
          confirmaciones automáticas por mail y WhatsApp.
          <span className="block mt-2 text-white/40">
            Tus clientes reservan en 30 segundos, vos cobrás antes y dejás de chatear hasta las 11 de la noche.
          </span>
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}
        >
          <Link
            href="/register"
            className="btn-lime-glow w-full sm:w-auto bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold rounded-xl px-6 py-3.5 inline-flex items-center justify-center gap-2"
          >
            Sumar mi complejo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-sm font-medium text-white/65 hover:text-white transition-colors px-4 py-3"
          >
            Ya tengo cuenta →
          </Link>
        </div>

        <p
          className="text-xs text-white/30 mt-8"
          style={{ animation: "fadeIn 0.5s ease 0.7s both" }}
        >
          ¿Buscás reservar como cliente? Pedile al complejo que te pase su link directo.
        </p>

        {/* Mock visual del dashboard */}
        <div
          className="relative mt-16 sm:mt-20 max-w-3xl mx-auto"
          style={{ animation: "fadeInUp 0.7s ease 0.8s both" }}
        >
          {/* Glow detrás */}
          <div
            className="absolute inset-0 rounded-3xl blur-3xl opacity-40 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(163,255,18,0.35) 0%, transparent 65%)",
            }}
          />

          <div className="relative glass-card rounded-2xl p-5 sm:p-6 text-left shadow-2xl">
            {/* Header del mock */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#A3FF12] animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Reservas de hoy · Club Río
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/30">14:32</span>
            </div>

            {/* Grilla mock */}
            <div className="space-y-2">
              {[
                { cancha: "Cancha 1 · Pádel", slots: ["d","d","o","c","c","c","c","o","o","d","d","d"] },
                { cancha: "Cancha 2 · Pádel", slots: ["d","d","d","c","c","o","c","c","c","c","d","d"] },
                { cancha: "Cancha 3 · Fútbol 5", slots: ["x","x","d","c","c","c","c","c","c","c","c","x"] },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-[10px] sm:text-xs font-medium text-white/55 w-20 sm:w-32 shrink-0 truncate">
                    {row.cancha}
                  </span>
                  <div className="flex-1 grid grid-cols-12 gap-0.5 sm:gap-1">
                    {row.slots.map((s, j) => (
                      <div
                        key={j}
                        className={`h-5 sm:h-6 rounded-sm sm:rounded-md border ${
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

            {/* Footer del mock */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-white/55">
                  <span className="w-1.5 h-1.5 rounded-sm bg-[#A3FF12]/40" /> Confirmado
                </span>
                <span className="flex items-center gap-1 text-white/55">
                  <span className="w-1.5 h-1.5 rounded-sm bg-red-500/40" /> Pendiente
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#A3FF12]">
                $128.500 hoy
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24">

        <div className="text-center mb-12 sm:mb-16">
          <p className="text-[10px] font-bold text-[#A3FF12]/70 uppercase tracking-[0.3em] mb-3">
            Cómo funciona
          </p>
          <h2 className="font-display font-black uppercase text-white text-3xl sm:text-5xl tracking-tight">
            En 3 pasos<br />
            <span className="text-white/40">estás cobrando.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">

          {/* Línea conectora desktop */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#A3FF12]/20 to-transparent" />

          {[
            {
              num: "01",
              icon: CreditCard,
              titulo: "Conectás MercadoPago",
              desc: "Pegás tu Access Token de MP en 2 clics. La plata cae directo a tu cuenta, Pointix no toca ni un peso.",
            },
            {
              num: "02",
              icon: Calendar,
              titulo: "Cargás canchas y horarios",
              desc: "Definís tus canchas, deportes, precios y horarios de cada día. Listo en 5 minutos.",
            },
            {
              num: "03",
              icon: Link2,
              titulo: "Compartís el link",
              desc: "Subís el link a tu Instagram, lo mandás por WhatsApp y empezás a recibir reservas pagas automáticamente.",
            },
          ].map((paso, i) => {
            const Icon = paso.icon
            return (
              <div
                key={i}
                className="relative glass-card rounded-2xl p-6 space-y-4"
                style={{ animation: `fadeInUp 0.5s ease ${0.1 + i * 0.1}s both` }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/25 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#A3FF12]" />
                  </div>
                  <span className="font-display font-black text-white/[0.06] text-5xl tracking-tighter">
                    {paso.num}
                  </span>
                </div>
                <h3 className="font-display font-black uppercase text-white text-xl leading-tight tracking-tight">
                  {paso.titulo}
                </h3>
                <p className="text-sm text-white/55 leading-relaxed">
                  {paso.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-16 sm:pb-24">

        <div className="separator-lime mx-auto max-w-24 mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Grilla en tiempo real
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Cada cancha con sus horarios, slots disponibles y reservas pendientes. Tu cliente ve solo lo que está libre.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Expira y libera solo
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Si el cliente no paga en el tiempo que vos definís, el slot queda libre para otro. Sin reservas fantasma.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Mail + WhatsApp
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Cada reserva confirmada se notifica por mail. El cliente recibe además un botón para avisarte por WhatsApp con todos los datos prearmados.
            </p>
          </div>

        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20 sm:pb-28">
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          {/* Glow decorativo */}
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 0%, rgba(163,255,18,0.15) 0%, transparent 60%)",
            }}
          />

          <div className="relative">
            <h2 className="font-display font-black uppercase text-white text-3xl sm:text-4xl leading-tight tracking-tight">
              Listo para dejar de<br />
              <span className="text-[#A3FF12]">anotar turnos en papel</span>?
            </h2>
            <p className="text-white/50 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
              Hablamos por WhatsApp y te configuramos tu complejo. Sin tarjeta, sin compromiso, sin letra chica.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold rounded-xl px-6 py-3.5 inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Hablar por WhatsApp
              </a>
              <Link
                href="/register"
                className="w-full sm:w-auto text-sm font-medium text-white/65 hover:text-white transition-colors px-4 py-3"
              >
                Prefiero registrarme yo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 text-center border-t border-white/[0.04]">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image
            src="/logo-isotype-white.svg"
            alt=""
            width={20}
            height={36}
            className="h-5 w-auto opacity-40"
          />
          <span className="text-white/30 text-xs font-bold uppercase tracking-widest">
            Pointix
          </span>
        </div>
        <p className="text-white/20 text-[10px] tracking-widest uppercase">
          Reservas deportivas · {new Date().getFullYear()}
        </p>
      </footer>

    </main>
  )
}
