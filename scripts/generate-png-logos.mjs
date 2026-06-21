// Genera versiones PNG de los SVGs del logo para usar en emails
// (los clientes de mail no renderizan SVG).
//
// Uso: node scripts/generate-png-logos.mjs

import sharp from "sharp"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, "..", "public")

const tasks = [
  {
    input:  "logo-wordmark-white.svg",
    output: "logo-wordmark-white.png",
    width:  480, // ancho final del PNG (2x para retina, después se muestra a 240px)
  },
  {
    input:  "logo-isotype-white.svg",
    output: "logo-isotype-white.png",
    width:  256,
  },
]

for (const t of tasks) {
  const svg = readFileSync(resolve(publicDir, t.input))
  const png = await sharp(svg, { density: 300 })
    .resize({ width: t.width, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
  writeFileSync(resolve(publicDir, t.output), png)
  console.log(`✓ ${t.output} (${png.length} bytes)`)
}
