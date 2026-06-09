"use client"

import { useState, useTransition } from "react"
import { CheckCircle, AlertCircle, MessageCircle, MapPin, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { guardarDatosClub } from "@/actions/tenant-config"

interface Props {
  tenantId: string
  slug: string
  inicial: {
    description: string
    address: string
    whatsappNumber: string
  }
}

const inputBase = "w-full glass-nav rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#A3FF12]/40 transition-colors"

export function DatosClubForm({ tenantId, slug, inicial }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [description, setDescription] = useState(inicial.description)
  const [address, setAddress] = useState(inicial.address)
  const [whatsappNumber, setWhatsappNumber] = useState(inicial.whatsappNumber)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await guardarDatosClub(tenantId, slug, formData)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3500)
      } catch (err) {
        if (err instanceof Error) setError(err.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-5">

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-white/40" />
          Descripción
        </label>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Complejo deportivo con canchas de pádel y fútbol"
          rows={2}
          maxLength={200}
          className={inputBase + " resize-none"}
        />
        <p className="text-xs text-white/35">Aparece debajo del nombre del club en la página del cliente.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-white/40" />
          Dirección
        </label>
        <input
          name="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Av. Siempre Viva 123, CABA"
          className={inputBase}
        />
        <p className="text-xs text-white/35">Se incluye en el mail de confirmación para que el cliente sepa cómo llegar.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/65 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          WhatsApp del complejo
        </label>
        <input
          name="whatsappNumber"
          type="tel"
          inputMode="tel"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="11 1234-5678"
          className={inputBase}
        />
        <p className="text-xs text-white/35 leading-relaxed">
          Después de que el cliente reserve y pague, va a ver un botón <span className="text-[#25D366]">&ldquo;Confirmar por WhatsApp&rdquo;</span> que abre WhatsApp con un mensaje prearmado con los datos de la reserva, listo para enviarte.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 bg-[#A3FF12]/10 border border-[#A3FF12]/25 text-[#A3FF12] text-sm rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Datos guardados
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="btn-lime-glow w-full bg-[#A3FF12] hover:bg-[#d4ff1a] text-black font-bold"
      >
        {pending ? "Guardando…" : "Guardar datos del club"}
      </Button>
    </form>
  )
}
