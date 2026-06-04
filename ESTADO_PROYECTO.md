# Pointix — Estado del proyecto

_Última actualización: 2026-06-04_

---

## Stack completo

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Lenguaje | TypeScript 5 |
| UI | Tailwind CSS v4 + shadcn/ui (sobre `@base-ui/react`) |
| Íconos | Lucide React + Phosphor Icons |
| Gráficos | Recharts 3 |
| ORM | Prisma 7.8.0 |
| Base de datos | PostgreSQL (Supabase) |
| Auth | Custom JWT con `jose` + `bcryptjs`, cookie `httpOnly` |
| Deploy | Vercel |
| Repo | `github.com/frandiaz838/Pointix---Turnero` |
| Fuentes | Barlow Condensed (display, 700/800/900) + Outfit (body) |

---

## Variables de entorno necesarias

```env
# Conexión a la base de datos (Supabase)
DATABASE_URL="postgresql://usuario:password@host:5432/postgres"

# Secreto para firmar los JWT de sesión
AUTH_SECRET="generá uno con: openssl rand -hex 32"

# URL base de la app (prod: dominio de Vercel)
AUTH_URL="https://tu-app.vercel.app"

# --- Próximamente ---
# MercadoPago
MP_ACCESS_TOKEN=""
MP_PUBLIC_KEY=""
MP_WEBHOOK_SECRET=""
```

---

## Modelo de datos (Prisma)

```
Tenant        → slug único, nombre, suscripción (Stripe preparado)
  └── User    → rol: SUPER_ADMIN | ADMIN | CLIENT
  └── Court   → deporte, precio/hora, activa/inactiva
        └── Schedule  → apertura, cierre, slotMinutes (por día de semana)
        └── Booking   → startTime, endTime, status, precio, datos de guest
                        mpPaymentId / mpStatus (campos ya presentes en DB)
```

**11 deportes soportados:** FUTBOL_5, FUTBOL_7, FUTBOL_11, PADEL, TENIS, SQUASH, BASQUET, VOLEY, HOCKEY, NATACION, FOOTBALL (legacy)

---

## Qué está implementado y funcionando

### Autenticación
- Registro de usuarios (`/register`) — email + contraseña
- Login (`/login`) — JWT firmado con `jose`, cookie `pointix-session` httpOnly, 30 días
- Logout — borra cookie
- Sesión verificada en server components via `auth()` de `src/lib/session.ts`
- Multi-rol: `ADMIN` ve su propio dashboard, `CLIENT` puede reservar sin cuenta

### Landing pública `/{slug}`
- Hero con animación letra a letra (HeroTitle, stagger 38ms por carácter)
- Fuente clamp responsiva — nunca se corta en dos líneas
- Nombre del complejo + descripción opcional
- Sport pills con scroll suave a cada sección de deporte
- Canchas agrupadas por deporte con badge "Disponible hoy" (calcula slots reales)
- Banner de confirmación al volver con `?reservado=true`
- Mesh gradient animado (orbs flotantes, `orbFloat` 16s / `orbFloatAlt` 22s)

### Flujo de reserva público
- **Grilla (`/{slug}/reservar`):** selector de fecha + filtro por deporte, tabla desktop / grid 3 columnas mobile, slots con stagger animation (`slotAppear`, 22ms delay por slot), estados: disponible / ocupado / pasado / cerrado
- **Reserva por cancha (`/{slug}/canchas/{courtId}/reservar`):** formulario directo con datepicker, indicador de días abiertos, slots con glow al hover/seleccionar
- Reserva como **invitado** (nombre + teléfono) o como **usuario registrado**
- Verificación de conflictos en `crearReserva` (server action)
- Redirect a `/{slug}?reservado=true` al confirmar

### Dashboard admin `/dashboard/{slug}`
- **Página principal:** stats con CountUp animado (reservas hoy, ingresos hoy/mes, % ocupación), listado de reservas del día, canchas agrupadas por deporte con toggle activa/inactiva
- **Reservas (`/reservas`):** filtros por período (hoy, mañana, esta semana, 2 semanas, fecha custom con calendario), cards con acciones confirmar/cancelar
- **Ingresos (`/ingresos`):** stats hoy/semana/mes, tabla semanal con barra de progreso, gráficos de barras (por cancha) y donut (por deporte) via Recharts
- **Ocupación (`/ocupacion`):** selector de período (hoy/semana/mes/año), gráfico de barras color-coded, detalle por cancha
- **Canchas:** crear, editar (nombre, deporte, precio), activar/desactivar, configurar horarios por día
- Glass header sticky en todas las subpáginas

### Design system
- Paleta única: `#0C0E14` base, `#CAFF00` acento exclusivo
- Glassmorphism: `.glass-card`, `.glass-header`, `.glass-nav`
- Glow effects: `.text-glow-lime`, `.glow-lime`, `.btn-lime-glow`
- Card hover: background sube a `rgba(255,255,255,0.07)`, `translateY(-3px)`
- Gradient border: `.border-lime-gradient` (en cards de ingresos destacadas)
- Separadores: `.separator-lime`, `.separator-subtle`
- Slots: `.slot-available`, `.slot-selected`, `.slot-occupied`, `.slot-past`

---

## Qué está pendiente del MVP

### Crítico — bloqueante para producción real

- [ ] **Integración MercadoPago** _(ver sección siguiente)_
  - Los campos `mpPaymentId` y `mpStatus` ya existen en `Booking`
  - Falta: Preference API, redirect flow, webhook de confirmación
- [ ] **Email de confirmación de reserva** — al crear la reserva, enviar email al cliente y al admin (Resend o Nodemailer)
- [ ] **Onboarding de nuevos complejos** — hoy el registro crea un usuario sin tenant. Falta el flujo "crear mi complejo" (slug, nombre, descripción) y asignarle el rol ADMIN

### Importante — post-lanzamiento inmediato

- [ ] **Panel de reservas del cliente** — `/{slug}/mis-reservas` con historial y opción de cancelar
- [ ] **Recuperación de contraseña** — flujo email + token de reset
- [ ] **Gestión de suscripción** — los campos Stripe ya están en `Tenant` (stripeCustomerId, subscriptionStatus), falta el flujo de pago del SaaS
- [ ] **Notificaciones de cancelación** — al admin y al cliente cuando se cancela
- [ ] **Límite de reservas por anticipación** — configurar cuántos días a futuro se puede reservar por cancha

### Nice to have

- [ ] Selector de duración variable (1h, 1.5h, 2h) en el flujo de reserva
- [ ] Multi-slot: reservar más de un turno consecutivo
- [ ] Descuentos / precios diferenciados por horario (pico / valle)
- [ ] Reservas recurrentes (misma cancha todos los martes)
- [ ] App mobile (React Native / Expo)

---

## Decisiones de arquitectura importantes

**Auth custom (no NextAuth en producción)**
NextAuth v5 está instalado pero la sesión real usa un JWT propio firmado con `jose`. Motivo: control total sobre el payload (incluye `tenantId` y `role`), sin dependencia de tablas `Account`/`Session` de next-auth en el flujo crítico. Las tablas están en la DB por compatibilidad futura (OAuth providers).

**Multi-tenant via `tenantId`**
Cada `Court`, `Booking` y `User` admin tiene `tenantId`. Todos los queries filtran por tenant. No hay row-level security en Postgres — la seguridad está en la capa de aplicación (verificar `session.user.tenantId === tenant.id` en cada ruta).

**Server Actions para mutaciones**
`crearReserva`, `cancelarReserva`, `confirmarReserva`, `crearCancha`, `editarCancha`, `guardarHorarios` y `cerrarSesion` son Server Actions. No hay API routes para mutaciones (excepto login/register que necesitan manejar cookies).

**Horarios como tabla separada (`Schedule`)**
Cada cancha tiene hasta 7 registros Schedule (uno por día de semana). La función `generarSlots(openTime, closeTime, slotMinutes)` genera el array de horarios disponibles en runtime — no se pre-generan slots en la DB.

**Tiempos en UTC, timezone Argentina**
Todos los `DateTime` en Prisma se guardan en UTC. El día "hoy" se calcula con `Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })` para evitar problemas de medianoche.

**Prisma client en `src/generated/prisma`**
No en `node_modules`. Permite imports directos de tipos (`import { Sport } from "@/generated/prisma/client"`).

---

## Próximo paso: integración MercadoPago

### Contexto
El modelo `Booking` ya tiene los campos:
```prisma
mpPaymentId String?
mpStatus    String?
```

### Flujo a implementar

```
Usuario elige slot
  → crearReserva (crea Booking con status: PENDING, sin pagar)
  → redirige a /[slug]/reservas/[bookingId]/pagar
    → crea Preference MP con SDK Node
    → redirige a MP Checkout
      → MP llama webhook POST /api/mp/webhook
        → verifica firma (MP_WEBHOOK_SECRET)
        → actualiza Booking: status: CONFIRMED, mpPaymentId, mpStatus
        → revalida paths
      → MP redirige a /[slug]?reservado=true (success_url)
```

### Archivos a crear

```
src/app/api/mp/webhook/route.ts     ← recibe notificación de pago
src/app/[slug]/pagar/page.tsx       ← página intermedia que crea la Preference
src/actions/pagos.ts                ← crearPreferencia(bookingId)
```

### Variables de entorno a agregar

```env
MP_ACCESS_TOKEN="APP_USR-..."    # token privado (solo server)
MP_PUBLIC_KEY="APP_USR-..."      # token público (puede ir al cliente)
MP_WEBHOOK_SECRET="..."          # para verificar firma del webhook
```

### SDK a instalar

```bash
npm install mercadopago
```

### Consideración importante
MP Checkout puede fallar o el usuario puede cerrar el navegador. La reserva queda en `PENDING` sin pagar. Necesitás un job o cron que expire bookings PENDING después de X minutos sin pago (`status: "EXPIRED"` o simplemente `CANCELLED`).

---

## Rutas del proyecto

```
/                              → redirección o landing general
/login                         → login admin / cliente
/register                      → registro
/{slug}                        → landing pública del complejo
/{slug}/reservar               → grilla completa de reservas
/{slug}/canchas/{id}/reservar  → reservar cancha específica
/dashboard                     → redirección al dashboard del tenant
/dashboard/{slug}              → panel admin principal
/dashboard/{slug}/reservas     → gestión de reservas
/dashboard/{slug}/ingresos     → analytics de ingresos
/dashboard/{slug}/ocupacion    → analytics de ocupación
/dashboard/{slug}/canchas/nueva
/dashboard/{slug}/canchas/{id}/editar
/dashboard/{slug}/canchas/{id}/horarios
```
