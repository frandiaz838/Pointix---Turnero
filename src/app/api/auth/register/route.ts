import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { setSessionCookie } from "@/lib/session"
import { slugDisponible } from "@/lib/slug"
import { normalizeWhatsappNumber } from "@/lib/whatsapp"
import { checkRateLimit, getClientIp } from "@/lib/ratelimit"
import { sendNuevoComplejoPendiente } from "@/lib/email"

// Alta self-serve de un complejo: crea el dueño (ADMIN) + su Tenant en estado
// pendiente. El club no aparece en público ni puede usar el panel hasta que
// un SUPER_ADMIN lo aprueba desde /admin (ahí arranca la prueba).

const RL_REGISTRO_LIMIT = 3
const RL_REGISTRO_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const ip = await getClientIp()
    const rl = checkRateLimit(`registro:${ip}`, RL_REGISTRO_LIMIT, RL_REGISTRO_WINDOW_MS)
    if (!rl.ok) {
      return NextResponse.json({ error: "Demasiados registros desde esta conexión. Probá más tarde." }, { status: 429 })
    }

    const body = await request.json()
    const name      = String(body.name ?? "").trim()
    const email     = String(body.email ?? "").trim()
    const password  = String(body.password ?? "")
    const clubName  = String(body.clubName ?? "").trim()
    const whatsappRaw = String(body.whatsapp ?? "").trim()

    if (!name || !email || !password || !clubName || !whatsappRaw) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña tiene que tener al menos 8 caracteres." }, { status: 400 })
    }
    const whatsapp = normalizeWhatsappNumber(whatsappRaw)
    if (!whatsapp || whatsapp.length < 10) {
      return NextResponse.json({ error: "El número de WhatsApp no parece válido." }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email." }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const slug = await slugDisponible(clubName)

    const user = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: clubName,
          slug,
          whatsappNumber: whatsapp,
          pendingApproval: true,
        },
      })
      return tx.user.create({
        data: { name, email, password: hashedPassword, role: "ADMIN", tenantId: tenant.id },
      })
    })

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    })

    // Aviso a los super admins (fire-and-forget: si falla el mail, el alta igual vale)
    const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { email: true } })
    if (superAdmins.length > 0) {
      await sendNuevoComplejoPendiente({
        to: superAdmins.map((u) => u.email),
        clubNombre: clubName,
        duenoNombre: name,
        duenoEmail: email,
        whatsapp,
      })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    console.error("[register] error:", e)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
