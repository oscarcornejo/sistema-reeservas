# TurnoPro — UI Overhaul Design

**Fecha:** 2026-02-20
**Enfoque:** Design System First
**Estilo:** Minimal premium (Linear/Vercel/Stripe)
**Alcance:** Toda la plataforma — ~28 vistas, light + dark mode

---

## 1. Fundacion — Design System

### Paleta OKLCH (light + dark)

Se reescribe `globals.css` con tokens semanticos usando OKLCH. Base zinc neutra, primary violeta profundo, accent azul frio.

| Token | Light | Dark |
|-------|-------|------|
| background | zinc-50 (#fafafa) | zinc-950 (#09090b) |
| foreground | zinc-900 (#18181b) | zinc-50 (#fafafa) |
| card | white | #0a0a0a |
| card-foreground | zinc-900 | zinc-50 |
| muted | zinc-100 (#f4f4f5) | #1a1a1e |
| muted-foreground | zinc-500 | zinc-400 |
| primary | oklch(0.55 0.22 280) | oklch(0.70 0.18 280) |
| primary-foreground | white | zinc-950 |
| accent | oklch(0.65 0.15 250) | oklch(0.55 0.12 250) |
| accent-foreground | white | zinc-50 |
| destructive | oklch(0.55 0.22 27) | oklch(0.65 0.20 27) |
| border | oklch(0.92 0.004 286) | oklch(0.22 0.006 286) |
| ring | primary | primary |
| sidebar | white | #0c0c0e |
| sidebar-foreground | zinc-700 | zinc-300 |
| sidebar-primary | primary | primary (lighter) |
| sidebar-border | zinc-200 | zinc-800 |
| sidebar-accent | zinc-100 | zinc-800/50 |

### Tipografia

- Geist Sans (ya configurada) — sin cambios
- Headings: tracking -0.025em para look premium
- Body: text-sm (14px) como base en dashboard, text-base (16px) en publicas

### Animaciones (@keyframes en globals.css)

- `fadeIn` — opacidad 0→1, translate-y sutil (8px→0)
- `slideUp` — translate-y mas pronunciado (16px→0)
- `pulse-dot` — escala 1→1.3→1 con opacidad
- Clases utilitarias: `animate-fade-in`, `animate-slide-up`

### Espaciado y bordes

- Cards: border-radius 0.75rem
- Inputs: border-radius 0.5rem
- Modals/Dialogs: border-radius 1rem
- Sombras hover: 3 niveles con tinte primary

---

## 2. Root Layout

- `lang="en"` → `lang="es"`
- Metadata: titulo "TurnoPro — Gestion de citas profesional"
- Agregar ThemeProvider (next-themes) para toggle light/dark
- Toaster de sonner a nivel raiz
- Mantener Geist Sans/Mono font variables

---

## 3. Paginas Publicas

### Landing (`/`)
- Mantener estructura: Hero, HowItWorks, Categories, Benefits, CTA, Footer
- Refinar gradientes con tokens OKLCH
- Normalizar animaciones CSS con @keyframes de globals
- Dark mode en blobs decorativos y fondos
- Footer reutilizable (extraer si se necesita)

### Busqueda (`/buscar`)
- Mantener funcionalidad existente (sample data, filtros, resultados)
- Refinar tarjetas con nueva paleta
- Mejorar empty state
- Dark mode en hero section y cards

### Perfil negocio (`/negocio/[slug]`)
- Ya conectado a DB — no tocar logica
- Refinar tokens/colores en BookingWrapper y BookingDialog
- Dark mode

---

## 4. Auth Pages

### Login (`/login`) + Registro (`/registro`)
- Mantener layout 2-columnas del auth layout
- Refinar panel branding izquierdo con tokens nuevos
- Dark mode en ambos paneles
- Inputs y botones heredan de globals automaticamente

---

## 5. Dashboard Admin (8 paginas)

### Dashboard principal (`/admin`)
- Mantener: greeting, 4 metric cards, OccupancyRing, quick links
- Refinar colores metric cards con tokens OKLCH
- Dark mode en gradientes decorativos
- OccupancyRing SVG con colores del sistema

### Calendario (`/admin/calendario`)
- Mantener: week view, Calendar widget, timeline 8am-8pm
- Refinar colores de status badges y slots
- Dark mode

### Clientes (`/admin/clientes`)
- Mantener: stat cards, search, table con avatars
- Refinar tabla y badges con nueva paleta
- Dark mode

### Servicios (`/admin/servicios`)
- Mantener: CRUD completo con dialog form
- Refinar stat cards y tabla
- Dark mode

### Profesionales (`/admin/profesionales`)
- Mantener: grid de cards con avatar, specialties, rating
- Refinar colores de acento por card
- Dark mode

### Reportes (`/admin/reportes`)
- Mantener: date range, tabs, tables, CSV export
- Refinar progress bars y color coding
- Dark mode

### Configuracion (`/admin/configuracion`)
- Mantener: 5 tabs funcionales
- Refinar formularios y switches
- Dark mode

### Negocios (`/admin/negocios`)
- Mantener: table con CRUD y cascade delete
- Refinar stat cards y tabla
- Dark mode

---

## 6. Stubs → Paginas Mejoradas

### Profesional Dashboard (`/profesional`)
Estado actual: 4 metric cards con "0", empty state basico.

Rediseno:
- Greeting personalizado (mismo patron que admin: saludo + fecha + nombre)
- 4 metric cards con gradientes colored-top-bar y iconos (patron admin)
- Seccion "Citas de hoy" con empty state refinado (icono grande + gradiente sutil)
- Accesos rapidos a calendario y clientes (patron quick-links del admin)
- Todo con animaciones fadeIn escalonadas

### Cliente Dashboard (`/cliente`)
Estado actual: 3 quick-action cards centrados, empty state.

Rediseno:
- Hero compacto con saludo y CTA prominente "Nueva reserva"
- 3 quick-action cards mejoradas (patron de las cards del admin con iconos coloreados, border-top gradient, hover effects)
- Seccion "Proximas citas" con empty state refinado
- Animaciones fadeIn escalonadas

---

## 7. Error Pages + 404

### 404 (`/not-found`)
- Icono grande con gradiente sutil de fondo
- Texto con tipografia premium
- Boton "Volver al inicio" con estilo del sistema
- Dark mode

### Error (`/error`, `/global-error`, `/(dashboard)/error`)
- Misma mejora de estilo
- Icono destructive con fondo gradiente sutil
- Dark mode

---

## 8. Componentes Layout

### Sidebar
- Tokens sidebar-* del nuevo sistema
- Dark mode nativo
- Transiciones mas suaves en hover/active
- Mantener Sheet mobile + desktop aside

### TopNavbar
- Dark mode
- Glass morphism con backdrop-blur refinado

### PublicNavbar
- Consistente con nueva paleta
- Dark mode
- Glass morphism

---

## Principios de implementacion

1. **No romper funcionalidad** — Solo cambios visuales/CSS, no logica
2. **globals.css primero** — Todo lo demas hereda
3. **Progresivo** — Cada pagina se mejora sin depender de las otras
4. **Dark mode nativo** — Via CSS variables, no clases condicionales en cada componente
5. **Mantener server components** — No convertir RSCs a client components por temas de UI
