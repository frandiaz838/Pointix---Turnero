import Link from "next/link"
import { ArrowRight, Calendar, CreditCard, MessageCircle } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-toxic-gradient text-white relative overflow-x-hidden">

      {/* Header */}
      <header className="relative z-10 px-6 py-5 sm:py-6 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-display font-black uppercase text-[#A3FF12] text-xl tracking-tight">
          Pointix
        </span>
        <Link
          href="/login"
          className="text-sm font-medium text-white/65 hover:text-white transition-colors"
        >
          Iniciar sesión
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-16 sm:pt-24 pb-12 text-center">

        <p
          className="text-[10px] font-bold text-[#A3FF12]/70 uppercase tracking-[0.3em] mb-4"
          style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
        >
          Para complejos deportivos
        </p>

        <h1
          className="font-display font-black uppercase text-white leading-[0.95] tracking-tight"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
            animation: "fadeInUp 0.5s ease 0.2s both",
          }}
        >
          Tus reservas,<br />
          <span className="text-[#A3FF12]">en piloto automático.</span>
        </h1>

        <p
          className="text-white/55 text-base sm:text-lg mt-6 max-w-2xl mx-auto leading-relaxed"
          style={{ animation: "fadeInUp 0.5s ease 0.3s both" }}
        >
          Pointix le da a tu complejo una grilla online de turnos, cobros por MercadoPago y confirmaciones automáticas por mail y WhatsApp.
          Tus clientes reservan en 30 segundos, vos cobrás antes y dejás de chatear hasta las 11 de la noche.
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: "fadeInUp 0.5s ease 0.4s both" }}
        >
          <Link
            href="/login"
            className="btn-lime-glow w-full sm:w-auto bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold rounded-xl px-6 py-3.5 inline-flex items-center justify-center gap-2"
          >
            Acceder al panel
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto text-sm font-medium text-white/65 hover:text-white transition-colors px-4 py-3"
          >
            ¿Sumás tu complejo? →
          </Link>
        </div>

        <p
          className="text-xs text-white/30 mt-8"
          style={{ animation: "fadeIn 0.5s ease 0.6s both" }}
        >
          ¿Buscás reservar como cliente? Pedile al complejo que te pase su link directo.
        </p>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24">

        <div className="separator-lime mx-auto max-w-24 mb-12" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

          <div
            className="glass-card rounded-2xl p-6 space-y-3"
            style={{ animation: "fadeInUp 0.5s ease 0.5s both" }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Grilla en tiempo real
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Cada cancha con sus horarios, slots disponibles y reservas pendientes. Tu cliente ve solo lo que está libre.
            </p>
          </div>

          <div
            className="glass-card rounded-2xl p-6 space-y-3"
            style={{ animation: "fadeInUp 0.5s ease 0.6s both" }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Cobros con MercadoPago
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Conectás tu cuenta de MP en 2 clics y el cliente paga al reservar. La plata cae directo a tu cuenta, no a la nuestra.
            </p>
          </div>

          <div
            className="glass-card rounded-2xl p-6 space-y-3"
            style={{ animation: "fadeInUp 0.5s ease 0.7s both" }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#A3FF12]/10 border border-[#A3FF12]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#A3FF12]" />
            </div>
            <h3 className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight">
              Mail + WhatsApp
            </h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Cada reserva confirmada se notifica por mail. Y al cliente le aparece un botón para avisarte por WhatsApp con todos los datos prearmados.
            </p>
          </div>

        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-20 sm:pb-28 text-center">
        <h2 className="font-display font-black uppercase text-white text-3xl sm:text-4xl leading-tight tracking-tight">
          Listo para dejar de<br />
          <span className="text-[#A3FF12]">anotar turnos en papel</span>?
        </h2>
        <p className="text-white/45 text-sm mt-4">
          Hablemos. Te configuramos tu complejo en menos de un día.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
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
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center border-t border-white/[0.04]">
        <p className="text-white/20 text-xs tracking-widest uppercase">
          Pointix · Reservas deportivas
        </p>
      </footer>

    </main>
  )
}
