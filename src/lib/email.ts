import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const fromAddress  = process.env.EMAIL_FROM ?? "Pointix <onboarding@resend.dev>"

// Singleton lazy del cliente Resend
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!resendApiKey) return null
  if (!_resend) _resend = new Resend(resendApiKey)
  return _resend
}

interface ReservaConfirmadaData {
  toEmail: string
  clienteNombre: string
  clubNombre: string
  clubSlug: string
  canchaName: string
  sport: string  // ya formateado tipo "Pádel"
  fecha: Date    // startTime de la reserva
  endTime: Date
  precio: number
  paidOnline: boolean  // si pagó con MP
  whatsappUrl?: string | null  // link wa.me al complejo con mensaje prearmado
}

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
function formatFecha(d: Date): string {
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
function formatHora(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`
}

function buildConfirmacionHtml(d: ReservaConfirmadaData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pointix.com.ar"
  const verReservaUrl = `${appUrl}/${d.clubSlug}`
  const precioFmt = `$${d.precio.toLocaleString("es-AR")}`
  const horaInicio = formatHora(d.fecha)
  const horaFin    = formatHora(d.endTime)
  const fechaFmt   = formatFecha(d.fecha)
  const pagoTxt    = d.paidOnline ? "Pago online · MercadoPago" : "Pago en el complejo"

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reserva confirmada</title>
</head>
<body style="margin:0;padding:0;background:#0C0E14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#F2F4F8;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0C0E14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">

          <!-- Header marca -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="color:#A3FF12;font-size:11px;font-weight:800;letter-spacing:0.45em;text-transform:uppercase;">Pointix</span>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:20px;padding:32px 24px;">

              <!-- Checkmark + Título -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <div style="width:56px;height:56px;background:rgba(163,255,18,0.12);border:1px solid rgba(163,255,18,0.3);border-radius:50%;display:inline-block;line-height:54px;text-align:center;">
                      <span style="color:#A3FF12;font-size:30px;font-weight:bold;">✓</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;">
                    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;">
                      Reserva confirmada
                    </h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:14px;">
                      ¡Nos vemos en la cancha, ${d.clienteNombre}!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Separador lime -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(163,255,18,0.4),transparent);margin:24px 0;"></div>

              <!-- Detalles de la reserva -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;">
                    <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Complejo</p>
                    <p style="margin:4px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;">${d.clubNombre}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Cancha</p>
                    <p style="margin:4px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;">${d.canchaName} <span style="color:rgba(255,255,255,0.4);font-weight:400;font-size:14px;">· ${d.sport}</span></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Día</p>
                    <p style="margin:4px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;">${fechaFmt}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.06);">
                    <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">Horario</p>
                    <p style="margin:4px 0 0;color:#FFFFFF;font-size:18px;font-weight:700;font-variant-numeric:tabular-nums;">${horaInicio} — ${horaFin} hs</p>
                  </td>
                </tr>
              </table>

              <!-- Precio destacado -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:rgba(163,255,18,0.06);border:1px solid rgba(163,255,18,0.2);border-radius:12px;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="margin:0;color:rgba(163,255,18,0.7);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;">${pagoTxt}</p>
                    <p style="margin:4px 0 0;color:#A3FF12;font-size:32px;font-weight:900;letter-spacing:-0.02em;">${precioFmt}</p>
                  </td>
                </tr>
              </table>

              ${d.whatsappUrl ? `
              <!-- CTA WhatsApp al complejo -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${d.whatsappUrl}" style="display:inline-block;background:#25D366;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;">
                      Avisar al complejo por WhatsApp
                    </a>
                    <p style="margin:10px 0 0;color:rgba(255,255,255,0.4);font-size:12px;">
                      El complejo confirmará tu llegada por este medio.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- CTA secundario -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;">
                <tr>
                  <td align="center">
                    <a href="${verReservaUrl}" style="display:inline-block;background:${d.whatsappUrl ? "transparent" : "#A3FF12"};color:${d.whatsappUrl ? "rgba(255,255,255,0.55)" : "#0C0E14"};text-decoration:${d.whatsappUrl ? "underline" : "none"};font-weight:${d.whatsappUrl ? "500" : "800"};font-size:${d.whatsappUrl ? "13px" : "14px"};padding:${d.whatsappUrl ? "8px 16px" : "14px 28px"};border-radius:12px;">
                      Ver el complejo
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;color:rgba(255,255,255,0.25);font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600;">
                Pointix · Reservas deportivas
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendBookingConfirmation(d: ReservaConfirmadaData): Promise<{ ok: boolean; error?: string }> {
  const client = getResend()
  if (!client) {
    // No hay API key — log y seguir sin romper (degrada gracefully)
    console.warn("[email] RESEND_API_KEY no seteada — email no enviado")
    return { ok: false, error: "no api key" }
  }

  try {
    const subject = `Reserva confirmada · ${d.clubNombre} · ${formatFecha(d.fecha)}`
    const html = buildConfirmacionHtml(d)
    const text = `Reserva confirmada en ${d.clubNombre}\n\nCancha: ${d.canchaName} (${d.sport})\nDía: ${formatFecha(d.fecha)}\nHora: ${formatHora(d.fecha)} — ${formatHora(d.endTime)}\nTotal: $${d.precio.toLocaleString("es-AR")} (${d.paidOnline ? "pagado online" : "pago en el complejo"})\n\n¡Nos vemos en la cancha, ${d.clienteNombre}!\n\n— Pointix`

    const { error } = await client.emails.send({
      from: fromAddress,
      to: d.toEmail,
      subject,
      html,
      text,
    })

    if (error) {
      console.error("[email] resend error:", error)
      return { ok: false, error: error.message ?? "Error de Resend" }
    }
    return { ok: true }
  } catch (e) {
    console.error("[email] exception:", e)
    return { ok: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}
