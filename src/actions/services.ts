/**
 * @fileoverview Server Actions de Servicios.
 * CRUD para gestión de servicios del negocio (solo admin).
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Service } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import { serviceSchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { getPlanLimits, getPlanName } from '@/lib/utils/plan-limits';
import type { ActionResult, IService } from '@/types';

/**
 * Crear un nuevo servicio para el negocio.
 */
export async function createService(
    formData: FormData
): Promise<ActionResult<{ serviceId: string }>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string | undefined,
        category: formData.get('category') as string,
        duration: Number(formData.get('duration')),
        price: Number(formData.get('price')),
    };

    const parsed = serviceSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar límite de servicios según el plan
        const limits = getPlanLimits(business.subscriptionPlan);
        if (limits.maxServices !== Infinity) {
            const activeCount = await Service.countDocuments({
                businessId: business._id,
                isActive: true,
            });
            if (activeCount >= limits.maxServices) {
                const planName = getPlanName(business.subscriptionPlan);
                return {
                    success: false,
                    error: `Tu plan ${planName} permite hasta ${limits.maxServices} servicio${limits.maxServices > 1 ? 's' : ''}. Actualiza tu plan para agregar más.`,
                };
            }
        }

        // Obtener el orden del último servicio para posicionar al final
        const lastService = await Service.findOne({ businessId: business._id })
            .sort({ order: -1 })
            .select('order');

        const service = await Service.create({
            ...parsed.data,
            businessId: business._id,
            currency: business.currency,
            order: (lastService?.order ?? 0) + 1,
        });

        return { success: true, data: { serviceId: service._id.toString() } };
    } catch (error) {
        console.error('Error creando servicio:', error);
        return { success: false, error: 'Error al crear el servicio' };
    }
}

/**
 * Obtener todos los servicios del negocio.
 */
export async function getBusinessServices(): Promise<ActionResult<IService[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const services = await Service.find({ businessId: business._id })
            .sort({ order: 1 })
            .lean();

        return { success: true, data: serialize(services) as IService[] };
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return { success: false, error: 'Error al obtener servicios' };
    }
}

/**
 * Obtener servicios públicos de un negocio por slug (para reservas).
 */
export async function getPublicServices(
    businessSlug: string
): Promise<ActionResult<IService[]>> {
    try {
        await connectDB();

        const { default: Business } = await import('@/lib/db/models/business');
        const business = await Business.findOne({
            slug: businessSlug,
            isPublished: true,
        });

        if (!business) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        const services = await Service.find({
            businessId: business._id,
            isActive: true,
        })
            .sort({ order: 1 })
            .lean();

        return { success: true, data: serialize(services) as IService[] };
    } catch (error) {
        console.error('Error obteniendo servicios públicos:', error);
        return { success: false, error: 'Error al obtener servicios' };
    }
}

/**
 * Actualizar un servicio existente.
 */
export async function updateService(
    serviceId: string,
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string | undefined,
        category: formData.get('category') as string,
        duration: Number(formData.get('duration')),
        price: Number(formData.get('price')),
    };

    const parsed = serviceSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const service = await Service.findOneAndUpdate(
            { _id: serviceId, businessId: business._id },
            parsed.data,
            { new: true }
        );

        if (!service) {
            return { success: false, error: 'Servicio no encontrado' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error actualizando servicio:', error);
        return { success: false, error: 'Error al actualizar' };
    }
}

/**
 * Eliminar (desactivar) un servicio.
 */
export async function deleteService(serviceId: string): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        await Service.findOneAndUpdate(
            { _id: serviceId, businessId: business._id },
            { isActive: false }
        );

        return { success: true };
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        return { success: false, error: 'Error al eliminar' };
    }
}
