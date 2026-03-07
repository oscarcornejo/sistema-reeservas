# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TurnoPro — a SaaS appointment/booking management platform for service businesses (barberías, spas, clínicas). Built for the Latin American market (Chile/Mexico). All UI text, comments, and error messages are in **Spanish**.

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # ESLint
npm run seed       # Seed MongoDB with test data
```

> **Note:** `package.json` currently only lists `next`, `react`, `react-dom` as dependencies. All other packages (mongoose, next-auth, zod, zustand, etc.) are installed in `node_modules` / `package-lock.json` but **not yet added to package.json**. Run `npm install --legacy-peer-deps` to restore from the lock file.

> **Note:** Testing infrastructure (Jest 30, @testing-library/react) is installed but **not yet configured** — no `jest.config`, no test files, and no `npm test` script exist yet.

## Tech Stack

- **Next.js 16** (App Router, RSC) + **React 19** + **TypeScript** (strict mode)
- **MongoDB** via **Mongoose 9** (singleton connection pattern)
- **next-auth v5** (beta) — JWT sessions, CredentialsProvider, role-based access
- **Tailwind CSS v4** with OKLCH color variables + **shadcn/ui** (new-york style, Radix primitives)
- **Zod v4** for validation, **react-hook-form v7** for forms
- **Zustand v5** for client state (stores in `src/lib/store/`)
- **MercadoPago** for payments, **Cloudinary** for images, **Nodemailer** for email
- **Leaflet + react-leaflet** for maps, **date-fns** with Spanish locale

## Architecture

### Path Alias
`@/*` maps to `./src/*`

### Route Groups & Layouts
- `(auth)/` — public auth pages (login, registro) with branded 2-column layout
- `(dashboard)/` — protected pages with role-aware sidebar layout
  - `/admin/*` — business admin (requires `admin` role) — dashboard, calendario, clientes, servicios, profesionales, reportes, configuracion, negocios
  - `/profesional/*` — professional (requires `professional` role) — dashboard + calendario
  - `/cliente/*` — client (requires `client` role) — dashboard + mis-citas
- `/buscar` — public search page — currently uses **hardcoded sample data**, not connected to DB
- `/negocio/[slug]` — public business profile — fully connected to cached DB queries + booking dialog
- `/perfil` — shared profile edit page (all roles)

### Auth Flow
1. Middleware (`src/middleware.ts`) imports from `src/lib/auth/auth.config.ts` (edge-compatible, no Node.js deps)
2. Full auth config with Credentials provider lives in `src/lib/auth/auth.ts` (Node.js runtime only — bcrypt)
3. Auth.js `authorized` callback enforces role-based route access and redirects by role
4. DAL helpers (`src/lib/auth/dal.ts`) provide `requireAuth()`, `requireRole()`, `requireAdmin()`, `getUserBusiness()`, etc. for Server Actions
5. API route at `src/app/api/auth/[...nextauth]/route.ts` exports `{ GET, POST }` handlers

### API Routes
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js handlers
- `src/app/api/webhooks/mercadopago/route.ts` — MercadoPago payment webhook
- `src/app/api/cron/send-reminders/route.ts` — Cron job for appointment reminder notifications

### Server Actions Pattern (`src/actions/`)
All server actions follow this pattern:
1. Verify auth/role via DAL helpers
2. Validate `FormData` with Zod schemas from `src/lib/validators/schemas.ts`
3. Call `connectDB()` then Mongoose operations
4. Return `ActionResult<T>` — `{ success: boolean; data?: T; error?: string }`

Action files: `auth.ts`, `appointments.ts`, `services.ts`, `service-categories.ts`, `business.ts`, `businesses.ts`, `professionals.ts`, `profile.ts`, `public-booking.ts`, `reports.ts`, `notifications.ts`, `schedule-blocks.ts`

### Cached Data Queries
- Cached data queries live in `src/lib/data/queries.ts` — use `'use cache'` + `cacheLife()` + `cacheTag()`
- `'use cache'` **cannot** coexist with `'use server'` in the same file and cannot access `cookies()`/`headers()`
- Cached functions receive IDs as parameters (not auth context); caller resolves auth first
- Non-deterministic values like `new Date()` require a client component wrapped in `<Suspense>` (see `CopyrightYear` pattern)
- `cacheComponents: true` enabled in `next.config.ts` (Partial Prerendering)

### Data Layer
- DB connection in `src/lib/db/connection.ts` — singleton via `globalThis.mongooseCache`, `maxPoolSize: 10`
- Models in `src/lib/db/models/`: `user`, `business`, `professional`, `client`, `service`, `service-category`, `appointment`, `subscription`, `notification`, `schedule-block`
- All models use singleton pattern (`mongoose.models.X || mongoose.model(...)`)
- All models have `toJSON` transform: `_id` → `id`, strips `__v`/`password`/`mfaSecret`
- All read queries use `.lean()` for performance
- Central re-export from `src/lib/db/models/index.ts`

### Types & Validation
- All domain interfaces and enums in `src/types/index.ts`
- Zod schemas in `src/lib/validators/schemas.ts` — inferred types exported as `*Input`
- Schemas are shared between client (form validation) and server (action validation)

### Utilities
- `cn()` from `@/lib/utils` — className merging (clsx + tailwind-merge)
- `serialize()` from `@/lib/utils` — deep-serializes Mongoose docs for RSC (ObjectId → string, Date → ISO)
- `@/lib/utils/format.ts` — `formatCurrency()`, `formatDate()`, `formatTime()`, `formatRelativeDate()`, `DAYS_OF_WEEK`, `BUSINESS_CATEGORIES`, `APPOINTMENT_STATUS_CONFIG`

### Email & Notifications
- `src/lib/email/` — Nodemailer singleton (`transporter.ts`), `sendEmail()` wrapper, HTML templates
- `src/lib/notifications/booking-notifications.ts` — sends both email + in-app notification on booking

### Client State (Zustand)
- `src/lib/store/index.ts` — 4 stores: `useUserStore`, `useAppointmentStore`, `useSearchStore`, `useNotificationStore`

### UI Components
- shadcn/ui components in `src/components/ui/` — add new ones via `npx shadcn@latest add <component>` (style: `new-york`, icon library: `lucide`)
- Custom layout components in `src/components/layout/` (`Sidebar`, `TopNavbar`, `PublicNavbar`, `ThemeToggle`, `NotificationBell`)
- Booking components in `src/components/booking/` (`BookingDialog`, `BookingWrapper`, `AppointmentDetailDialog`, `RescheduleDialog`, `CancelDialog`, `ScheduleBlockDialog`, `UnblockDialog`)
- Business theme system: `src/lib/themes.ts` defines per-business color themes, `src/components/ThemeInjector.tsx` applies them as CSS custom properties on public `/negocio/[slug]` pages
- Gallery components in `src/components/gallery/` for business image galleries

### Error Boundaries
- `src/app/global-error.tsx` — root error boundary (includes `<html>`/`<body>`)
- `src/app/error.tsx` — app-level error boundary
- `src/app/not-found.tsx` — custom 404
- `src/app/(dashboard)/error.tsx` — dashboard-scoped error boundary

## Code Conventions

- All user-facing text, comments, JSDoc (`@fileoverview`), and error messages must be in **Spanish**
- Server files: `'use server'` directive at top
- Client components: `'use client'` directive at top
- Cached queries: `'use cache'` directive inside function body (in `src/lib/data/queries.ts`)
- Use `import type` for server-only packages (e.g., `import type { Types } from 'mongoose'`) in shared type files
- Use `Promise.all` for independent parallel queries — avoid sequential data waterfalls
- Server Actions must verify both authentication AND authorization (ownership checks)
- `.npmrc` has `legacy-peer-deps=true` — always use `npm install --legacy-peer-deps`
- Mongoose `.lean()` results must be passed through `serialize()` before returning to RSC/client components

## Environment Variables

Required for dev:
- `MONGODB_URI` — MongoDB connection string (throws at module load if missing)
- `AUTH_SECRET` — Next-Auth JWT signing secret
- `AUTH_URL` / `NEXTAUTH_URL` — Base URL for auth redirects
- `NEXT_PUBLIC_APP_URL` — Public base URL (client-accessible)
- `NEXT_PUBLIC_APP_NAME` — App name (client-accessible)

Optional (features degrade gracefully):
- `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` — payments
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — image uploads
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` — email

A `.env.local` with dev credentials exists in the repo.

## Security Headers

`next.config.ts` defines a strict Content-Security-Policy and other security headers. When adding new external resources (scripts, images, fonts, API endpoints), update the CSP directives in `next.config.ts` — otherwise they'll be blocked by the browser. Current allowed origins include `cdn.jsdelivr.net`, `sdk.mercadopago.com`, `*.cloudinary.com`, `images.unsplash.com`, `tile.openstreetmap.org`, `api.mercadopago.com`.

## Seed Data

The seed (`npx tsx scripts/seed.ts`) creates 2 businesses, 7 users, 8 services, 3 professionals, 3 clients, 11 appointments (all 6 statuses), and 2 subscriptions. It imports real models from `src/lib/db/models/` — no inline schemas. Includes a production environment guard.

All passwords: `Password123`
- Admin (Barberia): `admin@turnopro.cl`
- Admin (Spa): `ana@serenityspa.cl`
- Professionals: `pedro@turnopro.cl`, `laura@turnopro.cl`, `camila@serenityspa.cl`
- Clients: `maria@cliente.cl`, `juan@cliente.cl`
