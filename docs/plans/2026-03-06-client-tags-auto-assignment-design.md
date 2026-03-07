# Diseño: Asignación automática de tags de cliente

**Fecha:** 2026-03-06
**Estado:** Aprobado

## Problema

Los tags de segmentación del cliente (`Client.tags[]`) solo se asignan manualmente por el admin o con el valor `"Nuevo"` al momento de la creación. No existe lógica que actualice los tags automáticamente según el comportamiento del cliente, por lo que un cliente con 20 visitas puede seguir marcado como "Nuevo".

## Reglas de asignación automática

Los tags se recalculan cada vez que una cita se marca como `completed`.

| Condición | Tag asignado | Reemplaza |
|-----------|-------------|-----------|
| `totalVisits <= 2` | `Nuevo` | — |
| `totalVisits >= 3` | `Frecuente` | `Nuevo` |
| `totalVisits >= 10` | `VIP` | `Frecuente` |

### Comportamiento

- Los tags automáticos (`Nuevo`, `Frecuente`, `VIP`) son **mutuamente excluyentes** — un cliente solo tiene uno de estos a la vez.
- Los tags manuales asignados por el admin (ej. `Ortodoncia`, `Alérgico`) se **preservan** y coexisten con el tag automático.
- El admin puede sobrescribir el tag automático manualmente desde la gestión de clientes. Si lo hace, la lógica automática no vuelve a pisar el tag manual hasta que el cliente suba de nivel (ej. si el admin quita `VIP`, al completar la siguiente cita se re-evalúa).

### Ejemplo de evolución

```
Cita 1 completada → tags: ['Nuevo']
Cita 2 completada → tags: ['Nuevo']
Cita 3 completada → tags: ['Frecuente']           (reemplaza 'Nuevo')
Admin agrega 'Ortodoncia' → tags: ['Frecuente', 'Ortodoncia']
Cita 10 completada → tags: ['VIP', 'Ortodoncia']  (reemplaza 'Frecuente', preserva 'Ortodoncia')
```

## Punto de ejecución

La lógica se ejecuta en el **Server Action que cambia el status de una cita a `completed`** (`src/actions/appointments.ts`). Pasos:

1. Actualizar `Appointment.status` a `completed`
2. Incrementar `Client.totalVisits` y actualizar `Client.lastVisit`
3. Recalcular tag automático basado en el nuevo `totalVisits`
4. Actualizar `Client.tags[]`: remover tags automáticos anteriores, agregar el nuevo, preservar tags manuales

## Tags automáticos vs manuales

Para distinguirlos, se define una constante con los tags gestionados automáticamente:

```ts
const AUTO_TAGS = ['Nuevo', 'Frecuente', 'VIP'] as const;
```

Al recalcular, se filtran los tags existentes removiendo cualquier `AUTO_TAG` y se agrega el que corresponda por regla.

## Impacto en código existente

| Archivo | Cambio |
|---------|--------|
| `src/actions/appointments.ts` | Agregar lógica de recálculo de tags al completar cita |
| `src/actions/public-booking.ts` | Ya asigna `tags: ['Nuevo']` en `$setOnInsert` (sin cambios) |
| `src/lib/utils/format.ts` | Opcional: exportar `AUTO_TAGS` como constante compartida |

## Cache invalidation

Al actualizar tags del cliente:
- `updateTag('clients')` — lista de clientes del admin
- `updateTag('professional-clients')` — lista de clientes del profesional
