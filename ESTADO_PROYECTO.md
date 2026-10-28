# Pointix — Estado del proyecto

_Última actualización: 2026-10-23 (último commit de código: 2026-07-06)_

---

## Stack completo

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Lenguaje | TypeScript 5 |
| UI | Tailwind CSS v4 + shadcn/ui (sobre `@base-ui/react`) |
| Íconos | Lucide React + Phosphor Icons |
| Gráficos | Recharts 3 |
| ORM | Prisma 7.8.0 (cliente generado en `src/generated/prisma`) |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Custom JWT con `jose` + `bcryptjs`, cookie `pointix-session` httpOnly |
| Pagos | MercadoPago SDK (`mercadopago`) — token propio de cada club |
| Emails | Resend |
| Deploy | Vercel (plan Hobby) |
| Dominio | `pointix.com.ar` (redirect 308 desde `*.vercel.app`) |
| Repo | `github.com/frandiaz838/Pointix---Turnero` |
| Fuentes | Barlow Condensed (display) + Outfit (body) + Geist Mono |

---

## Variables de entorno

```env
# Base de datos (Supabase)
DATABASE_URL="postgresql://usuario:password@host:5432/postgres"

# Secreto para firmar los JWT de sesión
AUTH_SECRET="generá uno con: openssl rand -hex 32"
AUTH_URL="https://pointix.com.ar"
NEXT_PUBLIC_APP_URL="https://pointix.com.ar"

# Cifrado AES-256-GCM del access token MP de cada club (lib/crypto.ts)
MP_ENCRYPTION_KEY="..."

# Emails transaccionales
RESEND_API_KEY="re_..."
EMAIL_FROM="Pointix <reservas@pointix.com.ar>"

# Protege /api/cron/verify-payments (header Authorization: Bearer <CRON_SECRET>)
CRON_SECRET="..."
```

> No hay `MP_ACCESS_TOKEN` global: cada club pega su propio token desde el admin y se guarda cifrado en `Tenant.mpAccessToken`.
> `.env.example` está desactualizado (solo tiene las 3 primeras).

---

## Modelo de datos (Prisma)

```
Tenant        → slug único, nombre, descripción, dirección, whatsappNumber
                mpAccessToken (cifrado), mpPublicKey, mpExpiryMinutes (def. 30),
                mpSenaPercentage (seña %), campos Stripe (sin usar)
  └── User    → rol: SUPER_ADMIN | ADMIN | CLIENT, sessionsRevokedAt
  └── Court   → deporte, precio/hora, isActive, archivedAt (soft delete)
        └── Schedule    → apertura, cierre, slotMinutes (por día de semana)
        └── CourtBlock  → bloqueo puntual (mantenimiento/evento) con motivo
        └── Booking     → startTime, endTime, status, totalPrice,
                          guestName/Phone/Email, mpPaymentId/mpStatus/
                          mpPreferenceId, expiresAt
```

**BookingStatus:** PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, EXPIRED

**11 deportes:** FUTBOL_5, FUTBOL_7, FUTBOL_11, PADEL, TENIS, SQUASH, BASQUET, VOLEY, HOCKEY, NATACION, FOOTBALL (legacy)

---

## Qué está implementado

### Landing comercial `/` (pointix.com.ar)
- Identidad visual con logo SVG + wordmark, favicon
- Secciones de features, "Tu panel de control", pasos
- Mockups de dispositivos (iPhone con Dynamic Island + MacBook; MacBook oculto en mobile)
- OpenGraph image generada (`src/app/opengraph-image.tsx`)

### Onboarding de complejos (self-serve con aprobación)
- `/register` pide nombre del complejo, WhatsApp, nombre, email y contraseña → crea User ADMIN + Tenant con `pendingApproval: true` (slug autogenerado, `lib/slug.ts`) y deja la sesión iniciada
- Rate limit: 3 registros por IP por hora. Email a todos los SUPER_ADMIN avisando del alta
- Mientras está pendiente: `/dashboard` muestra "Estamos revisando tu complejo" y la página pública da 404
- Al aprobar: arranca la prueba de **30 días** (`DIAS_PRUEBA`) y se le manda un email al dueño
- **Ciclo de vida** derivado en `lib/tenant-status.ts` → `pendiente | prueba | activo | vencido | suspendido`
  - `vencido`: se bloquea **solo el panel** (los clientes siguen reservando)
  - `suspendido`: bloquea panel + página pública
  - `subscriptionEndsAt: null` = sin vencimiento (clubes previos)
- Bloqueo del panel en `src/app/dashboard/[slug]/layout.tsx` (+ aviso de días restantes los últimos 7 días)
- Checklist "Primeros pasos" en el dashboard (cancha → horarios → MP opcional → primera reserva), se oculta sola

### Panel super admin `/admin`
- Acceso: rol `SUPER_ADMIN` validado contra la DB (`getSuperAdminSession`). Al loguearse, `/dashboard` redirige a `/admin`
- KPIs globales, filtros por estado, búsqueda por club/slug/email
- Por club: aprobar / rechazar (solo pendientes sin reservas), registrar pago manual (1/3/6/12 meses → ACTIVE), extender prueba, suspender / reactivar, notas internas, link a WhatsApp del dueño
- **"Entrar al panel"**: re-firma la sesión como ADMIN de ese club con claim `imp` → se ve exactamente como el dueño, con barra "Volver al super admin". Entra aunque el club esté vencido
- Script: `npx tsx --env-file=.env scripts/make-super-admin.ts <email>`

### Autenticación
- Login (`/login`) con JWT firmado con `jose`, expira a los **7 días**. Firma centralizada en `signSessionToken` / `setSessionCookie` (`lib/session.ts`)
- `getSession()` envuelta en `React.cache` (1 query por request)
- "Cerrar sesión en todos los dispositivos" (Configuración → Seguridad) vía `User.sessionsRevokedAt`
- Login/logout normales NO revocan otras sesiones (a propósito)
- `src/proxy.ts` protege `/dashboard` y redirige logueados fuera de `/login`/`/register`

### Página del cliente `/{slug}` (página única)
- Hero compacto con identidad del club + info row (horario, turnos libres)
- Grilla de reservas integrada abajo (`/{slug}/reservar` es solo redirect)
- Mobile: 4 columnas agrupadas Mañana / Tarde / Noche
- "Hoy" calculado en server con TZ Argentina y pasado como prop (`force-dynamic`)
- Reserva como invitado (nombre + teléfono AR + email opcional) o usuario registrado
- Rate limit: 5 reservas por IP cada 10 min (admins exentos)
- Tarjeta de éxito en `?reservado={bookingId}` con CTA a WhatsApp del club (mensaje prearmado)

### Pagos — MercadoPago (token por club)
- Cada club conecta su cuenta MP desde Configuración (validación contra `/users/me`, botón Desconectar)
- La plata va directo al club; Pointix no procesa pagos
- **Seña configurable** (`mpSenaPercentage`): cobra un % online y el resto en el complejo. Piso online: **$1**
- `/{slug}/pagar/{bookingId}` crea (o reusa) la Preference y redirige al checkout
- Reserva queda PENDING con `expiresAt`; si no se paga, pasa a EXPIRED y libera el slot
- **Tres capas de confirmación de pago:**
  1. Webhook `POST /api/mp/webhook` (busca el tenant probando cada token — escala a ~50-100 clubs)
  2. Fallback sincrónico en la URL de éxito (`verificarPagoReserva`)
  3. Cron `GET /api/cron/verify-payments` (revisa PENDING de las últimas 24h) — **ver pendientes: hoy no está programado**
- **Seña por transferencia** (`Tenant.transfer*`, `Booking.paymentMethod`): el jugador transfiere al alias/CBU del club y manda el comprobante por WhatsApp desde `/{slug}/transferir/{id}`; el club confirma con "Recibí la transferencia". Vence en `transferExpiryMinutes` (30 min–24 h). Requiere WhatsApp cargado
- La seña (`mpSenaPercentage`) es común a MP y transferencia: se paga por adelantado y el resto siempre en el complejo. Si el club tiene los dos medios, el jugador elige. Lógica en `lib/medios-pago.ts`
- Club sin ningún medio online → reserva PENDING sin seña ("Pago en el complejo")

### Notificaciones
- Email de confirmación vía Resend (con desglose de seña y botón de WhatsApp), disparado por:
  webhook MP aprobado, confirmación manual del admin, y reserva manual con email
- Helper centralizado: `src/lib/booking-notifications.ts`

### Dashboard admin `/dashboard/{slug}`
- **Principal:** KPIs con CountUp (aggregate separado), reloj en TZ AR, "Reservas de hoy" (top 10 + "Ver las otras N"), canchas por deporte
- **Reservas:** filtros por período y por estado, búsqueda por nombre/teléfono/email, paginación (25), confirmar con "Deshacer", cancelar con modal, marcar no-show, editar reserva, **crear reserva manual**
- **Ingresos:** selector de período (hoy / este mes / mes pasado / este año / año pasado), gráficos por cancha y por deporte
- **Ocupación:** período + toggle "Todo el día / Horarios pico (18-23h)"
- **Canchas:** crear, edición unificada con tabs (datos, horarios, bloqueos), copiar horario entre días, cierre a las 00:00, desactivar con aviso de reservas futuras, **eliminar = soft delete** (preserva histórico, cancela futuras)
- **Bloqueos:** detectan reservas en conflicto y ofrecen "cancelar reservas y bloquear igual"
- **Configuración:** datos del club (descripción, dirección, WhatsApp), cobros MP, tarjeta con link de reservas para compartir, seguridad
- `expireStalePendings()` corre al cargar páginas del dashboard
- Empty states accionables, toasts, menú mobile con portal

### Design system — "TOXIC FRESH"
- Base `#0C0E14`, primario lime `#A3FF12`, cyan como acento secundario
- Background con gradiente lime (arriba-izq) → cyan (abajo)
- Glassmorphism: `.glass-card`, `.glass-header`, `.glass-nav`
- Glow: `.glow-lime`, `.text-glow-lime`, `.glow-cyan`, `.text-glow-cyan`, borde gradiente dual lime + cyan
- Slots: `.slot-available`, `.slot-selected`, `.slot-occupied`, `.slot-past`
- Ojo en iOS: `backdrop-filter` en el drawer causaba transparencia — se sacó

### Scripts (`/scripts`)
- `seed-admin.ts`, `reset-password.ts`, `delete-user.ts`, `generate-png-logos.mjs`

---

## Pendientes

### Crítico / revisar ya
- [ ] **Confirmar el cron de verificación de pagos en cron-job.org.** `CRON_SECRET` ya está en Vercel (el endpoint responde 401 sin auth). El job tiene que llamar a `https://www.pointix.com.ar/api/cron/verify-payments` (con www: el apex redirige y pierde el header) con `Authorization: Bearer <CRON_SECRET>`, cada 5 min
- [ ] Actualizar `.env.example` con todas las variables
- [ ] Las Server Actions del panel no chequean el estado del club (solo lo hacen las páginas, vía layout). Un club vencido no tiene UI para mutar, pero conviene centralizar la autorización en un helper `requireTenantAdmin()`
- [ ] Lint preexistente: `<a href="/">` en el footer de `src/app/[slug]/page.tsx` (usar `<Link>`)
- [ ] Comentarios viejos que dicen "piso de $5" (`schema.prisma`, `actions/mp.ts`) — el piso real es $1

### Importante — post-lanzamiento
- [ ] Recuperación de contraseña (email + token de reset)
- [ ] Panel del cliente `/{slug}/mis-reservas` con historial y cancelación
- [ ] Notificaciones de cancelación (cliente y admin)
- [ ] Cobro automático del SaaS (hoy es manual desde `/admin`; evaluar MP Suscripciones)
- [ ] Recordatorio por email cuando faltan pocos días de prueba (hoy solo hay aviso dentro del panel)
- [ ] Límite de anticipación de reservas por cancha
- [ ] Webhook MP: mapping explícito tenant ↔ pago (hoy prueba cada token; no escala a muchos clubs)
- [ ] Rate limit en memoria por instancia → migrar a Upstash si hace falta

### Nice to have
- [ ] Duración variable (1h, 1.5h, 2h) y multi-slot consecutivo
- [ ] Precios pico / valle
- [ ] Reservas recurrentes
- [ ] App mobile

---

## Decisiones de arquitectura

**Auth custom (no NextAuth en producción)** — NextAuth v5 está instalado pero la sesión real es un JWT propio con `jose` (payload con `tenantId` y `role`). Las tablas de Auth.js existen por compatibilidad futura (OAuth).

**Multi-tenant vía `tenantId`** — sin RLS en Postgres; la seguridad está en la app (verificar `session.user.tenantId === tenant.id` en cada ruta/action).

**Server Actions para mutaciones** — en `src/actions/` (auth, bloqueos, canchas, mp, mp-config, reservas, tenant-config). API routes solo para login/register, webhook MP y cron.

**MP "Opción A": token por club** — cada club usa su propia cuenta MP; Pointix no toca la plata ni tiene responsabilidad financiera. Token cifrado con AES-256-GCM (formato `enc:v1:<base64>`, compatible con tokens legacy en texto plano).

**Horarios como tabla `Schedule`** — hasta 7 por cancha; `generarSlots()` arma los slots en runtime.

**Tiempos: hora AR guardada como UTC** — convención del codebase: la hora local argentina se guarda "como si fuera UTC". Helpers en `src/lib/timezone.ts` (`todayInArIso()`, `nowInArAsArtificialUtc()`). Nunca usar `toISOString()` para calcular "hoy".

**Soft delete de canchas** — `archivedAt` en vez de borrar; todos los listados filtran `archivedAt: null`.

**Constantes fuera de archivos `"use server"`** — un archivo `"use server"` solo puede exportar funciones async (por eso `bloqueos-errors.ts` vive aparte).

---

## Rutas del proyecto

```
/                                         → landing comercial de Pointix
/login, /register                         → register = alta de complejo
/admin                                    → panel super admin
/{slug}                                   → página del club + grilla de reservas
/{slug}/reservar                          → redirect a /{slug}
/{slug}/canchas/{courtId}/reservar        → reservar cancha específica
/{slug}/pagar/{bookingId}                 → crea Preference MP y redirige
/dashboard                                → redirect al dashboard del tenant
/dashboard/{slug}                         → panel principal
/dashboard/{slug}/reservas                → gestión de reservas
/dashboard/{slug}/reservas/nueva          → reserva manual
/dashboard/{slug}/reservas/{id}/editar
/dashboard/{slug}/ingresos
/dashboard/{slug}/ocupacion
/dashboard/{slug}/configuracion           → datos del club, cobros MP, link, seguridad
/dashboard/{slug}/mp-config               → (legacy, unificado en configuracion)
/dashboard/{slug}/canchas/nueva
/dashboard/{slug}/canchas/{id}            → edición con tabs
/dashboard/{slug}/canchas/{id}/editar|horarios|bloqueos

API:
/api/login, /api/auth/register
/api/mp/webhook                           → notificaciones de pago MP
/api/cron/verify-payments                 → verificación de PENDING (requiere CRON_SECRET)
```
