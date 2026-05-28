import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "club-atletico" },
    update: {},
    create: {
      name: "Club Atlético",
      slug: "club-atletico",
      description: "Complejo deportivo con canchas de pádel y fútbol",
      courts: {
        create: [
          { name: "Cancha 1 - Pádel", sport: "PADEL", pricePerHour: 3500 },
          { name: "Cancha 2 - Pádel", sport: "PADEL", pricePerHour: 3500 },
          { name: "Cancha 3 - Fútbol 5", sport: "FOOTBALL", pricePerHour: 6000 },
        ],
      },
    },
  })

  console.log(`Tenant creado: ${tenant.name} → /${tenant.slug}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
