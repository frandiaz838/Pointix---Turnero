import { prisma } from "@/lib/prisma"

// Rutas de primer nivel que no pueden usarse como slug de un club.
const RESERVADOS = new Set([
  "admin", "api", "dashboard", "login", "register", "logout",
  "_next", "favicon.ico", "opengraph-image", "robots.txt", "sitemap.xml",
])

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // saca tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "")
}

/** Genera un slug libre a partir del nombre: "club-norte", "club-norte-2", ... */
export async function slugDisponible(nombre: string): Promise<string> {
  const base = slugify(nombre) || "complejo"
  for (let i = 1; i < 100; i++) {
    const candidato = i === 1 ? base : `${base}-${i}`
    if (RESERVADOS.has(candidato)) continue
    const existe = await prisma.tenant.findUnique({ where: { slug: candidato }, select: { id: true } })
    if (!existe) return candidato
  }
  return `${base}-${Date.now().toString(36)}`
}
