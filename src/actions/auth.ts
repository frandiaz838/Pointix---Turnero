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
      return { error: "Email o contraseña incorrectos." }
    }
    throw error
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" })
}
