import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "club-atletico" } })
  if (!tenant) throw new Error('Tenant "club-atletico" no encontrado')

  const user = await prisma.user.update({
    where: { email: "frandiaz838@gmail.com" },
    data: { role: "ADMIN", tenantId: tenant.id },
  })

  console.log(`✓ Rol actualizado: ${user.email} → ADMIN (tenant: ${tenant.name})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
