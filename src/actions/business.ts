/**
 * @fileoverview Server Actions de Configuración del Negocio.
 * Lectura y actualización de datos del negocio (solo admin).
 */

'use server';

import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { revalidatePath, updateTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { Business } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import {
    businessSettingsSchema,
    businessLocationSchema,
    workingHoursSchema,
    businessPreferencesSchema,
    businessThemeSchema,
} from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import type { ActionResult, IBusiness, WorkingHour } from '@/types';

/** Configurar Cloudinary (lazy) */
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const MAX_GALLERY_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');
        updateTag('public-services');
        revalidatePath(`/negocio/${business.slug}`);

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
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');
        updateTag('public-services');
        revalidatePath(`/negocio/${business.slug}`);

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
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');
        revalidatePath(`/negocio/${business.slug}`);

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
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');
        updateTag('public-services');
        revalidatePath(`/negocio/${business.slug}`);

        return { success: true };
    } catch (error) {
        console.error('Error actualizando preferencias:', error);
        return { success: false, error: 'Error al actualizar las preferencias' };
    }
}

/**
 * Actualizar el tema visual del negocio (página pública).
 * Usa el driver nativo de MongoDB (bypasea Mongoose strict mode
 * que puede filtrar el campo `theme` con modelos HMR-cacheados).
 */
export async function updateBusinessTheme(
    themeId: string
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const parsed = businessThemeSchema.safeParse({ theme: themeId });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const oid = new mongoose.Types.ObjectId(String(business._id));
        const db = mongoose.connection.db!;
        await db.collection('businesses').updateOne(
            { _id: oid },
            { $set: { theme: parsed.data.theme } }
        );

        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');
        revalidatePath(`/negocio/${business.slug}`);

        return { success: true };
    } catch (error) {
        console.error('Error actualizando tema:', error);
        return { success: false, error: 'Error al actualizar el tema' };
    }
}

// =============================================================================
// Galería de imágenes
// =============================================================================

/**
 * Subir una imagen a la galería del negocio.
 * Sube a Cloudinary y agrega la URL al array `gallery`.
 */
export async function addGalleryImage(
    formData: FormData
): Promise<ActionResult<{ imageUrl: string }>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const currentCount = business.gallery?.length ?? 0;
    if (currentCount >= MAX_GALLERY_IMAGES) {
        return { success: false, error: `La galería no puede tener más de ${MAX_GALLERY_IMAGES} imágenes` };
    }

    const file = formData.get('image') as File | null;
    if (!file || file.size === 0) {
        return { success: false, error: 'No se seleccionó ninguna imagen' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, error: 'Formato no permitido. Usa JPG, PNG o WebP' };
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return { success: false, error: 'La imagen no puede superar 5 MB' };
    }

    try {
        await connectDB();
        configureCloudinary();

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const businessId = String(business._id);
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: `turnopro/galleries/${businessId}`,
            transformation: [
                { width: 1200, height: 900, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        });

        await Business.findByIdAndUpdate(business._id, {
            $push: { gallery: uploadResult.secure_url },
        });

        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');

        return { success: true, data: { imageUrl: uploadResult.secure_url } };
    } catch (error) {
        console.error('Error subiendo imagen de galería:', error);
        return { success: false, error: 'Error al subir la imagen' };
    }
}

/**
 * Eliminar una imagen de la galería del negocio.
 * Remueve de Cloudinary y del array `gallery`.
 */
export async function removeGalleryImage(
    imageUrl: string
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    if (!business.gallery?.includes(imageUrl)) {
        return { success: false, error: 'La imagen no pertenece a este negocio' };
    }

    try {
        await connectDB();
        configureCloudinary();

        // Extraer public_id de la URL de Cloudinary
        const urlParts = imageUrl.split('/upload/');
        if (urlParts[1]) {
            // Remover versión (v1234567890/) y extensión
            const pathAfterUpload = urlParts[1].replace(/^v\d+\//, '');
            const publicId = pathAfterUpload.replace(/\.[^.]+$/, '');
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch {
                // Ignorar si el recurso ya no existe en Cloudinary
            }
        }

        await Business.findByIdAndUpdate(business._id, {
            $pull: { gallery: imageUrl },
        });

        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);
        updateTag('public-business');

        return { success: true };
    } catch (error) {
        console.error('Error eliminando imagen de galería:', error);
        return { success: false, error: 'Error al eliminar la imagen' };
    }
}
