# Diseño: Reportes del profesional

**Fecha:** 2026-03-06
**Estado:** Aprobado
**Enfoque:** Metricas con tarjetas + tabla de citas

## Problema

El profesional no tiene una seccion de reportes. No puede ver sus metricas de rendimiento: clientes atendidos, citas mensuales, ingresos concretados ni su calificacion.

## Solucion

Pagina `/profesional/reportes` con 4 tarjetas de metricas, filtro por rango de fechas, y tabla de citas del periodo. Sin restriccion de plan — todo profesional tiene acceso.

## Metricas (4 tarjetas)

| Tarjeta | Calculo | Icono |
|---------|---------|-------|
| Clientes atendidos | Clientes unicos del periodo (citas no canceladas) | `Users` |
| Citas del periodo | Total citas no canceladas | `CalendarDays` |
| Ingresos concretados | Suma de `paymentAmount` donde `paymentStatus === 'paid'` | `DollarSign` |
| Calificacion | `professional.rating` + `totalReviews` | `Star` |

## Filtro de fechas

- Rango por defecto: mes actual (primer dia del mes hasta hoy)
- Dos inputs `type="date"` para rango personalizado
- Se pasan como `searchParams` en la URL para que el Server Component re-fetche

## Tabla de citas

Columnas: Fecha, Servicio, Cliente, Monto, Estado pago

- Estado pago como Badge: `paid` = verde, `pending` = amarillo, `refunded` = rojo
- Ordenado por fecha descendente
- Empty state cuando no hay citas

## Arquitectura

```
page.tsx (Server Component)
  -> getUserProfessionalProfile() (auth + professionalId)
  -> getCachedProfessionalReport(professionalId, startDate, endDate)
  -> <Suspense fallback={<Skeleton />}>
       <ProfessionalReportsClient data={...} />
     </Suspense>
```

### Query cacheada

```ts
getCachedProfessionalReport(professionalId: string, startDate: string, endDate: string)
```

- Consulta: `Appointment.find({ professionalId, date: { $gte: start, $lte: end }, status: { $nin: ['cancelled'] } })`
- Populate: `serviceId` (name, price), `clientId` (name)
- Calcula metricas server-side: uniqueClients, totalAppointments, totalRevenue
- Cache: `cacheLife('minutes')`, tags: `professional-reports`, `professional-${id}`

### Client Component

- Recibe metricas + lista de citas
- Maneja filtro de fechas con `useRouter().push()` para actualizar searchParams
- Renderiza tarjetas + tabla

## Sidebar

Agregar enlace en `NAV_CONFIG['professional']`:

```ts
{ label: "Reportes", href: "/profesional/reportes", icon: BarChart3 }
```

## Impacto en archivos

| Archivo | Cambio |
|---------|--------|
| `src/lib/data/queries.ts` | Agregar `getCachedProfessionalReport()` |
| `src/app/(dashboard)/profesional/reportes/page.tsx` | Nuevo — Server Component |
| `src/app/(dashboard)/profesional/reportes/reports-client.tsx` | Nuevo — Client Component |
| `src/components/layout/Sidebar.tsx` | Agregar enlace "Reportes" al menu profesional |
