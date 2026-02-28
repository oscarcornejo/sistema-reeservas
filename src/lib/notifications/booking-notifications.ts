/**
 * @fileoverview Orquestador de notificaciones de reserva.
 * Envía email al cliente y crea notificación in-app para el profesional.
 * Nunca lanza errores — toda la lógica está wrapeada en try/catch.
 */

import { connectDB } from '@/lib/db/connection';
import { Business, Professional, Service, Notification } from '@/lib/db/models';
import { sendEmail } from '@/lib/email/send';
import { bookingConfirmationTemplate } from '@/lib/email/templates';
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
 * - Notificación in-app al profesional (persistida en DB)
 */
export async function sendBookingNotifications(data: BookingNotificationData): Promise<void> {
    try {
        await connectDB();

        // Obtener datos en paralelo
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

        // 1. Email al cliente (fire-and-forget — no await)
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

        // 2. Notificación in-app al profesional
        await Notification.create({
            recipientId: professional.userId,
            type: 'new-booking',
            title: 'Nueva reserva',
            message: `${data.clientName} reservó ${service.name} para el ${formattedDate} a las ${formattedTime}`,
            referenceId: data.appointmentId,
            referenceModel: 'Appointment',
        });
    } catch (error) {
        console.error('❌ Error enviando notificaciones de reserva:', error);
    }
}
