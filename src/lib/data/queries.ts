/**
 * @fileoverview Funciones de consulta cacheadas para Server Components.
 * Separadas de Server Actions para poder usar 'use cache'.
 * Reciben IDs como parámetros (no acceden a cookies/headers directamente).
 */

import { cacheLife, cacheTag } from 'next/cache';
import { connectDB } from '@/lib/db/connection';
import { Appointment, Business, Service, Professional, Client } from '@/lib/db/models';
import { startOfDay, endOfDay } from 'date-fns';
import { serialize } from '@/lib/utils';

/**
 * Métricas del dashboard — cacheado por minutos.
 * @param businessId - ID del negocio (se extrae de sesión en el componente padre)
 * @param todayISO - Fecha actual en ISO string (pasada desde fuera para evitar
 *   `new Date()` dentro de `use cache`, que congela el valor al momento del cacheo)
 */
export async function getCachedDashboardMetrics(businessId: string, todayISO: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('dashboard-metrics', `business-${businessId}`);

    await connectDB();

    const today = new Date(todayISO);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [
        todayAppointments,
        upcomingAppointments,
        monthlyRevenueResult,
        totalMonthAppointments,
        completedAppointments,
    ] = await Promise.all([
        Appointment.countDocuments({
            businessId,
            date: { $gte: startOfDay(today), $lte: endOfDay(today) },
            status: { $nin: ['cancelled'] },
        }),
        Appointment.countDocuments({
            businessId,
            date: { $gt: today, $lte: nextWeek },
            status: { $nin: ['cancelled'] },
        }),
        Appointment.aggregate([
            {
                $match: {
                    businessId,
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                    paymentStatus: 'paid',
                },
            },
            { $group: { _id: null, total: { $sum: '$paymentAmount' } } },
        ]),
        Appointment.countDocuments({
            businessId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
        }),
        Appointment.countDocuments({
            businessId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            status: { $in: ['completed', 'confirmed', 'in-progress'] },
        }),
    ]);

    const occupancyRate =
        totalMonthAppointments > 0
            ? Math.round((completedAppointments / totalMonthAppointments) * 100)
            : 0;

    return {
        todayAppointments,
        upcomingAppointments,
        monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
        occupancyRate,
    };
}

/**
 * Servicios públicos de un negocio — cacheado por horas.
 * Ideal para la página de reservas (datos raramente cambian).
 */
export async function getCachedPublicServices(businessSlug: string) {
    'use cache';
    cacheLife('hours');
    cacheTag('public-services', `business-slug-${businessSlug}`);

    await connectDB();

    const business = await Business.findOne({
        slug: businessSlug,
        isPublished: true,
    });

    if (!business) return [];

    const services = await Service.find({
        businessId: business._id,
        isActive: true,
    })
        .sort({ order: 1 })
        .lean();

    return serialize(services);
}

/**
 * Datos públicos de un negocio por slug — cacheado por horas.
 * Excluye campos sensibles (admin, suscripción, mercadopago).
 */
export async function getCachedPublicBusiness(businessSlug: string) {
    'use cache';
    cacheLife('hours');
    cacheTag('public-business', `business-slug-${businessSlug}`);

    await connectDB();

    const business = await Business.findOne({
        slug: businessSlug,
        isPublished: true,
    })
        .select('-adminId -subscriptionStatus -subscriptionPlan -subscriptionExpiresAt -mercadopagoSubscriptionId')
        .lean();

    return business ? serialize(business) : null;
}

/**
 * Profesionales públicos de un negocio por slug — cacheado por horas.
 * Solo incluye profesionales activos con visibilidad pública.
 */
export async function getCachedPublicProfessionals(businessSlug: string) {
    'use cache';
    cacheLife('hours');
    cacheTag('public-professionals', `business-slug-${businessSlug}`);

    await connectDB();

    const business = await Business.findOne({
        slug: businessSlug,
        isPublished: true,
    });

    if (!business) return [];

    const professionals = await Professional.find({
        businessId: business._id,
        isActive: true,
        showInPublicPage: true,
    })
        .select('displayName specialties bio avatar rating totalReviews')
        .sort({ displayName: 1 })
        .lean();

    return serialize(professionals);
}

/**
 * Profesionales activos de un negocio — cacheado por horas.
 */
export async function getCachedBusinessProfessionals(businessId: string) {
    'use cache';
    cacheLife('hours');
    cacheTag('professionals', `business-${businessId}`);

    await connectDB();

    const professionals = await Professional.find({
        businessId,
        isActive: true,
    })
        .sort({ displayName: 1 })
        .lean();

    return serialize(professionals);
}

/**
 * Clientes de un negocio — cacheado por minutos.
 */
export async function getCachedBusinessClients(businessId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('clients', `business-${businessId}`);

    await connectDB();

    const clients = await Client.find({ businessId })
        .sort({ lastVisit: -1 })
        .lean();

    return serialize(clients);
}
