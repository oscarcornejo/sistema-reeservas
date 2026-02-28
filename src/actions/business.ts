/**
 * @fileoverview Server Actions de Configuración del Negocio.
 * Lectura y actualización de datos del negocio (solo admin).
 */

'use server';

import { updateTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { Business } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import {
    businessSettingsSchema,
    businessLocationSchema,
    workingHoursSchema,
    businessPreferencesSchema,
} from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import type { ActionResult, IBusiness, WorkingHour } from '@/types';

/**
 * Obtener la configuración completa del negocio del admin autenticado.
 */
export async function getBusinessSettings(): Promise<ActionResult<IBusiness>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    return { success: true, data: business };
}

/**
 * Actualizar información general del negocio (nombre, descripción, categoría).
 */
export async function updateBusinessSettings(
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        name: formData.get('name') as string,
        description: (formData.get('description') as string) || undefined,
        category: formData.get('category') as string,
    };

    const parsed = businessSettingsSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        await Business.findOneAndUpdate(
            { _id: business._id },
            parsed.data,
            { new: true }
        );

        updateTag(`business-${business._id}`);
        updateTag('public-services');

        return { success: true };
    } catch (error) {
        console.error('Error actualizando configuración general:', error);
        return { success: false, error: 'Error al actualizar la configuración' };
    }
}

/**
 * Actualizar ubicación y contacto del negocio.
 */
export async function updateBusinessLocation(
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        state: formData.get('state') as string,
        country: formData.get('country') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string,
        website: (formData.get('website') as string) || '',
        latitude: formData.get('latitude') ? Number(formData.get('latitude')) : undefined,
        longitude: formData.get('longitude') ? Number(formData.get('longitude')) : undefined,
    };

    const parsed = businessLocationSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const updateData: Record<string, unknown> = {
            address: parsed.data.address,
            city: parsed.data.city,
            state: parsed.data.state,
            country: parsed.data.country,
            phone: parsed.data.phone,
            email: parsed.data.email,
            website: parsed.data.website || undefined,
        };

        if (parsed.data.latitude != null && parsed.data.longitude != null) {
            updateData.location = {
                type: 'Point',
                coordinates: [parsed.data.longitude, parsed.data.latitude],
            };
        }

        await Business.findOneAndUpdate(
            { _id: business._id },
            updateData,
            { new: true }
        );

        updateTag(`business-${business._id}`);
        updateTag('public-services');

        return { success: true };
    } catch (error) {
        console.error('Error actualizando ubicación:', error);
        return { success: false, error: 'Error al actualizar la ubicación' };
    }
}

/**
 * Actualizar horarios de trabajo del negocio.
 */
export async function updateWorkingHours(
    hours: WorkingHour[]
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const parsed = workingHoursSchema.safeParse(hours);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        await Business.findOneAndUpdate(
            { _id: business._id },
            { workingHours: serialize(parsed.data) },
            { new: true }
        );

        updateTag(`business-${business._id}`);

        return { success: true };
    } catch (error) {
        console.error('Error actualizando horarios:', error);
        return { success: false, error: 'Error al actualizar los horarios' };
    }
}

/**
 * Actualizar preferencias de pago y publicación del negocio.
 */
export async function updateBusinessPreferences(
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const rawData = {
        timezone: formData.get('timezone') as string,
        currency: formData.get('currency') as string,
        allowOnlinePayments: formData.get('allowOnlinePayments') === 'true',
        requirePaymentUpfront: formData.get('requirePaymentUpfront') === 'true',
        cancellationPolicy: (formData.get('cancellationPolicy') as string) || undefined,
        isPublished: formData.get('isPublished') === 'true',
    };

    const parsed = businessPreferencesSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        await Business.findOneAndUpdate(
            { _id: business._id },
            parsed.data,
            { new: true }
        );

        updateTag(`business-${business._id}`);
        updateTag('public-services');

        return { success: true };
    } catch (error) {
        console.error('Error actualizando preferencias:', error);
        return { success: false, error: 'Error al actualizar las preferencias' };
    }
}
