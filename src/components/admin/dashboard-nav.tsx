"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home, CalendarDays, LayoutGrid, TrendingUp, BarChart3, Settings,
  ExternalLink, LogOut, Menu, X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cerrarSesion } from "@/actions/auth"
import { HoraActual } from "@/components/admin/hora-actual"

interface Props {
  slug: string
  clubName: string
}

const noopSubscribe = () => () => {}

interface Item {
  href: string
  label: string
  icon: LucideIcon
  /** true = solo activo en la ruta exacta (para "Inicio"). */
  exacto?: boolean
}

function items(slug: string): Item[] {
  const base = `/dashboard/${slug}`
  return [
    { href: base,                    label: "Inicio",        icon: Home, exacto: true },
    { href: `${base}/reservas`,      label: "Reservas",      icon: CalendarDays },
    { href: `${base}/canchas`,       label: "Canchas",       icon: LayoutGrid },
    { href: `${base}/ingresos`,      label: "Ingresos",      icon: TrendingUp },
    { href: `${base}/ocupacion`,     label: "Ocupación",     icon: BarChart3 },
    { href: `${base}/configuracion`, label: "Configuración", icon: Settings },
  ]
}

function NavLinks({ slug, onNavigate }: { slug: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="space-y-1">
      {items(slug).map(({ href, label, icon: Icon, exacto }) => {
        const activo = exacto ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
              activo
                ? "bg-[#A3FF12]/10 text-[#A3FF12]"
                : "text-white/65 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <Icon className={`w-[18px] h-[18px] shrink-0 ${activo ? "text-[#A3FF12]" : "text-white/45"}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function PieNav({ slug }: { slug: string }) {
  return (
    <div className="space-y-1 pt-3 border-t border-white/[0.07]">
      <Link
        href={`/${slug}`}
        target="_blank"
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-white/65 hover:text-white hover:bg-white/[0.05] transition-colors"
      >
        <ExternalLink className="w-[18px] h-[18px] shrink-0 text-white/45" />
        Ver mi página
      </Link>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[15px] font-medium text-white/65 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 text-white/45" />
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}

/**
 * Navegación persistente del panel del club: sidebar fijo en desktop (lg+) y
 * barra superior con drawer en mobile.
 */
export function DashboardNav({ slug, clubName }: Props) {
  const [open, setOpen] = useState(false)
  // El portal solo existe en cliente: false en SSR, true al hidratar.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = original }
  }, [open])

  const encabezado = (
    <div className="space-y-4">
      <Link href={`/dashboard/${slug}`} aria-label="Inicio del panel">
        <Image src="/logo-wordmark-white.svg" alt="Pointix" width={120} height={36} className="h-7 w-auto" />
      </Link>
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-3.5 py-3">
        <p className="font-display font-black uppercase text-white text-lg leading-tight tracking-tight truncate">{clubName}</p>
        <HoraActual />
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col gap-6 w-64 shrink-0 sticky top-0 h-screen px-4 py-6 border-r border-white/[0.06] bg-[#0C0E14]/70">
        {encabezado}
        <div className="flex-1 overflow-y-auto">
          <NavLinks slug={slug} />
        </div>
        <PieNav slug={slug} />
      </aside>

      {/* Mobile: barra superior */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]" style={{ background: "#0C0E14" }}>
        <p className="font-display font-black uppercase text-white text-lg leading-none tracking-tight truncate">{clubName}</p>
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-white/[0.06] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6 text-white/80" />
        </button>
      </div>

      {/* Drawer mobile (portal: un padre con transform/filter rompería el fixed) */}
      {mounted && createPortal(
        <>
          <div
            className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-[110] lg:hidden flex flex-col gap-6 px-4 py-5 border-r border-white/[0.08] transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
            style={{ background: "#0F1218", boxShadow: "8px 0 48px rgba(0,0,0,0.6)" }}
            aria-hidden={!open}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">{encabezado}</div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06]" aria-label="Cerrar menú">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks slug={slug} onNavigate={() => setOpen(false)} />
            </div>
            <PieNav slug={slug} />
          </div>
        </>,
        document.body,
      )}
    </>
  )
}
