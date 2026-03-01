/**
 * @fileoverview Server Actions de Categorías de Servicio.
 * CRUD para gestión de categorías de servicio del negocio (solo admin).
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { ServiceCategory, Service } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import { serviceCategorySchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { canAccess, getPlanName } from '@/lib/utils/plan-limits';
import type { ActionResult, IServiceCategory } from '@/types';

/**
 * Obtener todas las categorías activas del negocio.
 */
export async function getServiceCategories(): Promise<ActionResult<IServiceCategory[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const categories = await ServiceCategory.find({
            businessId: business._id,
            isActive: true,
        })
            .sort({ order: 1 })
            .lean();

        return { success: true, data: serialize(categories) as IServiceCategory[] };
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        return { success: false, error: 'Error al obtener categorías' };
    }
}

/**
 * Crear una nueva categoría de servicio.
 */
export async function createServiceCategory(
    formData: FormData
): Promise<ActionResult<{ categoryId: string }>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    if (!canAccess(business.subscriptionPlan, 'categories')) {
        return {
            success: false,
            error: `Las categorías personalizadas requieren el plan ${getPlanName('professional')}. Actualiza tu suscripción para acceder.`,
        };
    }

    const rawData = {
        name: formData.get('name') as string,
    };

    const parsed = serviceCategorySchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar duplicado (mismo nombre + mismo negocio + activa)
        const existing = await ServiceCategory.findOne({
            businessId: business._id,
            name: parsed.data.name,
            isActive: true,
        });

        if (existing) {
            return { success: false, error: 'Ya existe una categoría con ese nombre' };
        }

        // Auto-incrementar order
        const lastCategory = await ServiceCategory.findOne({ businessId: business._id, isActive: true })
            .sort({ order: -1 })
            .select('order');

        const category = await ServiceCategory.create({
            ...parsed.data,
            businessId: business._id,
            order: (lastCategory?.order ?? 0) + 1,
        });

        return { success: true, data: { categoryId: category._id.toString() } };
    } catch (error) {
        console.error('Error creando categoría:', error);
        return { success: false, error: 'Error al crear la categoría' };
    }
}

/**
 * Actualizar una categoría de servicio existente.
 * Si el nombre cambia, actualiza los servicios que usan esa categoría.
 */
export async function updateServiceCategory(
    categoryId: string,
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        name: formData.get('name') as string,
    };

    const parsed = serviceCategorySchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Obtener categoría actual
        const current = await ServiceCategory.findOne({
            _id: categoryId,
            businessId: business._id,
            isActive: true,
        });

        if (!current) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        // Verificar duplicado excluyendo la actual
        const duplicate = await ServiceCategory.findOne({
            businessId: business._id,
            name: parsed.data.name,
            isActive: true,
            _id: { $ne: categoryId },
        });

        if (duplicate) {
            return { success: false, error: 'Ya existe una categoría con ese nombre' };
        }

        const oldName = current.name;

        // Actualizar la categoría
        await ServiceCategory.findByIdAndUpdate(categoryId, parsed.data);

        // Cascade rename: actualizar servicios que usan la categoría anterior
        if (oldName !== parsed.data.name) {
            await Service.updateMany(
                { businessId: business._id, category: oldName },
                { category: parsed.data.name }
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        return { success: false, error: 'Error al actualizar la categoría' };
    }
}

/**
 * Eliminar (soft delete) una categoría de servicio.
 * Rechaza si hay servicios activos usando esa categoría.
 */
export async function deleteServiceCategory(
    categoryId: string
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const category = await ServiceCategory.findOne({
            _id: categoryId,
            businessId: business._id,
            isActive: true,
        });

        if (!category) {
            return { success: false, error: 'Categoría no encontrada' };
        }

        // Guard: verificar si hay servicios activos con esta categoría
        const serviceCount = await Service.countDocuments({
            businessId: business._id,
            category: category.name,
            isActive: true,
        });

        if (serviceCount > 0) {
            return {
                success: false,
                error: `No se puede eliminar: hay ${serviceCount} servicio${serviceCount > 1 ? 's' : ''} usando esta categoría`,
            };
        }

        // Soft delete
        await ServiceCategory.findByIdAndUpdate(categoryId, { isActive: false });

        return { success: true };
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        return { success: false, error: 'Error al eliminar la categoría' };
    }
}
