"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth, getSuperAdminSession, setSessionCookie } from "@/lib/session"
import { DIAS_PRUEBA } from "@/lib/tenant-status"
import { sendComplejoAprobado } from "@/lib/email"

// Acciones del panel /admin. Todas validan SUPER_ADMIN contra la DB.

const DIA_MS = 86_400_000

async function verificarSuperAdmin() {
  const session = await getSuperAdminSession()
  if (!session) throw new Error("No autorizado")
  return session
}

/** Suma días partiendo de la fecha de vencimiento si todavía no pasó, o de hoy si ya pasó. */
function extenderDesde(actual: Date | null, dias: number): Date {
  const base = actual && actual.getTime() > Date.now() ? actual.getTime() : Date.now()
  return new Date(base + dias * DIA_MS)
}

export async function aprobarComplejo(tenantId: string) {
  await verificarSuperAdmin()

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      pendingApproval: false,
      subscriptionStatus: "TRIALING",
      subscriptionEndsAt: new Date(Date.now() + DIAS_PRUEBA * DIA_MS),
    },
    select: { name: true, users: { where: { role: "ADMIN" }, select: { email: true, name: true } } },
  })

  for (const dueno of tenant.users) {
    await sendComplejoAprobado({
      to: dueno.email,
      duenoNombre: dueno.name ?? "",
      clubNombre: tenant.name,
      diasPrueba: DIAS_PRUEBA,
    })
  }

  revalidatePath("/admin")
}

/**
 * Rechaza un alta pendiente: borra el club y la cuenta del dueño. Solo para
 * pendientes sin reservas, para no destruir datos reales por un click.
 */
export async function rechazarComplejo(tenantId: string) {
  await verificarSuperAdmin()

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { pendingApproval: true, _count: { select: { bookings: true } } },
  })
  if (!tenant) throw new Error("Complejo no encontrado")
  if (!tenant.pendingApproval || tenant._count.bookings > 0) {
    throw new Error("Solo se pueden rechazar altas pendientes sin reservas. Para un club activo, usá Suspender.")
  }

  await prisma.$transaction([
    prisma.courtBlock.deleteMany({ where: { court: { tenantId } } }),
    prisma.schedule.deleteMany({ where: { court: { tenantId } } }),
    prisma.court.deleteMany({ where: { tenantId } }),
    prisma.user.deleteMany({ where: { tenantId, role: "ADMIN" } }),
    prisma.tenant.delete({ where: { id: tenantId } }),
  ])

  revalidatePath("/admin")
}

export async function extenderPrueba(tenantId: string, dias: number) {
  await verificarSuperAdmin()
  if (!Number.isInteger(dias) || dias < 1 || dias > 365) throw new Error("Cantidad de días inválida")

  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { subscriptionEndsAt: true } })
  if (!t) throw new Error("Complejo no encontrado")

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "TRIALING", subscriptionEndsAt: extenderDesde(t.subscriptionEndsAt, dias) },
  })
  revalidatePath("/admin")
}

/** Registra un pago manual: pasa a ACTIVE y corre el vencimiento N meses (30 días c/u). */
export async function registrarPago(tenantId: string, meses: number) {
  await verificarSuperAdmin()
  if (!Number.isInteger(meses) || meses < 1 || meses > 24) throw new Error("Cantidad de meses inválida")

  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { subscriptionEndsAt: true } })
  if (!t) throw new Error("Complejo no encontrado")

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionStatus: "ACTIVE", subscriptionEndsAt: extenderDesde(t.subscriptionEndsAt, meses * 30) },
  })
  revalidatePath("/admin")
}

/** Suspende el club: bloquea panel y página pública. Las reservas existentes no se tocan. */
export async function suspenderComplejo(tenantId: string) {
  await verificarSuperAdmin()
  await prisma.tenant.update({ where: { id: tenantId }, data: { subscriptionStatus: "CANCELLED" } })
  revalidatePath("/admin")
}

/** Levanta la suspensión. Si la fecha ya venció, queda "vencido" hasta registrar un pago o extender. */
export async function reactivarComplejo(tenantId: string) {
  await verificarSuperAdmin()
  await prisma.tenant.update({ where: { id: tenantId }, data: { subscriptionStatus: "ACTIVE" } })
  revalidatePath("/admin")
}

export async function guardarNotasAdmin(tenantId: string, notas: string) {
  await verificarSuperAdmin()
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { adminNotes: notas.trim().slice(0, 2000) || null },
  })
  revalidatePath("/admin")
}

/**
 * Entra al panel de un club como si fuera su dueño: re-firma la sesión con
 * role ADMIN + el tenantId del club y la marca `imp`. Así todos los chequeos
 * existentes ("ADMIN de este tenant") funcionan sin tocarlos.
 */
export async function entrarComoComplejo(tenantId: string) {
  const session = await verificarSuperAdmin()

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  if (!tenant) throw new Error("Complejo no encontrado")

  await setSessionCookie({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: "ADMIN",
    tenantId,
    impersonating: true,
  })
  redirect(`/dashboard/${tenant.slug}`)
}

/** Vuelve a la sesión normal de super admin. */
export async function salirDeComplejo() {
  const session = await auth()
  if (!session?.user.impersonating) redirect("/dashboard")

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login")

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  })
  redirect("/admin")
}
