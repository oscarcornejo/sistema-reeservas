/**
 * @fileoverview Server Actions de Negocios.
 * Listado y eliminación de negocios del admin.
 */

'use server';

import { updateTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import {
    Business,
    Service,
    Professional,
    Client,
    Appointment,
    Subscription,
} from '@/lib/db/models';
import { requireAdmin } from '@/lib/auth/dal';
import { serialize } from '@/lib/utils';
import type { ActionResult, IBusiness } from '@/types';

/**
 * Obtener todos los negocios del admin autenticado.
 */
export async function getAdminBusinesses(): Promise<ActionResult<IBusiness[]>> {
    const user = await requireAdmin();

    try {
        await connectDB();

        const businesses = await Business.find({ adminId: user.id })
            .sort({ createdAt: -1 })
            .lean();

        return { success: true, data: serialize(businesses) as IBusiness[] };
    } catch (error) {
        console.error('Error obteniendo negocios:', error);
        return { success: false, error: 'Error al obtener los negocios' };
    }
}

/**
 * Eliminar un negocio y todos sus datos asociados (cascade delete).
 * Elimina: servicios, profesionales, clientes, citas y suscripciones.
 */
export async function deleteBusiness(
    businessId: string
): Promise<ActionResult> {
    const user = await requireAdmin();

    try {
        await connectDB();

        // Verificar que el negocio pertenece al admin
        const business = await Business.findOne({
            _id: businessId,
            adminId: user.id,
        });

        if (!business) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        // Eliminar todos los datos asociados en paralelo
        await Promise.all([
            Service.deleteMany({ businessId }),
            Professional.deleteMany({ businessId }),
            Client.deleteMany({ businessId }),
            Appointment.deleteMany({ businessId }),
            Subscription.deleteMany({ businessId }),
        ]);

        // Eliminar el negocio
        await Business.findByIdAndDelete(businessId);

        // Invalidar cache
        updateTag(`business-${businessId}`);
        updateTag('public-services');

        return { success: true };
    } catch (error) {
        console.error('Error eliminando negocio:', error);
        return { success: false, error: 'Error al eliminar el negocio' };
    }
}
