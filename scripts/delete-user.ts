import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const deleted = await prisma.user.deleteMany({
    where: { email: "frandiaz838@gmail.com" },
  })
  console.log(`✓ Usuarios eliminados: ${deleted.count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
