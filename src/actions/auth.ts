"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(_prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("[login] AuthError type:", error.type, error.message)
      return { error: "Email o contraseña incorrectos." }
    }
    console.log("[login] redirect/non-auth throw:", (error as any)?.digest ?? String(error))
    throw error
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" })
}
