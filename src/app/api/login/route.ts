import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales requeridas." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user?.password) {
      return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 })
    }

    // NO actualizamos sessionsRevokedAt en login: que el dueño se loguee
    // desde el celu no debe cerrar la sesión de la compu del complejo. La
    // revocación dura es una acción explícita ("cerrar sesión en todos
    // los dispositivos") que llama a cerrarSesionEnTodosLados().
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return res
  } catch (e) {
    console.error("[login] error:", e)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
