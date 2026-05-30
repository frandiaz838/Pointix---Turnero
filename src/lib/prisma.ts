import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  // Cuando la connection string tiene ?sslmode=require, pg ignora el ssl del config.
  // Sacamos sslmode de la URL y lo manejamos con ssl: { rejectUnauthorized: false }.
  const connectionString = (process.env.DATABASE_URL ?? "")
    .replace("?sslmode=require", "")
    .replace("&sslmode=require", "")

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
