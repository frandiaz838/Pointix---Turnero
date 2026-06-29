import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

/**
 * Cifrado simétrico para valores sensibles guardados en la DB
 * (principalmente: `Tenant.mpAccessToken`).
 *
 * Diseño:
 * - AES-256-GCM con clave única `MP_ENCRYPTION_KEY` (base64 de 32 bytes).
 * - Storage format: "enc:v1:<base64(iv || ciphertext || authTag)>".
 *   El prefijo `enc:v1:` permite (a) distinguir un token cifrado de uno
 *   plaintext legacy y (b) versionar el formato a futuro sin romper datos.
 * - Si `MP_ENCRYPTION_KEY` no está seteada, `encryptToken` actúa como no-op
 *   y devuelve plaintext. Esto permite arrancar en dev sin clave; en prod la
 *   variable es obligatoria y `decryptToken` tira si encuentra un valor
 *   cifrado sin la clave para descifrarlo.
 *
 * Migración: tokens viejos sin prefijo se devuelven tal cual desde
 * `decryptToken`. La próxima vez que el admin guarde la config los re-cifra.
 */

const ALGO = "aes-256-gcm"
const KEY_LEN = 32
const IV_LEN = 12
const TAG_LEN = 16
const PREFIX = "enc:v1:"

let cachedKey: Buffer | null | undefined = undefined

function getKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey
  const raw = process.env.MP_ENCRYPTION_KEY
  if (!raw) {
    cachedKey = null
    return null
  }
  const buf = Buffer.from(raw, "base64")
  if (buf.length !== KEY_LEN) {
    throw new Error(
      `MP_ENCRYPTION_KEY debe ser 32 bytes en base64 (recibido: ${buf.length} bytes). ` +
      `Generala con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    )
  }
  cachedKey = buf
  return cachedKey
}

/** Cifra un valor para guardarlo en la DB. Si la clave no está seteada,
 * devuelve el plaintext (modo legacy/dev). */
export function encryptToken(plain: string): string {
  if (!plain) return plain
  const key = getKey()
  if (!key) return plain
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, ciphertext, tag]).toString("base64")
}

/** Descifra un valor leído de la DB. Si no tiene el prefijo `enc:v1:`,
 * lo asume plaintext legacy y lo devuelve sin tocar. */
export function decryptToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored
  const key = getKey()
  if (!key) {
    throw new Error(
      "Hay un token cifrado en la DB pero `MP_ENCRYPTION_KEY` no está seteada. " +
      "Configurala en las variables de entorno."
    )
  }
  const data = Buffer.from(stored.slice(PREFIX.length), "base64")
  if (data.length < IV_LEN + TAG_LEN) throw new Error("Token cifrado corrupto")
  const iv = data.subarray(0, IV_LEN)
  const tag = data.subarray(data.length - TAG_LEN)
  const ciphertext = data.subarray(IV_LEN, data.length - TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

/** Devuelve los últimos N caracteres del token plaintext, para mostrar
 * un fingerprint tipo "···· 9F2A" sin filtrar el valor completo. */
export function tokenSuffix(stored: string | null, n = 4): string | null {
  if (!stored) return null
  try {
    const plain = decryptToken(stored)
    return plain.slice(-n)
  } catch {
    return null
  }
}
