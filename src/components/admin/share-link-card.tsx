"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, MessageCircle, Link2 } from "lucide-react"

interface Props {
  /** URL completa de la pagina publica del club (https://pointix.com.ar/club-atletico) */
  url: string
  /** Nombre del club, para el mensaje prearmado de WhatsApp */
  clubName: string
}

export function ShareLinkCard({ url, clubName }: Props) {
  const [copiado, setCopiado] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Fallback para browsers sin clipboard API
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const mensajeWsp = `¡Reservá tu cancha en *${clubName}* desde acá! 👇\n\n${url}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(mensajeWsp)}`
  // URL sin protocolo, mas amigable visualmente
  const urlSinProto = url.replace(/^https?:\/\//, "")

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4 border border-[#A3FF12]/15">

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-[#A3FF12]/12 border border-[#A3FF12]/30 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-[#A3FF12]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">
            Tu link de reservas
          </p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
            Compartí este link en Instagram, WhatsApp o donde quieras. Tus clientes lo abren y reservan en 30 segundos.
          </p>
        </div>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.08] px-3.5 py-3">
        <code
          className="flex-1 text-sm text-[#A3FF12] font-mono truncate select-all"
          title={url}
        >
          {urlSinProto}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copiar link"
          className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
            copiado
              ? "bg-[#A3FF12]/15 text-[#A3FF12] border border-[#A3FF12]/40"
              : "bg-white/[0.06] text-white/75 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white"
          }`}
        >
          {copiado ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copiar
            </>
          )}
        </button>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg glass-nav text-white/70 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir página
        </a>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Compartir por WhatsApp
        </a>
      </div>
    </div>
  )
}
