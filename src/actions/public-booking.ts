/**
 * @fileoverview Server Action para reservas públicas.
 * Permite a visitantes (logueados o invitados) crear citas
 * sin requerir autenticación previa.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Appointment, Service, Professional, Client, Business, ScheduleBlock } from '@/lib/db/models';
import { publicBookingSchema } from '@/lib/validators/schemas';
import { addMinutes, format, parseISO, startOfDay, endOfDay, isBefore, startOfToday } from 'date-fns';
import { sendBookingNotifications } from '@/lib/notifications/booking-notifications';
import type { ActionResult } from '@/types';

/**
 * Crear una reserva pública sin autenticación.
 * Busca o crea un Client por email+businessId (upsert).
 */
export async function createPublicBooking(
    formData: FormData
): Promise<ActionResult<{ appointmentId: string }>> {
    const rawData = {
        businessId: formData.get('businessId') as string,
        professionalId: formData.get('professionalId') as string,
        serviceId: formData.get('serviceId') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
        clientName: formData.get('clientName') as string,
        clientEmail: formData.get('clientEmail') as string,
        clientPhone: formData.get('clientPhone') as string,
        clientNotes: formData.get('clientNotes') || undefined,
    };

    const parsed = publicBookingSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar que el negocio existe y está publicado
        const business = await Business.findById(parsed.data.businessId).lean();
        if (!business || !business.isPublished) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        // Verificar que el servicio existe y está activo
        const service = await Service.findById(parsed.data.serviceId).lean();
        if (!service || !service.isActive) {
            return { success: false, error: 'Servicio no encontrado o inactivo' };
        }

        // Verificar que el profesional existe y está activo
        const professional = await Professional.findById(parsed.data.professionalId).lean();
        if (!professional || !professional.isActive) {
            return { success: false, error: 'Profesional no encontrado o inactivo' };
        }

        // Verificar que la fecha es futura
        const appointmentDate = parseISO(parsed.data.date);
        if (isBefore(appointmentDate, startOfToday())) {
            return { success: false, error: 'La fecha debe ser futura' };
        }

        // Verificar que no haya bloqueo activo
        const activeBlock = await ScheduleBlock.findOne({
            professionalId: parsed.data.professionalId,
            isActive: true,
            $or: [
                { endDate: null, startDate: { $lte: endOfDay(appointmentDate) } },
                { startDate: { $lte: endOfDay(appointmentDate) }, endDate: { $gte: startOfDay(appointmentDate) } },
            ],
        }).lean();

        if (activeBlock) {
            return { success: false, error: 'El profesional no está disponible en esta fecha (agenda bloqueada)' };
        }

        // Calcular hora de fin
        const [hours, minutes] = parsed.data.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, service.duration);
        const endTime = format(endDate, 'HH:mm');

        // Verificar disponibilidad (no solapamiento)
        const conflicting = await Appointment.findOne({
            professionalId: parsed.data.professionalId,
            date: {
                $gte: startOfDay(appointmentDate),
                $lte: endOfDay(appointmentDate),
            },
            status: { $nin: ['cancelled', 'no-show'] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: parsed.data.startTime },
                },
            ],
        });

        if (conflicting) {
            return { success: false, error: 'El horario seleccionado ya no está disponible' };
        }

        // Buscar o crear cliente por email + negocio (upsert)
        const client = await Client.findOneAndUpdate(
            {
                businessId: parsed.data.businessId,
                email: parsed.data.clientEmail.toLowerCase(),
            },
            {
                $setOnInsert: {
                    name: parsed.data.clientName,
                    phone: parsed.data.clientPhone,
                    source: 'online',
                },
            },
            { upsert: true, new: true }
        );

        // Crear la cita
        const appointment = await Appointment.create({
            businessId: parsed.data.businessId,
            clientId: client._id,
            professionalId: parsed.data.professionalId,
            serviceId: parsed.data.serviceId,
            date: appointmentDate,
            startTime: parsed.data.startTime,
            endTime,
            duration: service.duration,
            paymentAmount: service.price,
            clientNotes: parsed.data.clientNotes,
        });

        // Notificaciones (fire-and-forget — no bloquea la respuesta)
        sendBookingNotifications({
            appointmentId: appointment._id.toString(),
            businessId: parsed.data.businessId,
            professionalId: parsed.data.professionalId,
            serviceId: parsed.data.serviceId,
            clientName: parsed.data.clientName,
            clientEmail: parsed.data.clientEmail,
            date: appointmentDate,
            startTime: parsed.data.startTime,
            duration: service.duration,
            price: service.price,
        });

        return {
            success: true,
            data: { appointmentId: appointment._id.toString() },
        };
    } catch (error) {
        console.error('Error creando reserva pública:', error);
        return { success: false, error: 'Error al crear la reserva' };
    }
}
