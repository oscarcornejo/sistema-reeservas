/**
 * @fileoverview Server Actions de Bloqueo de Agenda.
 * CRUD de bloqueos + auto-cancelación de citas afectadas.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Appointment, Professional, ScheduleBlock } from '@/lib/db/models';
import { requireAuth, getUserBusiness } from '@/lib/auth/dal';
import { createScheduleBlockSchema, removeScheduleBlockSchema } from '@/lib/validators/schemas';
import { addDays, addMonths, parseISO, startOfDay, endOfDay } from 'date-fns';
import { updateTag } from 'next/cache';
import { serialize } from '@/lib/utils';
import { canAccess, getPlanName } from '@/lib/utils/plan-limits';
import { sendBlockNotifications, sendUnblockNotifications } from '@/lib/notifications/block-notifications';
import type { ActionResult, IScheduleBlockSerialized } from '@/types';

/**
 * Obtener el ID del profesional autenticado.
 * Usado por el calendario profesional para pasar al ScheduleBlockDialog.
 */
export async function getMyProfessionalId(): Promise<ActionResult<string>> {
    const user = await requireAuth();
    if (user.role !== 'professional') {
        return { success: false, error: 'Acceso no autorizado' };
    }

    try {
        await connectDB();
        const professional = await Professional.findOne({ userId: user.id }, { _id: 1 }).lean();
        if (!professional) {
            return { success: false, error: 'Perfil profesional no encontrado' };
        }
        return { success: true, data: professional._id.toString() };
    } catch (error) {
        console.error('Error obteniendo ID profesional:', error);
        return { success: false, error: 'Error al obtener perfil profesional' };
    }
}

/**
 * Calcular rango de fechas según el tipo de bloqueo.
 */
function calculateDateRange(blockType: string, startDateStr: string): { start: Date; end: Date | null } {
    const start = startOfDay(parseISO(startDateStr));

    switch (blockType) {
        case 'day':
            return { start, end: endOfDay(start) };
        case 'week':
            return { start, end: endOfDay(addDays(start, 6)) };
        case 'month':
            return { start, end: endOfDay(addDays(addMonths(start, 1), -1)) };
        case 'full':
            return { start, end: null };
        default:
            return { start, end: endOfDay(start) };
    }
}

/**
 * Query para verificar traslape de bloques.
 */
function overlapQuery(professionalId: string, startDate: Date, endDate: Date | null) {
    const baseQuery: Record<string, unknown> = {
        professionalId,
        isActive: true,
    };

    if (endDate) {
        baseQuery.$or = [
            // Bloqueo 'full' existente que empieza antes del fin
            { endDate: null, startDate: { $lte: endDate } },
            // Bloqueo con rango que se traslapa
            { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ];
    } else {
        // El nuevo bloqueo es 'full' — se traslapa con cualquier bloqueo activo
        baseQuery.$or = [
            { endDate: null },
            { endDate: { $gte: startDate } },
        ];
    }

    return baseQuery;
}

/**
 * Crear un bloqueo de agenda.
 * Auto-cancela citas existentes en el rango y notifica a los involucrados.
 */
export async function createScheduleBlock(
    formData: FormData
): Promise<ActionResult<{ blockId: string; cancelledCount: number }>> {
    const user = await requireAuth();

    const rawData = {
        professionalId: formData.get('professionalId') as string,
        blockType: formData.get('blockType') as string,
        startDate: formData.get('startDate') as string,
        reason: formData.get('reason') as string,
    };

    const parsed = createScheduleBlockSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Obtener profesional
        const professional = await Professional.findById(parsed.data.professionalId).lean();
        if (!professional) {
            return { success: false, error: 'Profesional no encontrado' };
        }

        // Verificar autorización por rol y restricción por plan
        if (user.role === 'admin') {
            const business = await getUserBusiness();
            if (!business || professional.businessId.toString() !== business._id.toString()) {
                return { success: false, error: 'No tienes permiso para bloquear la agenda de este profesional' };
            }
            if (!canAccess(business.subscriptionPlan, 'scheduleBlocks')) {
                return {
                    success: false,
                    error: `El bloqueo de agenda requiere el plan ${getPlanName('professional')}. Actualiza tu suscripción para acceder.`,
                };
            }
        } else if (user.role === 'professional') {
            if (professional.userId.toString() !== user.id) {
                return { success: false, error: 'Solo puedes bloquear tu propia agenda' };
            }
            // Verificar plan del negocio del profesional
            const { default: Business } = await import('@/lib/db/models/business');
            const business = await Business.findById(professional.businessId).lean();
            if (business && !canAccess(business.subscriptionPlan, 'scheduleBlocks')) {
                return {
                    success: false,
                    error: `El bloqueo de agenda requiere el plan ${getPlanName('professional')}. Contacta al administrador de tu negocio.`,
                };
            }
        } else {
            return { success: false, error: 'No tienes permiso para bloquear agendas' };
        }

        // Calcular rango de fechas
        const { start, end } = calculateDateRange(parsed.data.blockType, parsed.data.startDate);

        // Verificar bloqueo duplicado
        const existingBlock = await ScheduleBlock.findOne(overlapQuery(parsed.data.professionalId, start, end));
        if (existingBlock) {
            return { success: false, error: 'Ya existe un bloqueo activo que se traslapa con este periodo' };
        }

        // Crear bloqueo
        const block = await ScheduleBlock.create({
            professionalId: parsed.data.professionalId,
            businessId: professional.businessId,
            blockType: parsed.data.blockType,
            startDate: start,
            endDate: end,
            reason: parsed.data.reason,
            createdBy: user.id,
        });

        // Buscar citas afectadas
        const appointmentQuery: Record<string, unknown> = {
            professionalId: parsed.data.professionalId,
            status: { $nin: ['cancelled', 'no-show'] },
        };

        if (end) {
            appointmentQuery.date = { $gte: startOfDay(start), $lte: endOfDay(end) };
        } else {
            // Bloqueo 'full': todas las citas desde startDate en adelante
            appointmentQuery.date = { $gte: startOfDay(start) };
        }

        const affectedAppointments = await Appointment.find(appointmentQuery)
            .populate('clientId', 'name email userId')
            .populate('serviceId', 'name')
            .populate('professionalId', 'displayName userId')
            .lean();

        // Auto-cancelar citas
        const appointmentIds = affectedAppointments.map((apt) => apt._id);
        let cancelledCount = 0;

        if (appointmentIds.length > 0) {
            const result = await Appointment.updateMany(
                { _id: { $in: appointmentIds } },
                {
                    status: 'cancelled',
                    cancellationReason: `Agenda bloqueada: ${parsed.data.reason}`,
                },
            );
            cancelledCount = result.modifiedCount;
        }

        updateTag('dashboard-metrics');

        // Notificaciones fire-and-forget
        const profData = affectedAppointments[0]?.professionalId as unknown as { displayName: string; userId?: { toString(): string } } | undefined;

        sendBlockNotifications({
            blockId: block._id.toString(),
            businessId: professional.businessId.toString(),
            professionalName: profData?.displayName || professional.displayName,
            blockType: parsed.data.blockType,
            startDate: start,
            endDate: end,
            reason: parsed.data.reason,
            actorId: user.id!,
            actorRole: user.role!,
            professionalUserId: professional.userId.toString(),
            affectedAppointments: affectedAppointments.map((apt) => {
                const client = apt.clientId as unknown as { name: string; email: string; userId?: { toString(): string } };
                const service = apt.serviceId as unknown as { name: string };
                return {
                    appointmentId: apt._id.toString(),
                    clientName: client?.name || 'Cliente',
                    clientEmail: client?.email || '',
                    clientUserId: client?.userId?.toString(),
                    serviceName: service?.name || 'Servicio',
                    date: apt.date,
                    startTime: apt.startTime,
                };
            }),
        });

        return {
            success: true,
            data: { blockId: block._id.toString(), cancelledCount },
        };
    } catch (error) {
        console.error('Error creando bloqueo de agenda:', error);
        return { success: false, error: 'Error al bloquear la agenda' };
    }
}

/**
 * Desbloquear (desactivar) un bloqueo de agenda existente.
 */
export async function removeScheduleBlock(
    formData: FormData
): Promise<ActionResult> {
    const user = await requireAuth();

    const rawData = {
        blockId: formData.get('blockId') as string,
    };

    const parsed = removeScheduleBlockSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const block = await ScheduleBlock.findById(parsed.data.blockId);
        if (!block || !block.isActive) {
            return { success: false, error: 'Bloqueo no encontrado o ya desactivado' };
        }

        const professional = await Professional.findById(block.professionalId).lean();
        if (!professional) {
            return { success: false, error: 'Profesional no encontrado' };
        }

        // Verificar autorización
        if (user.role === 'admin') {
            const business = await getUserBusiness();
            if (!business || professional.businessId.toString() !== business._id.toString()) {
                return { success: false, error: 'No tienes permiso para desbloquear esta agenda' };
            }
        } else if (user.role === 'professional') {
            if (professional.userId.toString() !== user.id) {
                return { success: false, error: 'Solo puedes desbloquear tu propia agenda' };
            }
        } else {
            return { success: false, error: 'No tienes permiso para desbloquear agendas' };
        }

        block.isActive = false;
        await block.save();

        updateTag('dashboard-metrics');

        // Notificaciones fire-and-forget
        sendUnblockNotifications({
            blockId: block._id.toString(),
            businessId: professional.businessId.toString(),
            professionalName: professional.displayName,
            actorId: user.id!,
            actorRole: user.role!,
            professionalUserId: professional.userId.toString(),
        });

        return { success: true };
    } catch (error) {
        console.error('Error desbloqueando agenda:', error);
        return { success: false, error: 'Error al desbloquear la agenda' };
    }
}

/**
 * Obtener bloques activos del negocio del admin por rango de fechas.
 */
export async function getScheduleBlocks(
    professionalId: string | undefined,
    startDate: string,
    endDate: string,
): Promise<ActionResult<IScheduleBlockSerialized[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const start = parseISO(startDate);
        const end = parseISO(endDate);

        const query: Record<string, unknown> = {
            businessId: business._id,
            isActive: true,
            $or: [
                { endDate: null, startDate: { $lte: endOfDay(end) } },
                { startDate: { $lte: endOfDay(end) }, endDate: { $gte: startOfDay(start) } },
            ],
        };

        if (professionalId) {
            query.professionalId = professionalId;
        }

        const blocks = await ScheduleBlock.find(query)
            .sort({ startDate: 1 })
            .lean();

        return { success: true, data: serialize(blocks) as unknown as IScheduleBlockSerialized[] };
    } catch (error) {
        console.error('Error obteniendo bloques:', error);
        return { success: false, error: 'Error al obtener bloques de agenda' };
    }
}

/**
 * Obtener bloques activos del profesional autenticado.
 */
export async function getProfessionalBlocks(
    startDate: string,
    endDate: string,
): Promise<ActionResult<IScheduleBlockSerialized[]>> {
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

        const start = parseISO(startDate);
        const end = parseISO(endDate);

        const blocks = await ScheduleBlock.find({
            professionalId: professional._id,
            isActive: true,
            $or: [
                { endDate: null, startDate: { $lte: endOfDay(end) } },
                { startDate: { $lte: endOfDay(end) }, endDate: { $gte: startOfDay(start) } },
            ],
        })
            .sort({ startDate: 1 })
            .lean();

        return { success: true, data: serialize(blocks) as unknown as IScheduleBlockSerialized[] };
    } catch (error) {
        console.error('Error obteniendo bloques del profesional:', error);
        return { success: false, error: 'Error al obtener bloques de agenda' };
    }
}

/**
 * Obtener citas que serían afectadas por un bloqueo (preview).
 */
export async function getAffectedAppointments(
    professionalId: string,
    blockType: string,
    startDateStr: string,
): Promise<ActionResult<{ clientName: string; serviceName: string; date: string; startTime: string }[]>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const professional = await Professional.findById(professionalId).lean();
        if (!professional) {
            return { success: false, error: 'Profesional no encontrado' };
        }

        // Verificar autorización
        if (user.role === 'admin') {
            const business = await getUserBusiness();
            if (!business || professional.businessId.toString() !== business._id.toString()) {
                return { success: false, error: 'No tienes permiso' };
            }
        } else if (user.role === 'professional') {
            if (professional.userId.toString() !== user.id) {
                return { success: false, error: 'No tienes permiso' };
            }
        } else {
            return { success: false, error: 'No tienes permiso' };
        }

        const { start, end } = calculateDateRange(blockType, startDateStr);

        const query: Record<string, unknown> = {
            professionalId,
            status: { $nin: ['cancelled', 'no-show'] },
        };

        if (end) {
            query.date = { $gte: startOfDay(start), $lte: endOfDay(end) };
        } else {
            query.date = { $gte: startOfDay(start) };
        }

        const appointments = await Appointment.find(query)
            .populate('clientId', 'name')
            .populate('serviceId', 'name')
            .sort({ date: 1, startTime: 1 })
            .lean();

        const data = appointments.map((apt) => {
            const client = apt.clientId as unknown as { name: string } | null;
            const service = apt.serviceId as unknown as { name: string } | null;
            return {
                clientName: client?.name || 'Cliente',
                serviceName: service?.name || 'Servicio',
                date: apt.date.toISOString(),
                startTime: apt.startTime,
            };
        });

        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo citas afectadas:', error);
        return { success: false, error: 'Error al obtener citas afectadas' };
    }
}
