"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, CalendarDays, PlusCircle, LogOut, TrendingUp, LayoutGrid, Settings } from "lucide-react"
import { cerrarSesion } from "@/actions/auth"

export function AdminMobileMenu({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-white/70" />
      </button>

      {/* Backdrop dimmer */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 sm:hidden transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />

      {/* Drawer — fondo 100% sólido para que el contenido del dashboard
          no se vea detrás. NO usar backdrop-filter aca: en iOS Safari el
          backdrop-filter sobre un elemento con bg opaco a veces "filtra"
          y revela parcialmente el contenido detrás. */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[88vw] z-50 border-l border-white/[0.08] transition-transform duration-300 sm:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "#0F1218",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.6)",
          WebkitBackdropFilter: "none",
          backdropFilter: "none",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <Image
            src="/logo-wordmark-white.svg"
            alt="Pointix"
            width={120}
            height={36}
            className="h-7 w-auto"
          />
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <Link
            href={`/dashboard/${slug}/reservas`}
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            <CalendarDays className="w-4 h-4 shrink-0 text-white/50" />
            Ver reservas
          </Link>

          <Link
            href={`/dashboard/${slug}/ingresos`}
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            <TrendingUp className="w-4 h-4 shrink-0 text-white/50" />
            Ingresos
          </Link>

          <Link
            href={`/dashboard/${slug}/ocupacion`}
            onClick={close}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/75 hover:text-white transition-colors"
          >
            <LayoutGrid className="w-4 h-4 shrink-0 text-white/50" />
            Ocupación
          </Link>

          <div className="pt-1 mt-1 border-t border-white/[0.07]">
            <Link
              href={`/dashboard/${slug}/reservas/nueva`}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#A3FF12]/[0.08] text-sm font-semibold text-[#A3FF12] transition-colors"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              Nueva reserva
            </Link>
            <Link
              href={`/dashboard/${slug}/canchas/nueva`}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/75 hover:text-white transition-colors"
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-white/50" />
              Nueva cancha
            </Link>
          </div>

          <div className="pt-1 mt-1 border-t border-white/[0.07]">
            <Link
              href={`/dashboard/${slug}/configuracion`}
              onClick={close}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/75 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 shrink-0 text-white/50" />
              Configuración
            </Link>
          </div>

          <div className="pt-2 mt-2 border-t border-white/[0.07]">
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg hover:bg-red-500/10 text-sm font-medium text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </nav>
      </div>
    </>
  )
}
