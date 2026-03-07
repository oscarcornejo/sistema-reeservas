# Diseño: Acciones en tabla de clientes

**Fecha:** 2026-03-06
**Estado:** Aprobado
**Enfoque:** Dropdown de acciones + Diálogos inline

## Problema

Las tablas de clientes (admin y profesional) son solo lectura. No hay forma de ver el detalle de un cliente, editar sus datos, gestionar sus citas, ni eliminarlo.

## Solución

Agregar una columna "Acciones" con `DropdownMenu` por fila. Cada opción abre un diálogo específico. Se reutilizan los `RescheduleDialog` y `CancelDialog` existentes para las citas.

## Acciones por rol

| Acción | Icono | Admin | Profesional |
|--------|-------|-------|-------------|
| Ver detalle | `Eye` | Si | Si |
| Editar cliente | `Pencil` | Si | No |
| Eliminar cliente | `Trash2` | Si | No |

## Diálogos

### ClientDetailDialog

Muestra datos del cliente y sus citas recientes:

- **Cabecera:** Avatar, nombre, email, teléfono, tags, source, notas
- **Tabla de citas:** Últimas 10 citas con columnas: Fecha, Servicio, Profesional, Estado
- **Acciones por cita:** Citas en estado modificable (`pending`, `confirmed`) muestran botones Reagendar / Cancelar que abren `RescheduleDialog` y `CancelDialog` existentes
- **Props:** `open`, `onOpenChange`, `clientId`, `userRole`
- **Carga lazy:** Llama a `getClientDetail(clientId)` al abrirse

### EditClientDialog (solo admin)

Formulario para editar datos del cliente:

- Campos: nombre, teléfono, notas, tags (input con badges removibles)
- Llama a `updateClient(formData)`
- **Props:** `open`, `onOpenChange`, `client` (datos actuales), `onSuccess`

### DeleteClientDialog (solo admin)

Confirmación de eliminación:

- Advertencia: "Se eliminará el cliente y su historial. Las citas existentes no se eliminan."
- Llama a `deleteClient(formData)`
- **Props:** `open`, `onOpenChange`, `client`, `onSuccess`

## Backend — Server Actions

Archivo nuevo: `src/actions/clients.ts`

### getClientDetail(clientId)

- Verifica auth (admin o profesional)
- Admin: verifica que el cliente pertenece a su negocio
- Profesional: verifica que ha atendido al cliente (tiene citas con él)
- Consulta: `Client.findById` + `Appointment.find({ clientId }).populate('serviceId professionalId').sort({ date: -1 }).limit(10)`
- Retorna: `ActionResult<{ client, appointments }>`

### updateClient(formData)

- Solo admin
- Valida con `updateClientSchema`
- Verifica ownership (cliente.businessId === admin.businessId)
- Actualiza campos permitidos
- Invalida cache

### deleteClient(formData)

- Solo admin
- Valida con `deleteClientSchema`
- Verifica ownership
- Hard delete del documento `Client` (citas quedan como historial)
- Invalida cache

## Validación (Zod)

```ts
const updateClientSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(2).max(100),
    phone: z.string().min(8).max(20),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
});

const deleteClientSchema = z.object({
    clientId: z.string().min(1),
});
```

## Cache invalidation

Al editar o eliminar cliente:

- `updateTag('clients')` — lista admin
- `updateTag('professional-clients')` — lista profesional

## Flujo de datos

```
page.tsx (Server) → clients-table.tsx (Client)
                         ↓ dropdown click
                    ClientDetailDialog ← getClientDetail(id)
                         ↓ botón reagendar cita
                    RescheduleDialog (existente)
                         ↓ botón cancelar cita
                    CancelDialog (existente)
```

## Impacto en archivos

| Archivo | Cambio |
|---------|--------|
| `src/actions/clients.ts` | Nuevo — 3 server actions |
| `src/lib/validators/schemas.ts` | Agregar `updateClientSchema`, `deleteClientSchema` |
| `src/components/clients/ClientDetailDialog.tsx` | Nuevo — diálogo de detalle con citas |
| `src/components/clients/EditClientDialog.tsx` | Nuevo — formulario de edición |
| `src/components/clients/DeleteClientDialog.tsx` | Nuevo — confirmación de eliminación |
| `src/app/(dashboard)/admin/clientes/clients-table.tsx` | Agregar columna Acciones con dropdown (ver, editar, eliminar) |
| `src/app/(dashboard)/profesional/clientes/clients-table.tsx` | Agregar columna Acciones con dropdown (solo ver) |
