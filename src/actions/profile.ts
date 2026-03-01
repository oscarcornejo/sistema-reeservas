/**
 * @fileoverview Server Actions de Perfil de usuario.
 * Lectura y actualización de datos personales, contraseña y avatar (todos los roles).
 */

'use server';

import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { connectDB } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth/dal';
import { profileSchema, changePasswordSchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { auditLogger } from '@/lib/logger';
import { auditLog } from '@/lib/logger/audit';
import type { ActionResult, UserRole, SupportedLocale } from '@/types';

/** Rounds de bcrypt para hashing */
const SALT_ROUNDS = 12;

/** Configurar Cloudinary (lazy, una sola vez) */
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

/** Datos seguros del perfil de usuario */
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
    preferredLocale: SupportedLocale;
    createdAt: string;
}

/**
 * Obtener el perfil del usuario autenticado.
 */
export async function getProfile(): Promise<ActionResult<UserProfile>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const dbUser = await User.findById(user.id)
            .select('name email phone role avatar preferredLocale createdAt')
            .lean();

        if (!dbUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        const serialized = serialize(dbUser);
        const profile: UserProfile = {
            id: serialized._id?.toString() ?? user.id,
            name: serialized.name,
            email: serialized.email,
            phone: serialized.phone,
            role: serialized.role,
            avatar: serialized.avatar,
            preferredLocale: serialized.preferredLocale,
            createdAt: serialized.createdAt?.toString(),
        };

        return { success: true, data: profile };
    } catch (error) {
        auditLogger.error('Error obteniendo perfil', error);
        return { success: false, error: 'Error al obtener el perfil' };
    }
}

/**
 * Actualizar el perfil del usuario autenticado.
 */
export async function updateProfile(
    formData: FormData
): Promise<ActionResult> {
    const user = await requireAuth();

    const rawData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        preferredLocale: formData.get('preferredLocale') as string,
    };

    const parsed = profileSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const updateData: Record<string, unknown> = {
            name: parsed.data.name,
            preferredLocale: parsed.data.preferredLocale,
        };

        // Si phone está vacío, eliminarlo del documento
        const unsetData: Record<string, 1> = {};
        if (parsed.data.phone && parsed.data.phone.length > 0) {
            updateData.phone = parsed.data.phone;
        } else {
            unsetData.phone = 1;
        }

        const update: Record<string, unknown> = { $set: updateData };
        if (Object.keys(unsetData).length > 0) {
            update.$unset = unsetData;
        }

        const updated = await User.findByIdAndUpdate(user.id, update, { new: true });

        if (!updated) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        auditLog('profile.update', { userId: user.id, email: user.email });
        return { success: true };
    } catch (error) {
        auditLogger.error('Error actualizando perfil', error);
        return { success: false, error: 'Error al actualizar el perfil' };
    }
}

/**
 * Cambiar la contraseña del usuario autenticado.
 * Verifica la contraseña actual antes de actualizar.
 */
export async function changePassword(
    formData: FormData
): Promise<ActionResult> {
    const user = await requireAuth();

    const rawData = {
        currentPassword: formData.get('currentPassword') as string,
        newPassword: formData.get('newPassword') as string,
        confirmPassword: formData.get('confirmPassword') as string,
    };

    const parsed = changePasswordSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Obtener usuario con password (select: false por defecto)
        const dbUser = await User.findById(user.id).select('+password');
        if (!dbUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Verificar contraseña actual
        const isValid = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
        if (!isValid) {
            auditLog('password.change', { userId: user.id, email: user.email, reason: 'Contraseña actual incorrecta' });
            return { success: false, error: 'La contraseña actual es incorrecta' };
        }

        // Hashear y guardar nueva contraseña
        const hashedPassword = await bcrypt.hash(parsed.data.newPassword, SALT_ROUNDS);
        dbUser.password = hashedPassword;
        await dbUser.save();

        auditLog('password.change', { userId: user.id, email: user.email });
        return { success: true };
    } catch (error) {
        auditLogger.error('Error cambiando contraseña', error);
        return { success: false, error: 'Error al cambiar la contraseña' };
    }
}

/** Tamaño máximo de avatar: 5 MB */
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
/** Tipos MIME permitidos */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Actualizar el avatar del usuario.
 * Sube la imagen a Cloudinary y guarda la URL.
 */
export async function updateAvatar(
    formData: FormData
): Promise<ActionResult<{ avatarUrl: string }>> {
    const user = await requireAuth();

    const file = formData.get('avatar') as File | null;
    if (!file || file.size === 0) {
        return { success: false, error: 'No se seleccionó ninguna imagen' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return { success: false, error: 'Formato no permitido. Usa JPG, PNG o WebP' };
    }

    if (file.size > MAX_AVATAR_SIZE) {
        return { success: false, error: 'La imagen no puede superar 5 MB' };
    }

    try {
        await connectDB();
        configureCloudinary();

        // Convertir File a base64 data URI para Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Subir a Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'turnopro/avatars',
            public_id: `user_${user.id}`,
            overwrite: true,
            transformation: [
                { width: 256, height: 256, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' },
            ],
        });

        // Guardar URL en BD
        await User.findByIdAndUpdate(user.id, {
            $set: { avatar: uploadResult.secure_url },
        });

        auditLog('avatar.update', { userId: user.id, email: user.email });
        return { success: true, data: { avatarUrl: uploadResult.secure_url } };
    } catch (error) {
        auditLogger.error('Error actualizando avatar', error);
        return { success: false, error: 'Error al subir la imagen' };
    }
}

/**
 * Eliminar el avatar del usuario.
 */
export async function removeAvatar(): Promise<ActionResult> {
    const user = await requireAuth();

    try {
        await connectDB();
        configureCloudinary();

        // Intentar eliminar de Cloudinary (no falla si no existe)
        try {
            await cloudinary.uploader.destroy(`turnopro/avatars/user_${user.id}`);
        } catch {
            // Ignorar error de Cloudinary si el recurso no existe
        }

        await User.findByIdAndUpdate(user.id, {
            $unset: { avatar: 1 },
        });

        auditLog('avatar.remove', { userId: user.id, email: user.email });
        return { success: true };
    } catch (error) {
        auditLogger.error('Error eliminando avatar', error);
        return { success: false, error: 'Error al eliminar la imagen' };
    }
}
