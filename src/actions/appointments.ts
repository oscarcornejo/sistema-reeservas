/**
 * @fileoverview Server Actions de Citas (Appointments).
 * CRUD completo + verificación de disponibilidad.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Appointment, Service, Professional, Client, ScheduleBlock } from '@/lib/db/models';
import { requireAuth, getUserBusiness } from '@/lib/auth/dal';
import { createAppointmentSchema, rescheduleAppointmentSchema, cancelAppointmentSchema } from '@/lib/validators/schemas';
import { addMinutes, format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { updateTag } from 'next/cache';
import { serialize } from '@/lib/utils';
import { sendRescheduleNotifications, sendCancellationNotifications, sendStatusChangeNotifications } from '@/lib/notifications/booking-notifications';
import type { ActionResult, IAppointment, IAppointmentPopulated, AppointmentStatus } from '@/types';

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

        // Verificar que no haya bloqueo activo
        const appointmentDateForBlock = parseISO(parsed.data.date);
        const activeBlock = await ScheduleBlock.findOne({
            professionalId: parsed.data.professionalId,
            isActive: true,
            $or: [
                { endDate: null, startDate: { $lte: endOfDay(appointmentDateForBlock) } },
                { startDate: { $lte: endOfDay(appointmentDateForBlock) }, endDate: { $gte: startOfDay(appointmentDateForBlock) } },
            ],
        }).lean();

        if (activeBlock) {
            return { success: false, error: 'El profesional no está disponible en esta fecha (agenda bloqueada)' };
        }

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

        updateTag('dashboard-metrics');
        updateTag('clients');

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

        // Obtener la cita con populate para verificar ownership y enviar notificaciones
        const appointment = await Appointment.findById(appointmentId)
            .populate('professionalId', 'displayName userId')
            .populate('clientId', 'name email userId')
            .populate('serviceId', 'name');
        if (!appointment) {
            return { success: false, error: 'Cita no encontrada' };
        }

        // Verificar autorización según rol
        const prof = appointment.professionalId as unknown as { _id: string; displayName: string; userId?: string } | null;
        const client = appointment.clientId as unknown as { _id: string; name: string; email: string; userId?: string } | null;
        const service = appointment.serviceId as unknown as { _id: string; name: string } | null;

        const isAdmin = user.role === 'admin';
        const isProfessional = user.role === 'professional'
            && prof?.userId?.toString() === user.id;
        const isClient = user.role === 'client'
            && client?.userId?.toString() === user.id;

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

        updateTag('dashboard-metrics');
        updateTag('clients');
        updateTag('professional-clients');
        updateTag('professional-reports');

        // Enviar notificaciones según el nuevo estado
        if (client && prof && service) {
            if (status === 'cancelled') {
                sendCancellationNotifications({
                    appointmentId: appointment._id.toString(),
                    businessId: appointment.businessId.toString(),
                    serviceName: service.name,
                    professionalName: prof.displayName,
                    clientName: client.name,
                    clientEmail: client.email,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    cancellationReason: cancellationReason || 'Cancelada por cambio de estado',
                    actorId: user.id!,
                    actorRole: user.role!,
                    professionalUserId: prof.userId?.toString(),
                    clientUserId: client.userId?.toString(),
                });
            } else {
                // Para confirmación, en progreso, completada, no-show:
                // notificar al profesional y admin (excluyendo al actor)
                sendStatusChangeNotifications({
                    appointmentId: appointment._id.toString(),
                    businessId: appointment.businessId.toString(),
                    serviceName: service.name,
                    professionalName: prof.displayName,
                    clientName: client.name,
                    clientEmail: client.email,
                    date: appointment.date,
                    startTime: appointment.startTime,
                    newStatus: status,
                    actorId: user.id!,
                    professionalUserId: prof.userId?.toString(),
                    clientUserId: client.userId?.toString(),
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error actualizando cita:', error);
        return { success: false, error: 'Error al actualizar la cita' };
    }
}

/**
 * Reagendar una cita existente.
 * Verifica permisos por rol y disponibilidad del nuevo horario.
 */
export async function rescheduleAppointment(
    formData: FormData
): Promise<ActionResult> {
    const user = await requireAuth();

    const rawData = {
        appointmentId: formData.get('appointmentId') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
    };

    const parsed = rescheduleAppointmentSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const appointment = await Appointment.findById(parsed.data.appointmentId)
            .populate('professionalId', 'displayName userId')
            .populate('clientId', 'name email userId')
            .populate('serviceId', 'name duration price');

        if (!appointment) {
            return { success: false, error: 'Cita no encontrada' };
        }

        // No se pueden reagendar citas finalizadas
        const finalStatuses: AppointmentStatus[] = ['completed', 'cancelled', 'no-show'];
        if (finalStatuses.includes(appointment.status as AppointmentStatus)) {
            return { success: false, error: 'No se puede reagendar una cita finalizada' };
        }

        // Verificar autorización por rol
        const prof = appointment.professionalId as unknown as { _id: string; userId: string; displayName: string };
        const client = appointment.clientId as unknown as { _id: string; name: string; email: string; userId?: string };
        const service = appointment.serviceId as unknown as { _id: string; name: string; duration: number; price: number };

        const isAdmin = user.role === 'admin';
        const isProfessional = user.role === 'professional' && prof.userId?.toString() === user.id;
        const isClient = user.role === 'client' && client.userId?.toString() === user.id;

        if (!isAdmin && !isProfessional && !isClient) {
            return { success: false, error: 'No tienes permiso para reagendar esta cita' };
        }

        // Calcular endTime con la duración del servicio
        const [hours, minutes] = parsed.data.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(startDate, service.duration);
        const endTime = format(endDate, 'HH:mm');

        // Verificar disponibilidad (excluyendo esta misma cita)
        const appointmentDate = parseISO(parsed.data.date);
        const conflicting = await Appointment.findOne({
            _id: { $ne: appointment._id },
            professionalId: prof._id,
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

        // Guardar datos anteriores para notificación
        const previousDate = appointment.date;
        const previousStartTime = appointment.startTime;

        await Appointment.findByIdAndUpdate(appointment._id, {
            date: appointmentDate,
            startTime: parsed.data.startTime,
            endTime,
        });

        updateTag('dashboard-metrics');
        updateTag('clients');

        // Notificaciones fire-and-forget
        sendRescheduleNotifications({
            appointmentId: appointment._id.toString(),
            businessId: appointment.businessId.toString(),
            serviceName: service.name,
            professionalName: prof.displayName,
            clientName: client.name,
            clientEmail: client.email,
            previousDate,
            previousStartTime,
            newDate: appointmentDate,
            newStartTime: parsed.data.startTime,
            actorId: user.id!,
            actorRole: user.role!,
            professionalUserId: prof.userId?.toString(),
            clientUserId: client.userId?.toString(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error reagendando cita:', error);
        return { success: false, error: 'Error al reagendar la cita' };
    }
}

/**
 * Cancelar una cita existente con motivo obligatorio.
 * Verifica permisos por rol.
 */
export async function cancelAppointment(
    formData: FormData
): Promise<ActionResult> {
    const user = await requireAuth();

    const rawData = {
        appointmentId: formData.get('appointmentId') as string,
        cancellationReason: formData.get('cancellationReason') as string,
    };

    const parsed = cancelAppointmentSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const appointment = await Appointment.findById(parsed.data.appointmentId)
            .populate('professionalId', 'displayName userId')
            .populate('clientId', 'name email userId')
            .populate('serviceId', 'name duration price');

        if (!appointment) {
            return { success: false, error: 'Cita no encontrada' };
        }

        const finalStatuses: AppointmentStatus[] = ['completed', 'cancelled', 'no-show'];
        if (finalStatuses.includes(appointment.status as AppointmentStatus)) {
            return { success: false, error: 'No se puede cancelar una cita finalizada' };
        }

        const prof = appointment.professionalId as unknown as { _id: string; userId: string; displayName: string };
        const client = appointment.clientId as unknown as { _id: string; name: string; email: string; userId?: string };
        const service = appointment.serviceId as unknown as { _id: string; name: string; duration: number; price: number };

        const isAdmin = user.role === 'admin';
        const isProfessional = user.role === 'professional' && prof.userId?.toString() === user.id;
        const isClient = user.role === 'client' && client.userId?.toString() === user.id;

        if (!isAdmin && !isProfessional && !isClient) {
            return { success: false, error: 'No tienes permiso para cancelar esta cita' };
        }

        await Appointment.findByIdAndUpdate(appointment._id, {
            status: 'cancelled',
            cancellationReason: parsed.data.cancellationReason,
        });

        updateTag('dashboard-metrics');
        updateTag('clients');

        // Notificaciones fire-and-forget
        sendCancellationNotifications({
            appointmentId: appointment._id.toString(),
            businessId: appointment.businessId.toString(),
            serviceName: service.name,
            professionalName: prof.displayName,
            clientName: client.name,
            clientEmail: client.email,
            date: appointment.date,
            startTime: appointment.startTime,
            cancellationReason: parsed.data.cancellationReason,
            actorId: user.id!,
            actorRole: user.role!,
            professionalUserId: prof.userId?.toString(),
            clientUserId: client.userId?.toString(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error cancelando cita:', error);
        return { success: false, error: 'Error al cancelar la cita' };
    }
}

/**
 * Obtener una cita por su ID (populada).
 * Verifica que el usuario tenga acceso (admin del negocio o profesional asignado).
 */
export async function getAppointmentById(
    appointmentId: string
): Promise<ActionResult<IAppointmentPopulated>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const appointment = await Appointment.findById(appointmentId)
            .populate('serviceId', 'name duration price')
            .populate('professionalId', 'displayName avatar')
            .populate('clientId', 'name email phone')
            .lean();

        if (!appointment) {
            return { success: false, error: 'Cita no encontrada' };
        }

        // Verificar acceso
        if (user.role === 'admin') {
            const business = await getUserBusiness();
            if (!business || appointment.businessId.toString() !== business._id.toString()) {
                return { success: false, error: 'No tienes acceso a esta cita' };
            }
        } else if (user.role === 'professional') {
            const professional = await Professional.findOne({ userId: user.id });
            if (!professional || appointment.professionalId._id.toString() !== professional._id.toString()) {
                return { success: false, error: 'No tienes acceso a esta cita' };
            }
        } else {
            return { success: false, error: 'Acceso no autorizado' };
        }

        return { success: true, data: serialize(appointment) as unknown as IAppointmentPopulated };
    } catch (error) {
        console.error('Error obteniendo cita por ID:', error);
        return { success: false, error: 'Error al obtener la cita' };
    }
}

/**
 * Obtener citas del profesional autenticado por rango de fechas.
 */
export async function getProfessionalAppointments(
    startDate: string,
    endDate: string
): Promise<ActionResult<IAppointmentPopulated[]>> {
    const user = await requireAuth();

    if (user.role !== 'professional') {
        return { success: false, error: 'Acceso no autorizado' };
    }

    try {
        await connectDB();

        const professional = await Professional.findOne({ userId: user.id });
        if (!professional) {
            return { success: false, error: 'Perfil profesional no encontrado' };
        }

        const appointments = await Appointment.find({
            professionalId: professional._id,
            date: {
                $gte: parseISO(startDate),
                $lte: parseISO(endDate),
            },
        })
            .populate('serviceId', 'name duration price')
            .populate('professionalId', 'displayName avatar')
            .populate('clientId', 'name email phone')
            .sort({ date: 1, startTime: 1 })
            .lean();

        return { success: true, data: serialize(appointments) as unknown as IAppointmentPopulated[] };
    } catch (error) {
        console.error('Error obteniendo citas del profesional:', error);
        return { success: false, error: 'Error al obtener las citas' };
    }
}

/**
 * Obtener citas del cliente autenticado (próximas o pasadas).
 */
export async function getClientAppointments(
    filter: 'upcoming' | 'past'
): Promise<ActionResult<IAppointmentPopulated[]>> {
    const user = await requireAuth();

    if (user.role !== 'client') {
        return { success: false, error: 'Acceso no autorizado' };
    }

    try {
        await connectDB();

        // Un usuario puede tener perfiles de cliente en múltiples negocios
        const clientProfiles = await Client.find({ userId: user.id }).lean();
        if (clientProfiles.length === 0) {
            return { success: true, data: [] };
        }

        const clientIds = clientProfiles.map((c) => c._id);
        const today = startOfDay(new Date());

        let query: Record<string, unknown>;
        if (filter === 'upcoming') {
            query = {
                clientId: { $in: clientIds },
                date: { $gte: today },
                status: { $nin: ['cancelled', 'no-show', 'completed'] },
            };
        } else {
            query = {
                clientId: { $in: clientIds },
                $or: [
                    { date: { $lt: today } },
                    { status: { $in: ['completed', 'cancelled', 'no-show'] } },
                ],
            };
        }

        const appointments = await Appointment.find(query)
            .populate('serviceId', 'name duration price')
            .populate('professionalId', 'displayName avatar')
            .populate('clientId', 'name email phone')
            .populate('businessId', 'name slug')
            .sort({ date: filter === 'upcoming' ? 1 : -1, startTime: filter === 'upcoming' ? 1 : -1 })
            .lean();

        return { success: true, data: serialize(appointments) as unknown as IAppointmentPopulated[] };
    } catch (error) {
        console.error('Error obteniendo citas del cliente:', error);
        return { success: false, error: 'Error al obtener las citas' };
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

        // Verificar bloqueo activo para el día
        const activeBlock = await ScheduleBlock.findOne({
            professionalId,
            isActive: true,
            $or: [
                { endDate: null, startDate: { $lte: endOfDay(targetDate) } },
                { startDate: { $lte: endOfDay(targetDate) }, endDate: { $gte: startOfDay(targetDate) } },
            ],
        }).lean();

        if (activeBlock) {
            return { success: true, data: [] }; // Día bloqueado
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

        // Si la fecha es hoy, calcular minutos actuales para filtrar slots pasados
        const now = new Date();
        const isTargetToday = targetDate.toDateString() === now.toDateString();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

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
                // Omitir slots que ya pasaron si es hoy
                if (isTargetToday && time <= currentMinutes) {
                    continue;
                }

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
