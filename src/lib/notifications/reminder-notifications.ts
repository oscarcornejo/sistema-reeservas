/**
 * @fileoverview Orquestador de recordatorios de citas.
 * Envía email al cliente y crea notificación in-app para el profesional.
 * Nunca lanza errores — toda la lógica está wrapeada en try/catch.
 */

import { Appointment, Notification } from '@/lib/db/models';
import { sendEmail } from '@/lib/email/send';
import { appointmentReminderTemplate } from '@/lib/email/templates';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils/format';
import type { SupportedCurrency } from '@/types';

interface PopulatedAppointment {
    _id: string;
    date: Date;
    startTime: string;
    duration: number;
    clientId: {
        _id: string;
        userId: string;
        name: string;
        email: string;
    };
    professionalId: {
        _id: string;
        userId: string;
        displayName: string;
    };
    serviceId: {
        _id: string;
        name: string;
        price: number;
        currency: string;
    };
    businessId: {
        _id: string;
        name: string;
        subscriptionPlan: string;
    };
}

/**
 * Enviar recordatorio de cita al cliente (24h antes).
 * - Email al cliente con detalles de la cita
 * - Notificación in-app al profesional (solo plan enterprise)
 * - Registra en appointment.remindersSent
 */
export async function sendAppointmentReminder(
    appointment: PopulatedAppointment
): Promise<{ sent: boolean }> {
    try {
        const { clientId: client, professionalId: professional, serviceId: service, businessId: business } = appointment;

        const formattedDate = formatDate(appointment.date);
        const formattedTime = formatTime(appointment.startTime);
        const formattedPrice = formatCurrency(service.price, service.currency as SupportedCurrency);

        // 1. Email al cliente
        const { subject, html } = appointmentReminderTemplate({
            clientName: client.name,
            businessName: business.name,
            serviceName: service.name,
            professionalName: professional.displayName,
            date: formattedDate,
            startTime: formattedTime,
            duration: appointment.duration,
            price: formattedPrice,
        });

        await sendEmail({ to: client.email, subject, html });

        // 2. Notificación in-app al profesional (solo plan enterprise)
        if (business.subscriptionPlan === 'enterprise') {
            await Notification.create({
                recipientId: professional.userId,
                type: 'booking-reminder',
                title: 'Recordatorio de cita',
                message: `Mañana: ${client.name} — ${service.name} a las ${formattedTime}`,
                referenceId: appointment._id.toString(),
                referenceModel: 'Appointment',
            });
        }

        // 3. Registrar en appointment.remindersSent
        await Appointment.updateOne(
            { _id: appointment._id },
            { $push: { remindersSent: { type: 'email', sentAt: new Date(), status: 'sent' } } }
        );

        return { sent: true };
    } catch (error) {
        console.error('❌ Error enviando recordatorio de cita:', error);

        // Intentar registrar el fallo
        try {
            await Appointment.updateOne(
                { _id: appointment._id },
                { $push: { remindersSent: { type: 'email', sentAt: new Date(), status: 'failed' } } }
            );
        } catch {
            // Silenciar — no hay nada más que hacer
        }

        return { sent: false };
    }
}
