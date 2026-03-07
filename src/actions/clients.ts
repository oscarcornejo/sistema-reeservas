/**
 * @fileoverview Server Actions de Clientes.
 * Detalle, actualización y eliminación de clientes del negocio.
 */

'use server';

import { updateTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { Client, Appointment, Professional } from '@/lib/db/models';
import { requireAuth, getUserBusiness, getUserProfessionalProfile } from '@/lib/auth/dal';
import { updateClientSchema, deleteClientSchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { appLogger } from '@/lib/logger';
import type { ActionResult, IClient } from '@/types';

/**
 * Obtener detalle de un cliente con sus últimas 10 citas.
 * Admins verifican por businessId, profesionales verifican por citas en común.
 */
export async function getClientDetail(
    clientId: string
): Promise<ActionResult<{ client: IClient; appointments: unknown[] }>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const client = await Client.findById(clientId).lean();
        if (!client) {
            return { success: false, error: 'Cliente no encontrado' };
        }

        // Verificar autorización según rol
        if (user.role === 'admin') {
            const business = await getUserBusiness();
            if (!business) {
                return { success: false, error: 'Negocio no encontrado' };
            }
            if (client.businessId.toString() !== business._id.toString()) {
                return { success: false, error: 'No tienes permiso para ver este cliente' };
            }
        } else if (user.role === 'professional') {
            const professional = await getUserProfessionalProfile();
            if (!professional) {
                return { success: false, error: 'Perfil profesional no encontrado' };
            }
            // Verificar que el profesional tenga al menos una cita con este cliente
            const hasAppointment = await Appointment.findOne({
                clientId,
                professionalId: professional._id,
            }).lean();
            if (!hasAppointment) {
                return { success: false, error: 'No tienes permiso para ver este cliente' };
            }
        } else {
            return { success: false, error: 'Acceso no autorizado' };
        }

        // Obtener últimas 10 citas del cliente
        const appointments = await Appointment.find({ clientId })
            .populate('serviceId', 'name duration price')
            .populate('professionalId', 'displayName avatar')
            .sort({ date: -1 })
            .limit(10)
            .lean();

        return {
            success: true,
            data: {
                client: serialize(client) as IClient,
                appointments: serialize(appointments) as unknown[],
            },
        };
    } catch (error) {
        appLogger.error('Error obteniendo detalle del cliente', error);
        return { success: false, error: 'Error al obtener el detalle del cliente' };
    }
}

/**
 * Actualizar datos de un cliente existente.
 * Solo admin del negocio puede modificar clientes.
 */
export async function updateClient(
    formData: FormData
): Promise<ActionResult<{ client: IClient }>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const tagsRaw = formData.get('tags') as string | null;
    let parsedTags: string[] | undefined;
    if (tagsRaw) {
        try {
            parsedTags = JSON.parse(tagsRaw);
        } catch {
            return { success: false, error: 'Formato de etiquetas inválido' };
        }
    }

    const rawData = {
        clientId: formData.get('clientId') as string,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        notes: (formData.get('notes') as string) || undefined,
        tags: parsedTags,
    };

    const parsed = updateClientSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar que el cliente pertenece al negocio
        const existingClient = await Client.findById(parsed.data.clientId).lean();
        if (!existingClient) {
            return { success: false, error: 'Cliente no encontrado' };
        }
        if (existingClient.businessId.toString() !== business._id.toString()) {
            return { success: false, error: 'No tienes permiso para modificar este cliente' };
        }

        const updatedClient = await Client.findByIdAndUpdate(
            parsed.data.clientId,
            {
                name: parsed.data.name,
                phone: parsed.data.phone,
                notes: parsed.data.notes,
                tags: parsed.data.tags,
            },
            { new: true }
        ).lean();

        updateTag('clients');
        updateTag('professional-clients');

        return {
            success: true,
            data: { client: serialize(updatedClient) as IClient },
        };
    } catch (error) {
        appLogger.error('Error actualizando cliente', error);
        return { success: false, error: 'Error al actualizar el cliente' };
    }
}

/**
 * Eliminar un cliente del negocio (hard delete).
 * Solo admin del negocio puede eliminar clientes.
 */
export async function deleteClient(
    formData: FormData
): Promise<ActionResult<null>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        clientId: formData.get('clientId') as string,
    };

    const parsed = deleteClientSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar que el cliente pertenece al negocio
        const client = await Client.findById(parsed.data.clientId).lean();
        if (!client) {
            return { success: false, error: 'Cliente no encontrado' };
        }
        if (client.businessId.toString() !== business._id.toString()) {
            return { success: false, error: 'No tienes permiso para eliminar este cliente' };
        }

        await Client.findByIdAndDelete(parsed.data.clientId);

        updateTag('clients');
        updateTag('professional-clients');

        return { success: true, data: null };
    } catch (error) {
        appLogger.error('Error eliminando cliente', error);
        return { success: false, error: 'Error al eliminar el cliente' };
    }
}
