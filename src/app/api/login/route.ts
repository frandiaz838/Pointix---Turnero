import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session"
import { checkRateLimit, getClientIp } from "@/lib/ratelimit"

// Límites contra fuerza bruta: por IP (un atacante probando muchas cuentas) y
// por email (muchas IPs contra una misma cuenta). El limiter es en memoria por
// instancia; con tráfico real conviene migrarlo a Upstash.
const VENTANA_MS = 15 * 60 * 1000
const LIMITE_POR_IP = 10
const LIMITE_POR_EMAIL = 5

// Hash bcrypt (cost 12) de un texto que no es contraseña de nadie. Si el email
// no existe comparamos contra este igual, para que la respuesta tarde lo mismo
// y no se pueda averiguar qué emails están registrados midiendo el tiempo.
const HASH_DUMMY = "$2b$12$TGsl5vZdLl0hy.aU49jJc.lBMXfyqdpPSuGLet4iCLjq9ms6Hx3yG"

function demasiadosIntentos(retryAfterSec: number) {
  const min = Math.ceil(retryAfterSec / 60)
  return NextResponse.json(
    { error: `Demasiados intentos. Probá de nuevo en ${min} minuto${min === 1 ? "" : "s"}.` },
    { status: 429 },
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales requeridas." }, { status: 400 })
    }

    const ip = await getClientIp()
    const rlIp = checkRateLimit(`login-ip:${ip}`, LIMITE_POR_IP, VENTANA_MS)
    if (!rlIp.ok) return demasiadosIntentos(rlIp.retryAfterSec)
    const rlEmail = checkRateLimit(`login-email:${email}`, LIMITE_POR_EMAIL, VENTANA_MS)
    if (!rlEmail.ok) return demasiadosIntentos(rlEmail.retryAfterSec)

    // Sin distinguir mayúsculas: las cuentas viejas pueden tener el email
    // guardado con mayúsculas; las nuevas se guardan en minúscula.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })

    const match = await bcrypt.compare(password, user?.password ?? HASH_DUMMY)
    if (!user?.password || !match) {
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
