"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, CalendarDays, PlusCircle, LogOut } from "lucide-react"
import { cerrarSesion } from "@/actions/auth"

export function AdminMobileMenu({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5 text-white/70" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[#14171F] border-l border-white/[0.07] z-50 shadow-2xl transition-transform duration-200 sm:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <span className="font-display font-black uppercase text-[#CAFF00] text-xl tracking-tight">
            Pointix
          </span>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <Link
            href={`/dashboard/${slug}/reservas`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Ver reservas
          </Link>
          <Link
            href={`/dashboard/${slug}/canchas/nueva`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/[0.06] text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Nueva cancha
          </Link>
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
