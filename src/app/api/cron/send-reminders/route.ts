/**
 * @fileoverview Endpoint cron para enviar recordatorios de citas.
 * Busca citas de mañana y envía recordatorios por email.
 * Protegido por CRON_SECRET en producción, abierto en desarrollo.
 *
 * Ejecutado diariamente a las 12:00 UTC (9:00 AM Chile, 7:00 AM México)
 * vía Vercel Cron Jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Appointment } from '@/lib/db/models';
import { sendAppointmentReminder } from '@/lib/notifications/reminder-notifications';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { appLogger } from '@/lib/logger';
import { auditLog } from '@/lib/logger/audit';

export async function GET(request: NextRequest) {
    // Verificar autenticación en producción
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
    }

    // Rate limit por key fija
    const rateCheck = checkRateLimit('cron:send-reminders', RATE_LIMITS.cron);
    if (!rateCheck.allowed) {
        appLogger.warn('Cron send-reminders rate limit excedido');
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    auditLog('cron.execute', { metadata: { job: 'send-reminders' } });

    try {
        await connectDB();

        // Calcular rango de "mañana" (próximas 24h desde medianoche UTC)
        const now = new Date();
        const tomorrowStart = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        const tomorrowEnd = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            23, 59, 59, 999
        ));

        // Buscar citas de mañana que aún no tienen recordatorio por email
        const appointments = await Appointment.find({
            status: { $in: ['pending', 'confirmed'] },
            date: { $gte: tomorrowStart, $lte: tomorrowEnd },
            'remindersSent.type': { $ne: 'email' },
        })
            .populate('clientId', 'userId name email')
            .populate('professionalId', 'userId displayName')
            .populate('serviceId', 'name price currency')
            .populate('businessId', 'name subscriptionPlan');

        let sent = 0;
        let failed = 0;

        for (const appointment of appointments) {
            // Verificar que los populate retornaron datos válidos
            if (!appointment.clientId || !appointment.professionalId || !appointment.serviceId || !appointment.businessId) {
                appLogger.error(`Recordatorio: datos incompletos para cita ${appointment._id}`);
                failed++;
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await sendAppointmentReminder(appointment as any);
            if (result.sent) {
                sent++;
            } else {
                failed++;
            }
        }

        appLogger.info(`Recordatorios: ${sent} enviados, ${failed} fallidos de ${appointments.length} citas`);

        return NextResponse.json({
            processed: appointments.length,
            sent,
            failed,
        });
    } catch (error) {
        appLogger.error('Error en cron de recordatorios', error);
        return NextResponse.json(
            { error: 'Error interno procesando recordatorios' },
            { status: 500 }
        );
    }
}
