"use client"

import { cerrarSesion } from "@/actions/auth"
import { buttonVariants } from "@/components/ui/button"

export function LogoutBtn() {
  return (
    <form action={cerrarSesion}>
      <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Cerrar sesión
      </button>
    </form>
  )
}
