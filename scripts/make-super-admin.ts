// Uso: npx tsx --env-file=.env scripts/make-super-admin.ts <email>
// Le da rol SUPER_ADMIN a un usuario existente (acceso a /admin). Su tenantId
// se conserva, pero para operar ese club tiene que entrar desde /admin.
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.argv[2]
  if (!email) throw new Error("Pasá el email: npx tsx --env-file=.env scripts/make-super-admin.ts <email>")

  const user = await prisma.user.update({
    where: { email },
    data: { role: "SUPER_ADMIN" },
  })

  console.log(`✓ ${user.email} → SUPER_ADMIN. Cerrá sesión y volvé a entrar para que tome el rol.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
