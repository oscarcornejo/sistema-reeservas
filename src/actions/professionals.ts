/**
 * @fileoverview Server Actions de Profesionales.
 * CRUD para gestión de profesionales del negocio (solo admin).
 * Flujo: crear User con rol professional + crear documento Professional vinculado.
 */

'use server';

import { updateTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { User, Professional } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import { professionalSchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { getPlanLimits, getPlanName } from '@/lib/utils/plan-limits';
import type { ActionResult, IProfessional } from '@/types';
import bcrypt from 'bcryptjs';

/** Contraseña temporal para profesionales creados por admin */
const DEFAULT_PASSWORD = 'Password123';

/**
 * Crear un nuevo profesional para el negocio.
 * 1. Valida datos del formulario
 * 2. Crea (o reutiliza) un User con rol professional
 * 3. Crea el documento Professional vinculado al negocio
 */
export async function createProfessional(
    formData: FormData
): Promise<ActionResult<{ professionalId: string }>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const specialtiesRaw = (formData.get('specialties') as string) || '';
    const rawData = {
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        specialties: specialtiesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        bio: (formData.get('bio') as string) || undefined,
    };

    const parsed = professionalSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        // Verificar límite de profesionales según el plan
        const limits = getPlanLimits(business.subscriptionPlan);
        if (limits.maxProfessionals !== Infinity) {
            const activeCount = await Professional.countDocuments({
                businessId: business._id,
                isActive: true,
            });
            if (activeCount >= limits.maxProfessionals) {
                const planName = getPlanName(business.subscriptionPlan);
                return {
                    success: false,
                    error: `Tu plan ${planName} permite hasta ${limits.maxProfessionals} profesional${limits.maxProfessionals > 1 ? 'es' : ''}. Actualiza tu plan para agregar más.`,
                };
            }
        }

        // Buscar si ya existe un usuario con ese email
        let user = await User.findOne({ email: parsed.data.email });

        if (user) {
            // Si el usuario existe pero no es professional, no podemos reasignarlo
            if (user.role !== 'professional') {
                return {
                    success: false,
                    error: 'Ya existe un usuario con ese email y un rol diferente',
                };
            }

            // Verificar que no esté ya vinculado a este negocio
            const existingPro = await Professional.findOne({
                userId: user._id,
                businessId: business._id,
            });
            if (existingPro) {
                return {
                    success: false,
                    error: 'Este profesional ya está registrado en tu negocio',
                };
            }
        } else {
            // Crear usuario con contraseña temporal
            const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
            user = await User.create({
                email: parsed.data.email,
                password: hashedPassword,
                name: parsed.data.name,
                role: 'professional',
            });
        }

        // Crear documento Professional
        const professional = await Professional.create({
            userId: user._id,
            businessId: business._id,
            displayName: parsed.data.name,
            specialties: parsed.data.specialties,
            bio: parsed.data.bio,
        });

        updateTag('professionals');
        updateTag('public-professionals');
        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);

        return {
            success: true,
            data: { professionalId: professional._id.toString() },
        };
    } catch (error) {
        console.error('Error creando profesional:', error);
        return { success: false, error: 'Error al crear el profesional' };
    }
}

/**
 * Obtener todos los profesionales del negocio.
 */
export async function getBusinessProfessionals(): Promise<
    ActionResult<IProfessional[]>
> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const professionals = await Professional.find({
            businessId: business._id,
        })
            .sort({ createdAt: -1 })
            .lean();

        return {
            success: true,
            data: serialize(professionals) as IProfessional[],
        };
    } catch (error) {
        console.error('Error obteniendo profesionales:', error);
        return { success: false, error: 'Error al obtener profesionales' };
    }
}

/**
 * Actualizar un profesional existente.
 */
export async function updateProfessional(
    professionalId: string,
    formData: FormData
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    const specialtiesRaw = (formData.get('specialties') as string) || '';
    const rawData = {
        email: formData.get('email') as string,
        name: formData.get('name') as string,
        specialties: specialtiesRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        bio: (formData.get('bio') as string) || undefined,
    };

    const parsed = professionalSchema.safeParse(rawData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0].message };
    }

    try {
        await connectDB();

        const professional = await Professional.findOneAndUpdate(
            { _id: professionalId, businessId: business._id },
            {
                displayName: parsed.data.name,
                specialties: parsed.data.specialties,
                bio: parsed.data.bio,
            },
            { new: true }
        );

        if (!professional) {
            return { success: false, error: 'Profesional no encontrado' };
        }

        updateTag('professionals');
        updateTag('public-professionals');
        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);

        return { success: true };
    } catch (error) {
        console.error('Error actualizando profesional:', error);
        return { success: false, error: 'Error al actualizar' };
    }
}

/**
 * Eliminar (desactivar) un profesional.
 */
export async function deleteProfessional(
    professionalId: string
): Promise<ActionResult> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        await Professional.findOneAndUpdate(
            { _id: professionalId, businessId: business._id },
            { isActive: false }
        );

        updateTag('professionals');
        updateTag('public-professionals');
        updateTag(`business-${business._id}`);
        updateTag(`business-slug-${business.slug}`);

        return { success: true };
    } catch (error) {
        console.error('Error eliminando profesional:', error);
        return { success: false, error: 'Error al eliminar' };
    }
}
