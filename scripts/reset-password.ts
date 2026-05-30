import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const connectionString = (process.env.DATABASE_URL ?? "")
  .replace("?sslmode=require", "")
  .replace("&sslmode=require", "")

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashed = await bcrypt.hash("papapa123", 12)
  const user = await prisma.user.update({
    where: { email: "frandiaz838@gmail.com" },
    data: { password: hashed },
  })
  console.log(`✓ Contraseña actualizada para: ${user.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
