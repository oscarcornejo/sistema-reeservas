# Diseño: Gestión de Citas en Calendario por Rol

**Fecha:** 2026-02-28
**Estado:** Aprobado

## Resumen

Implementar gestión completa de citas (agendar, reagendar, anular) en el calendario con permisos diferenciados por rol (admin, professional, client) y notificaciones a todos los involucrados.

## Decisiones de Diseño

- **Rutas dedicadas por rol**: `/admin/calendario`, `/profesional/calendario`, `/cliente/mis-citas`
- **Reagendamiento**: Dialog con selector de fecha/hora (sin drag & drop)
- **Cancelación**: Motivo obligatorio para todos los roles (min 10 caracteres)
- **Arquitectura**: Componentes compartidos + páginas dedicadas por rol (Enfoque A)

## Permisos por Rol

| Acción | Admin | Professional | Client |
|--------|-------|-------------|--------|
| Agendar | Cualquier profesional/cliente | Solo en su agenda | Solo para sí mismo |
| Reagendar | Cualquier cita del negocio | Solo sus citas asignadas | Solo citas que creó |
| Anular | Cualquier cita del negocio | Solo sus citas asignadas | Solo citas que creó |

## Server Actions

### `rescheduleAppointment(appointmentId, newDate, newStartTime)`
- Verifica permisos según rol del actor
- Valida disponibilidad del profesional en nuevo horario
- Actualiza date, startTime, endTime (recalculado por duración)
- Dispara `sendRescheduleNotifications()` fire-and-forget
- Invalida cache: `revalidateTag('dashboard-metrics')`

### `cancelAppointment(appointmentId, cancellationReason)`
- Verifica permisos según rol del actor
- `cancellationReason` obligatorio, validado con Zod (min 10 chars)
- Cambia status a `cancelled`, guarda motivo
- Dispara `sendCancellationNotifications()` fire-and-forget
- Invalida cache: `revalidateTag('dashboard-metrics')`

### `createAppointmentByRole(formData)`
- Extiende `createAppointment` actual con verificación de rol
- Admin: cualquier profesional/cliente del negocio
- Professional: solo su propia agenda
- Client: solo para sí mismo
- Dispara `sendBookingNotifications()` existente

### Nuevos Zod Schemas
- `rescheduleAppointmentSchema`: `{ appointmentId, date, startTime }`
- `cancelAppointmentSchema`: `{ appointmentId, cancellationReason (min 10 chars) }`

## Componentes UI

### `AppointmentDetailDialog` (`src/components/booking/`)
- Muestra detalle completo: servicio, profesional, cliente, fecha/hora, estado, notas
- Botones de acción según permisos: "Reagendar" / "Anular"
- Se abre al click en cita desde cualquier vista

### `RescheduleDialog` (`src/components/booking/`)
- Selector de fecha + selector de horarios disponibles
- Consulta `getAvailableSlots()` al cambiar fecha
- Muestra comparación: fecha actual → fecha nueva
- Confirmación antes de ejecutar

### `CancelDialog` (`src/components/booking/`)
- Resumen de la cita + TextArea obligatorio para motivo
- Estado visual de advertencia (destructive)
- Confirmación antes de ejecutar

## Páginas

### `/admin/calendario` (modificar existente)
- Mantiene vistas timeline/semana/mes
- Click en cita → `AppointmentDetailDialog` con permisos completos
- Quick Book existente se mantiene

### `/profesional/calendario` (nueva)
- Timeline de "Mi Agenda" (solo el profesional autenticado)
- Vistas día/semana/mes filtradas
- Click en cita → `AppointmentDetailDialog` con permisos limitados
- Puede crear citas en su agenda

### `/cliente/mis-citas` (nueva)
- Vista lista/cards (no timeline)
- Pestañas: "Próximas" / "Pasadas"
- Cards con: servicio, profesional, fecha/hora, estado
- Botones reagendar/anular solo en citas futuras pendientes/confirmadas

## Notificaciones

### Flujo por acción

| Acción | Admin | Profesional | Cliente |
|--------|-------|-------------|---------|
| Agendar | In-app | In-app + Email | In-app + Email |
| Reagendar | In-app | In-app + Email | In-app + Email |
| Anular | In-app | In-app + Email | In-app + Email |

- El actor NO recibe su propia notificación
- Fire-and-forget (no bloquean respuesta)

### Nuevas funciones en `booking-notifications.ts`
- `sendRescheduleNotifications({ appointmentId, actorId, actorRole, oldDate, oldStartTime, newDate, newStartTime })`
- `sendCancellationNotifications({ appointmentId, actorId, actorRole, cancellationReason })`

### Nuevo tipo de notificación
- `'booking-rescheduled'` se agrega a `NotificationType`

### Cache Invalidation
- Post crear/reagendar/anular → `revalidateTag('dashboard-metrics')`
