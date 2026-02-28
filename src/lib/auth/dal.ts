/**
 * @fileoverview Data Access Layer (DAL) de autenticación.
 * Funciones helper para verificar sesión y roles desde Server Actions.
 * Patrón: Single Responsibility — cada función valida un aspecto específico.
 */

import { auth } from './auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/connection';
import { Business, Professional, Client } from '@/lib/db/models';
import { serialize } from '@/lib/utils';
import type { UserRole, IBusiness, IProfessional, IClient } from '@/types';

/**
 * Obtener el usuario autenticado actual.
 * Retorna null si no hay sesión activa.
 */
export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user) return null;

    return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        image: session.user.image,
    };
}

/**
 * Exigir autenticación. Redirige al login si no hay sesión.
 * @throws Redirect a /login
 */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

/**
 * Exigir un rol específico. Redirige si el rol no coincide.
 * @param role - Rol requerido
 */
export async function requireRole(role: UserRole) {
    const user = await requireAuth();
    if (user.role !== role) {
        redirect('/');
    }
    return user;
}

/** Exigir rol admin */
export async function requireAdmin() {
    return requireRole('admin');
}

/** Exigir rol profesional */
export async function requireProfessional() {
    return requireRole('professional');
}

/** Exigir rol cliente */
export async function requireClient() {
    return requireRole('client');
}

/**
 * Obtener el negocio del admin actual.
 * Crea la conexión a BD y busca el negocio vinculado.
 *
 * @returns Negocio del admin o null si no existe
 */
export async function getUserBusiness(): Promise<IBusiness | null> {
    const user = await requireAdmin();
    await connectDB();

    const business = await Business.findOne({ adminId: user.id }).lean();
    return business ? serialize(business) as IBusiness : null;
}

/**
 * Obtener el perfil profesional del usuario actual.
 */
export async function getUserProfessionalProfile(): Promise<IProfessional | null> {
    const user = await requireProfessional();
    await connectDB();

    const professional = await Professional.findOne({ userId: user.id }).lean();
    return professional ? serialize(professional) as IProfessional : null;
}

/**
 * Obtener el perfil de cliente del usuario actual en un negocio.
 * @param businessId - ID del negocio (opcional, busca el primero si no se indica)
 */
export async function getUserClientProfile(
    businessId?: string
): Promise<IClient | null> {
    const user = await requireClient();
    await connectDB();

    const query: Record<string, unknown> = { userId: user.id };
    if (businessId) query.businessId = businessId;

    const client = await Client.findOne(query).lean();
    return client ? serialize(client) as IClient : null;
}
