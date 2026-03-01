# Recordatorios automáticos de citas

## Descripción

Sistema de recordatorios que envía notificaciones por email a los clientes **24 horas antes** de su cita agendada. Reduce inasistencias al mantener al cliente informado.

Para negocios con plan **enterprise**, también se crea una notificación in-app para el profesional asignado (visible en el `NotificationBell` del dashboard).

---

## Arquitectura

```
vercel.json (cron diario 12:00 UTC)
  │
  ▼
GET /api/cron/send-reminders/route.ts
  │  ← Protegido por CRON_SECRET en producción
  │  ← Abierto en desarrollo (sin auth)
  │
  ├── connectDB()
  ├── Query: citas de mañana (pending/confirmed) sin remindersSent.type='email'
  │     └── .populate('clientId professionalId serviceId businessId')
  │
  ▼
sendAppointmentReminder() — reminder-notifications.ts
  │
  ├── 1. Email al cliente (appointmentReminderTemplate)
  ├── 2. Notificación in-app al profesional (solo enterprise)
  └── 3. Registro en appointment.remindersSent[]
```

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/app/api/cron/send-reminders/route.ts` | Endpoint cron — orquesta la búsqueda y envío |
| `src/lib/notifications/reminder-notifications.ts` | Lógica de envío de email + notificación in-app |
| `src/lib/email/templates.ts` | `appointmentReminderTemplate()` — HTML del email |
| `src/lib/db/models/appointment.ts` | Schema `remindersSent[]` + índice compuesto |
| `src/lib/db/models/notification.ts` | Tipo `'booking-reminder'` para notificaciones in-app |
| `vercel.json` | Configuración del cron job en Vercel |

## Flujo detallado

### 1. Trigger (Vercel Cron)

`vercel.json` configura un cron que ejecuta `GET /api/cron/send-reminders` todos los días a las **12:00 UTC**:
- 9:00 AM en Chile (UTC-3)
- 7:00 AM en México (UTC-5)

### 2. Endpoint cron (`route.ts`)

1. **Autenticación**: Verifica `Authorization: Bearer {CRON_SECRET}`. En desarrollo (sin `CRON_SECRET` definido), permite acceso libre.
2. **Conexión a DB**: `connectDB()`.
3. **Query**: Busca citas que cumplan TODAS estas condiciones:
   - `status` es `pending` o `confirmed`
   - `date` cae en el día de mañana (UTC)
   - No tienen un registro `remindersSent` con `type: 'email'` (evita duplicados)
4. **Populate**: Carga `clientId`, `professionalId`, `serviceId`, `businessId` con los campos necesarios.
5. **Iteración**: Llama `sendAppointmentReminder()` por cada cita.
6. **Respuesta JSON**: `{ processed, sent, failed }`.

### 3. Orquestador (`reminder-notifications.ts`)

Para cada cita:

1. **Email al cliente**: Genera HTML con `appointmentReminderTemplate()` y envía vía `sendEmail()`. Incluye: nombre del negocio, servicio, profesional, fecha, hora, duración y precio.
2. **Notificación in-app** (solo plan enterprise): Crea un documento `Notification` tipo `'booking-reminder'` para el profesional, visible en el `NotificationBell` del dashboard.
3. **Registro de envío**: Hace `$push` en `appointment.remindersSent` con `{ type: 'email', sentAt, status: 'sent'|'failed' }`.

Toda la función está envuelta en try/catch — **nunca lanza errores**. Si falla el email, registra `status: 'failed'` y retorna `{ sent: false }`.

### 4. Idempotencia

El query excluye citas que ya tienen `remindersSent.type: 'email'`. Esto garantiza que ejecutar el cron múltiples veces en el mismo día **no envía duplicados**.

El modelo `Appointment` tiene un índice compuesto optimizado para esta consulta:
```
{ status: 1, date: 1, 'remindersSent.type': 1 }
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `CRON_SECRET` | Solo producción | Token Bearer para autenticar la invocación del cron. Vercel lo envía automáticamente. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Para envío real | Credenciales SMTP. Sin ellas el email falla silenciosamente. |
| `EMAIL_FROM` | Opcional | Remitente del email. Default: `TurnoPro <noreply@turnopro.cl>` |

---

## Cómo probar

### Prueba rápida con curl (desarrollo)

```bash
# 1. Levantar el servidor de desarrollo
npm run dev

# 2. En otra terminal, invocar el endpoint
curl -s http://localhost:3000/api/cron/send-reminders | python3 -m json.tool
```

**Resultado esperado** (si hay citas para mañana en la DB):
```json
{
    "processed": 1,
    "sent": 1,
    "failed": 0
}
```

**Resultado si no hay citas para mañana**:
```json
{
    "processed": 0,
    "sent": 0,
    "failed": 0
}
```

### Verificar idempotencia

Ejecutar el curl **dos veces seguidas**. La segunda vez debe retornar `processed: 0` porque la cita ya fue marcada con el recordatorio.

### Verificar registro en MongoDB

```bash
mongosh "$MONGODB_URI" --eval "db.appointments.find({'remindersSent.0': {\$exists: true}}, {remindersSent: 1, date: 1, startTime: 1}).pretty()"
```

Debe mostrar el array `remindersSent` con el log del envío:
```json
{
    "remindersSent": [
        {
            "type": "email",
            "sentAt": "2026-03-01T...",
            "status": "sent"
        }
    ]
}
```

### Crear datos de prueba manualmente

Si el seed no tiene citas para mañana:

1. Iniciar sesión como admin (`admin@turnopro.cl` / `Password123`)
2. Crear una cita para **mañana** desde el calendario
3. Ejecutar el curl

### Simular producción (con CRON_SECRET)

```bash
# Definir un secret temporal
export CRON_SECRET=test-secret-123

# Reiniciar el dev server para que tome la variable
npm run dev

# Sin auth → 401
curl -s http://localhost:3000/api/cron/send-reminders
# {"error":"No autorizado"}

# Con auth → funciona
curl -s -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/cron/send-reminders
# {"processed":0,"sent":0,"failed":0}
```

### Verificar el email (si hay SMTP configurado)

Con las variables `SMTP_*` configuradas en `.env.local`, el email se envía al correo del cliente. Buscar en la consola del dev server el log:
```
📧 Email enviado a maria@cliente.cl: "Recordatorio de cita — Barbería Don Pedro"
```

Sin SMTP configurado, aparecerá un error en consola pero el flujo no se interrumpe.

---

## Consideraciones

- **Zona horaria**: El cron usa UTC. "Mañana" se calcula como el día siguiente en UTC (00:00 a 23:59). Para negocios en zonas horarias muy distintas, el recordatorio podría llegar con más o menos de 24h de anticipación.
- **Escalabilidad**: Las citas se procesan secuencialmente. Para volúmenes altos (>1000 citas/día), considerar procesamiento en batches con `Promise.allSettled`.
- **Reintentos**: No hay reintentos automáticos. Si el cron falla, se puede invocar manualmente. Las citas con `status: 'failed'` en `remindersSent` no se reintentan (ya tienen un registro `type: 'email'`).
