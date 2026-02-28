/**
 * @fileoverview Orquestador de notificaciones de bloqueo de agenda.
 * Envía emails a clientes afectados y notificaciones in-app a profesionales/admins.
 * Nunca lanza errores — toda la lógica está wrapeada en try/catch.
 */

import { connectDB } from '@/lib/db/connection';
import { Business, Notification } from '@/lib/db/models';
import { sendEmail } from '@/lib/email/send';
import { scheduleBlockedTemplate } from '@/lib/email/templates';
import { formatDate, formatTime } from '@/lib/utils/format';

interface AffectedAppointment {
    appointmentId: string;
    clientName: string;
    clientEmail: string;
    clientUserId?: string;
    serviceName: string;
    date: Date;
    startTime: string;
}

export interface BlockNotificationData {
    blockId: string;
    businessId: string;
    professionalName: string;
    blockType: string;
    startDate: Date;
    endDate: Date | null;
    reason: string;
    actorId: string;
    actorRole: string;
    professionalUserId?: string;
    affectedAppointments: AffectedAppointment[];
}

export interface UnblockNotificationData {
    blockId: string;
    businessId: string;
    professionalName: string;
    actorId: string;
    actorRole: string;
    professionalUserId?: string;
}

/**
 * Enviar notificaciones tras bloquear una agenda.
 * - Email a cada cliente afectado
 * - In-app al profesional (si actor=admin)
 * - In-app al admin (si actor=professional)
 */
export async function sendBlockNotifications(data: BlockNotificationData): Promise<void> {
    try {
        await connectDB();

        const business = await Business.findById(data.businessId).lean();
        if (!business) {
            console.error('❌ Notificación bloqueo: negocio no encontrado', data.businessId);
            return;
        }

        // Email + in-app a cada cliente afectado
        for (const apt of data.affectedAppointments) {
            const formattedDate = formatDate(apt.date);
            const formattedTime = formatTime(apt.startTime);

            // Email al cliente
            const { subject, html } = scheduleBlockedTemplate({
                clientName: apt.clientName,
                businessName: business.name,
                serviceName: apt.serviceName,
                professionalName: data.professionalName,
                date: formattedDate,
                startTime: formattedTime,
                reason: data.reason,
            });
            sendEmail({ to: apt.clientEmail, subject, html });

            // In-app al cliente
            if (apt.clientUserId) {
                await Notification.create({
                    recipientId: apt.clientUserId,
                    type: 'schedule-blocked',
                    title: 'Cita cancelada por bloqueo de agenda',
                    message: `Tu cita de ${apt.serviceName} del ${formattedDate} a las ${formattedTime} fue cancelada porque el profesional bloqueó su agenda`,
                    referenceId: data.blockId,
                    referenceModel: 'ScheduleBlock',
                });
            }
        }

        // In-app al profesional (si el actor es admin)
        if (data.actorRole === 'admin' && data.professionalUserId) {
            await Notification.create({
                recipientId: data.professionalUserId,
                type: 'schedule-blocked',
                title: 'Agenda bloqueada por el administrador',
                message: `Tu agenda fue bloqueada por el administrador. Motivo: ${data.reason}`,
                referenceId: data.blockId,
                referenceModel: 'ScheduleBlock',
            });
        }

        // In-app al admin (si el actor es profesional)
        if (data.actorRole === 'professional' && business.adminId) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'schedule-blocked',
                title: 'Profesional bloqueó su agenda',
                message: `${data.professionalName} bloqueó su agenda. Motivo: ${data.reason}`,
                referenceId: data.blockId,
                referenceModel: 'ScheduleBlock',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de bloqueo:', error);
    }
}

/**
 * Enviar notificaciones tras desbloquear una agenda.
 * Solo in-app (sin email).
 */
export async function sendUnblockNotifications(data: UnblockNotificationData): Promise<void> {
    try {
        await connectDB();

        const business = await Business.findById(data.businessId).lean();
        if (!business) {
            console.error('❌ Notificación desbloqueo: negocio no encontrado', data.businessId);
            return;
        }

        // In-app al profesional (si el actor es admin)
        if (data.actorRole === 'admin' && data.professionalUserId) {
            await Notification.create({
                recipientId: data.professionalUserId,
                type: 'schedule-unblocked',
                title: 'Agenda desbloqueada',
                message: `Tu agenda fue desbloqueada por el administrador`,
                referenceId: data.blockId,
                referenceModel: 'ScheduleBlock',
            });
        }

        // In-app al admin (si el actor es profesional)
        if (data.actorRole === 'professional' && business.adminId) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'schedule-unblocked',
                title: 'Profesional desbloqueó su agenda',
                message: `${data.professionalName} desbloqueó su agenda`,
                referenceId: data.blockId,
                referenceModel: 'ScheduleBlock',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de desbloqueo:', error);
    }
}
