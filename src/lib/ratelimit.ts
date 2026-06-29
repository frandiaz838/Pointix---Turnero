import { headers } from "next/headers"

/**
 * Rate limiter en memoria, por instancia, con ventana fija.
 *
 * Caso de uso: prevenir que un mismo IP abuse del flujo público de reservas
 * creando PENDING en bucle para bloquear slots hasta que expiren.
 *
 * Limitaciones: cada instancia serverless tiene su propio Map, así que el
 * límite efectivo es `limit × cant_instancias`. Suficiente para frenar abuso
 * casual desde un solo IP. Para garantías duras de un sistema con muchas
 * instancias conviene migrar a Upstash Ratelimit.
 */

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number; retryAfterSec: number }

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (b.count >= limit) {
    const retryAfterMs = Math.max(0, b.resetAt - now)
    return { ok: false, retryAfterMs, retryAfterSec: Math.ceil(retryAfterMs / 1000) }
  }
  b.count++
  return { ok: true }
}

/** IP del cliente derivado de los headers que setea Vercel/proxy.
 * Si nada matchea, devuelve "unknown" — todos los "unknown" comparten bucket,
 * que es lo conservador. */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  const real = h.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}
