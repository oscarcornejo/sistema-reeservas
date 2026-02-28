/**
 * @fileoverview Server Actions de Citas (Appointments).
 * CRUD completo + verificación de disponibilidad.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Appointment, Service, Professional } from '@/lib/db/models';
import { requireAuth, getUserBusiness } from '@/lib/auth/dal';
import { createAppointmentSchema } from '@/lib/validators/schemas';
import { addMinutes, format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { serialize } from '@/lib/utils';
import type { ActionResult, IAppointment, AppointmentStatus } from '@/types';

/**
 * Crear una nueva cita verificando disponibilidad.
 * Calcula automáticamente endTime basado en la duración del servicio.
 */
export async function createAppointment(
    formData: FormData
): Promise<ActionResult<{ appointmentId: string }>> {
    const user = await requireAuth();

    const rawData = {
        businessId: formData.get('businessId') as string,
        professionalId: formData.get('professionalId') as string,
        serviceId: formData.get('serviceId') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
        clientNotes: formData.get('clientNotes') as string | undefined,
    };

    const parsed = createAppointmentSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Obtener duración del servicio
        const service = await Service.findById(parsed.data.serviceId);
        if (!service || !service.isActive) {
            return { success: false, error: 'Servicio no encontrado o inactivo' };
        }

        // Calcular hora de fin
        const [hours, minutes] = parsed.data.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, service.duration);
        const endTime = format(endDate, 'HH:mm');

        // Verificar disponibilidad (no solapamiento)
        const appointmentDate = parseISO(parsed.data.date);
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
            return { success: false, error: 'El horario seleccionado no está disponible' };
        }

        const appointment = await Appointment.create({
            businessId: parsed.data.businessId,
            clientId: user.id,
            professionalId: parsed.data.professionalId,
            serviceId: parsed.data.serviceId,
            date: appointmentDate,
            startTime: parsed.data.startTime,
            endTime,
            duration: service.duration,
            paymentAmount: service.price,
            clientNotes: parsed.data.clientNotes,
        });

        return {
            success: true,
            data: { appointmentId: appointment._id.toString() },
        };
    } catch (error) {
        console.error('Error creando cita:', error);
        return { success: false, error: 'Error al crear la cita' };
    }
}

/**
 * Actualizar el estado de una cita.
 * Verifica que el usuario sea el admin del negocio, el profesional asignado,
 * o el cliente de la cita (solo puede cancelar).
 */
export async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    cancellationReason?: string
): Promise<ActionResult> {
    const user = await requireAuth();

    try {
        await connectDB();

        // Obtener la cita para verificar ownership
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return { success: false, error: 'Cita no encontrada' };
        }

        // Verificar autorización según rol
        const userId = user.id;
        const isAdmin = user.role === 'admin';
        const isProfessional = user.role === 'professional'
            && appointment.professionalId?.toString() === userId;
        const isClient = user.role === 'client'
            && appointment.clientId?.toString() === userId;

        if (!isAdmin && !isProfessional && !isClient) {
            return { success: false, error: 'No tienes permiso para modificar esta cita' };
        }

        // Clientes solo pueden cancelar sus propias citas
        if (isClient && status !== 'cancelled') {
            return { success: false, error: 'Solo puedes cancelar tus citas' };
        }

        const updateData: Partial<IAppointment> = { status };
        if (status === 'cancelled' && cancellationReason) {
            updateData.cancellationReason = cancellationReason;
        }

        await Appointment.findByIdAndUpdate(appointmentId, updateData, { new: true });

        return { success: true };
    } catch (error) {
        console.error('Error actualizando cita:', error);
        return { success: false, error: 'Error al actualizar la cita' };
    }
}

/**
 * Obtener citas por rango de fechas para el negocio del admin.
 */
export async function getBusinessAppointments(
    startDate: string,
    endDate: string,
    professionalId?: string
): Promise<ActionResult<IAppointment[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const query: Record<string, unknown> = {
            businessId: business._id,
            date: {
                $gte: parseISO(startDate),
                $lte: parseISO(endDate),
            },
        };

        if (professionalId) {
            query.professionalId = professionalId;
        }

        const appointments = await Appointment.find(query)
            .populate('serviceId', 'name duration price')
            .populate('professionalId', 'displayName avatar')
            .populate('clientId', 'name email phone')
            .sort({ date: 1, startTime: 1 })
            .lean();

        return { success: true, data: serialize(appointments) as IAppointment[] };
    } catch (error) {
        console.error('Error obteniendo citas:', error);
        return { success: false, error: 'Error al obtener las citas' };
    }
}

/**
 * Obtener slots disponibles para un profesional en una fecha.
 * Calcula gaps entre citas existentes y el horario del profesional.
 */
export async function getAvailableSlots(
    professionalId: string,
    date: string,
    serviceId: string
): Promise<ActionResult<string[]>> {
    try {
        await connectDB();

        const professional = await Professional.findById(professionalId);
        if (!professional) {
            return { success: false, error: 'Profesional no encontrado' };
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            return { success: false, error: 'Servicio no encontrado' };
        }

        const targetDate = parseISO(date);
        const dayOfWeek = targetDate.getDay();

        // Horario del profesional para este día
        const daySchedule = professional.availableHours.find(
            (h) => h.dayOfWeek === dayOfWeek
        );
        if (!daySchedule || daySchedule.slots.length === 0) {
            return { success: true, data: [] }; // No trabaja este día
        }

        // Citas existentes del día
        const existingAppointments = await Appointment.find({
            professionalId,
            date: {
                $gte: startOfDay(targetDate),
                $lte: endOfDay(targetDate),
            },
            status: { $nin: ['cancelled', 'no-show'] },
        })
            .sort({ startTime: 1 })
            .lean();

        // Generar slots disponibles en intervalos de 30 min
        const availableSlots: string[] = [];
        const slotInterval = 30; // minutos

        for (const schedule of daySchedule.slots) {
            const [startH, startM] = schedule.start.split(':').map(Number);
            const [endH, endM] = schedule.end.split(':').map(Number);
            const scheduleStart = startH * 60 + startM;
            const scheduleEnd = endH * 60 + endM;

            for (
                let time = scheduleStart;
                time + service.duration <= scheduleEnd;
                time += slotInterval
            ) {
                const slotStart = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
                const slotEndMinutes = time + service.duration;
                const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

                // Verificar si no hay conflicto
                const hasConflict = existingAppointments.some((apt) => {
                    return apt.startTime < slotEnd && apt.endTime > slotStart;
                });

                if (!hasConflict) {
                    availableSlots.push(slotStart);
                }
            }
        }

        return { success: true, data: availableSlots };
    } catch (error) {
        console.error('Error obteniendo slots:', error);
        return { success: false, error: 'Error al verificar disponibilidad' };
    }
}

/**
 * Obtener profesionales activos del negocio del admin.
 * Retorna solo datos ligeros para UI (id, nombre, avatar).
 */
export async function getBusinessProfessionals(): Promise<
    ActionResult<{ id: string; displayName: string; avatar?: string }[]>
> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const professionals = await Professional.find(
            { businessId: business._id, isActive: true },
            { _id: 1, displayName: 1, avatar: 1 }
        )
            .sort({ displayName: 1 })
            .lean();

        const data = professionals.map((p) => ({
            id: p._id.toString(),
            displayName: p.displayName,
            avatar: p.avatar,
        }));

        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo profesionales:', error);
        return { success: false, error: 'Error al obtener profesionales' };
    }
}

/**
 * Obtener métricas del dashboard del admin.
 */
export async function getDashboardMetrics(): Promise<
    ActionResult<{
        todayAppointments: number;
        upcomingAppointments: number;
        monthlyRevenue: number;
        occupancyRate: number;
    }>
> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Ejecutar todas las queries en paralelo (sin dependencias entre sí)
        const [
            todayAppointments,
            upcomingAppointments,
            monthlyRevenueResult,
            totalMonthAppointments,
            completedAppointments,
        ] = await Promise.all([
            // Citas de hoy
            Appointment.countDocuments({
                businessId: business._id,
                date: { $gte: startOfDay(today), $lte: endOfDay(today) },
                status: { $nin: ['cancelled'] },
            }),
            // Próximas citas (siguiente semana)
            Appointment.countDocuments({
                businessId: business._id,
                date: { $gt: today, $lte: nextWeek },
                status: { $nin: ['cancelled'] },
            }),
            // Ingresos del mes
            Appointment.aggregate([
                {
                    $match: {
                        businessId: business._id,
                        date: { $gte: startOfMonth, $lte: endOfMonth },
                        paymentStatus: 'paid',
                    },
                },
                { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
            ]),
            // Total citas del mes
            Appointment.countDocuments({
                businessId: business._id,
                date: { $gte: startOfMonth, $lte: endOfMonth },
            }),
            // Citas completadas del mes
            Appointment.countDocuments({
                businessId: business._id,
                date: { $gte: startOfMonth, $lte: endOfMonth },
                status: { $in: ['completed', 'confirmed', 'in-progress'] },
            }),
        ]);

        const occupancyRate =
            totalMonthAppointments > 0
                ? Math.round((completedAppointments / totalMonthAppointments) * 100)
                : 0;

        return {
            success: true,
            data: {
                todayAppointments,
                upcomingAppointments,
                monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
                occupancyRate,
            },
        };
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        return { success: false, error: 'Error al obtener métricas' };
    }
}
