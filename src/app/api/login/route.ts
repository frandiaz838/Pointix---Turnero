import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { prisma } from "@/lib/prisma"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!)

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

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    const res = NextResponse.json({ ok: true })
    res.cookies.set("pointix-session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e) {
    console.error("[login] error:", e)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
