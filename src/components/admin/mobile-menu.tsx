"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cerrarSesion } from "@/actions/auth"

export function AdminMobileMenu({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-xl transition-transform duration-200 sm:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <p className="font-semibold text-gray-900">Menú</p>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          <Link
            href={`/dashboard/${slug}/reservas`}
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Ver reservas
          </Link>
          <Link
            href={`/dashboard/${slug}/canchas/nueva`}
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            + Nueva cancha
          </Link>
          <div className="pt-2 mt-2 border-t">
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="w-full text-left px-4 py-3.5 rounded-lg hover:bg-red-50 text-sm font-medium text-red-600 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </nav>
      </div>
    </>
  )
}
