/**
 * @fileoverview Orquestador de notificaciones de reserva.
 * Envía email al cliente y crea notificaciones in-app para profesional y admin.
 * Nunca lanza errores — toda la lógica está wrapeada en try/catch.
 */

import { connectDB } from '@/lib/db/connection';
import { Business, Professional, Service, Notification } from '@/lib/db/models';
import { sendEmail } from '@/lib/email/send';
import { bookingConfirmationTemplate, bookingRescheduleTemplate, bookingCancellationTemplate } from '@/lib/email/templates';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils/format';
import type { SupportedCurrency } from '@/types';

interface BookingNotificationData {
    appointmentId: string;
    businessId: string;
    professionalId: string;
    serviceId: string;
    clientName: string;
    clientEmail: string;
    date: Date;
    startTime: string;
    duration: number;
    price: number;
}

/**
 * Enviar notificaciones tras una reserva pública.
 * - Email de confirmación al cliente (fire-and-forget)
 * - Notificación in-app al profesional y al admin del negocio
 */
export async function sendBookingNotifications(data: BookingNotificationData): Promise<void> {
    try {
        await connectDB();

        const [business, professional, service] = await Promise.all([
            Business.findById(data.businessId).lean(),
            Professional.findById(data.professionalId).lean(),
            Service.findById(data.serviceId).lean(),
        ]);

        if (!business || !professional || !service) {
            console.error('❌ Notificación: datos incompletos para la reserva', data.appointmentId);
            return;
        }

        const formattedDate = formatDate(data.date);
        const formattedTime = formatTime(data.startTime);
        const formattedPrice = formatCurrency(data.price, service.currency as SupportedCurrency);

        // 1. Email al cliente (fire-and-forget)
        const { subject, html } = bookingConfirmationTemplate({
            clientName: data.clientName,
            businessName: business.name,
            serviceName: service.name,
            professionalName: professional.displayName,
            date: formattedDate,
            startTime: formattedTime,
            duration: data.duration,
            price: formattedPrice,
        });
        sendEmail({ to: data.clientEmail, subject, html });

        const message = `${data.clientName} reservó ${service.name} para el ${formattedDate} a las ${formattedTime}`;

        // 2. Notificación in-app al profesional
        await Notification.create({
            recipientId: professional.userId,
            type: 'new-booking',
            title: 'Nueva reserva',
            message,
            referenceId: data.appointmentId,
            referenceModel: 'Appointment',
        });

        // 3. Notificación in-app al admin (si es distinto al profesional)
        if (business.adminId && business.adminId.toString() !== professional.userId?.toString()) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'new-booking',
                title: 'Nueva reserva',
                message: `${data.clientName} reservó ${service.name} con ${professional.displayName} para el ${formattedDate} a las ${formattedTime}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de reserva:', error);
    }
}

// =============================================================================
// Reagendamiento
// =============================================================================

interface RescheduleNotificationData {
    appointmentId: string;
    businessId: string;
    serviceName: string;
    professionalName: string;
    clientName: string;
    clientEmail: string;
    previousDate: Date;
    previousStartTime: string;
    newDate: Date;
    newStartTime: string;
    actorId: string;
    actorRole: string;
    professionalUserId?: string;
    clientUserId?: string;
}

/**
 * Enviar notificaciones tras reagendar una cita.
 * - Email al cliente con fechas anterior/nueva
 * - In-app a profesional, admin y cliente (excluyendo al actor)
 */
export async function sendRescheduleNotifications(data: RescheduleNotificationData): Promise<void> {
    try {
        await connectDB();

        const business = await Business.findById(data.businessId).lean();
        if (!business) {
            console.error('❌ Notificación reschedule: negocio no encontrado', data.businessId);
            return;
        }

        const prevDate = formatDate(data.previousDate);
        const prevTime = formatTime(data.previousStartTime);
        const newDate = formatDate(data.newDate);
        const newTime = formatTime(data.newStartTime);

        // Email al cliente
        const { subject, html } = bookingRescheduleTemplate({
            clientName: data.clientName,
            businessName: business.name,
            serviceName: data.serviceName,
            professionalName: data.professionalName,
            previousDate: prevDate,
            previousTime: prevTime,
            newDate,
            newTime,
        });
        sendEmail({ to: data.clientEmail, subject, html });

        // In-app al profesional (si no es el actor)
        if (data.professionalUserId && data.professionalUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.professionalUserId,
                type: 'booking-rescheduled',
                title: 'Cita reagendada',
                message: `La cita de ${data.clientName} (${data.serviceName}) fue reagendada al ${newDate} a las ${newTime}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al admin (si no es el actor)
        const adminId = business.adminId?.toString();
        if (adminId && adminId !== data.actorId && adminId !== data.professionalUserId) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'booking-rescheduled',
                title: 'Cita reagendada',
                message: `La cita de ${data.clientName} con ${data.professionalName} (${data.serviceName}) fue reagendada al ${newDate} a las ${newTime}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al cliente (si no es el actor)
        if (data.clientUserId && data.clientUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.clientUserId,
                type: 'booking-rescheduled',
                title: 'Cita reagendada',
                message: `Tu cita de ${data.serviceName} fue reagendada al ${newDate} a las ${newTime}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de reagendamiento:', error);
    }
}

// =============================================================================
// Cancelación
// =============================================================================

interface CancellationNotificationData {
    appointmentId: string;
    businessId: string;
    serviceName: string;
    professionalName: string;
    clientName: string;
    clientEmail: string;
    date: Date;
    startTime: string;
    cancellationReason: string;
    actorId: string;
    actorRole: string;
    professionalUserId?: string;
    clientUserId?: string;
}

/**
 * Enviar notificaciones tras cancelar una cita.
 * - Email al cliente con motivo de cancelación
 * - In-app a profesional, admin y cliente (excluyendo al actor)
 */
export async function sendCancellationNotifications(data: CancellationNotificationData): Promise<void> {
    try {
        await connectDB();

        const business = await Business.findById(data.businessId).lean();
        if (!business) {
            console.error('❌ Notificación cancellation: negocio no encontrado', data.businessId);
            return;
        }

        const formattedDate = formatDate(data.date);
        const formattedTime = formatTime(data.startTime);

        // Email al cliente
        const { subject, html } = bookingCancellationTemplate({
            clientName: data.clientName,
            businessName: business.name,
            serviceName: data.serviceName,
            professionalName: data.professionalName,
            date: formattedDate,
            startTime: formattedTime,
            cancellationReason: data.cancellationReason,
        });
        sendEmail({ to: data.clientEmail, subject, html });

        // In-app al profesional (si no es el actor)
        if (data.professionalUserId && data.professionalUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.professionalUserId,
                type: 'booking-cancelled',
                title: 'Cita cancelada',
                message: `La cita de ${data.clientName} (${data.serviceName}) del ${formattedDate} fue cancelada`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al admin (si no es el actor)
        const adminId = business.adminId?.toString();
        if (adminId && adminId !== data.actorId && adminId !== data.professionalUserId) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'booking-cancelled',
                title: 'Cita cancelada',
                message: `La cita de ${data.clientName} con ${data.professionalName} (${data.serviceName}) del ${formattedDate} fue cancelada`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al cliente (si no es el actor)
        if (data.clientUserId && data.clientUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.clientUserId,
                type: 'booking-cancelled',
                title: 'Cita cancelada',
                message: `Tu cita de ${data.serviceName} del ${formattedDate} fue cancelada`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de cancelación:', error);
    }
}

// =============================================================================
// Cambio de estado genérico (confirmada, en progreso, completada, no-show)
// =============================================================================

interface StatusChangeNotificationData {
    appointmentId: string;
    businessId: string;
    serviceName: string;
    professionalName: string;
    clientName: string;
    clientEmail: string;
    date: Date;
    startTime: string;
    newStatus: string;
    actorId: string;
    professionalUserId?: string;
    clientUserId?: string;
}

const STATUS_LABELS: Record<string, string> = {
    confirmed: 'confirmada',
    'in-progress': 'en progreso',
    completed: 'completada',
    'no-show': 'marcada como no asistió',
};

/**
 * Enviar notificaciones tras un cambio de estado (no cancelación).
 * - In-app al profesional, admin y cliente (excluyendo al actor)
 */
export async function sendStatusChangeNotifications(data: StatusChangeNotificationData): Promise<void> {
    try {
        await connectDB();

        const business = await Business.findById(data.businessId).lean();
        if (!business) return;

        const formattedDate = formatDate(data.date);
        const formattedTime = formatTime(data.startTime);
        const statusLabel = STATUS_LABELS[data.newStatus] || data.newStatus;

        // In-app al profesional (si no es el actor)
        if (data.professionalUserId && data.professionalUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.professionalUserId,
                type: 'new-booking',
                title: `Cita ${statusLabel}`,
                message: `La cita de ${data.clientName} (${data.serviceName}) del ${formattedDate} a las ${formattedTime} fue ${statusLabel}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al admin (si no es el actor y distinto al profesional)
        const adminId = business.adminId?.toString();
        if (adminId && adminId !== data.actorId && adminId !== data.professionalUserId) {
            await Notification.create({
                recipientId: business.adminId,
                type: 'new-booking',
                title: `Cita ${statusLabel}`,
                message: `La cita de ${data.clientName} con ${data.professionalName} (${data.serviceName}) del ${formattedDate} fue ${statusLabel}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }

        // In-app al cliente (si no es el actor)
        if (data.clientUserId && data.clientUserId !== data.actorId) {
            await Notification.create({
                recipientId: data.clientUserId,
                type: 'new-booking',
                title: `Tu cita fue ${statusLabel}`,
                message: `Tu cita de ${data.serviceName} del ${formattedDate} a las ${formattedTime} fue ${statusLabel}`,
                referenceId: data.appointmentId,
                referenceModel: 'Appointment',
            });
        }
    } catch (error) {
        console.error('❌ Error enviando notificaciones de cambio de estado:', error);
    }
}
