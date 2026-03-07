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
 * Listado de negocios publicados para la página de búsqueda — cacheado por horas.
 * Retorna solo campos necesarios para las tarjetas de resultado.
 */
export async function getCachedPublishedBusinesses() {
    'use cache';
    cacheLife('hours');
    cacheTag('published-businesses');

    await connectDB();

    const businesses = await Business.find({ isPublished: true })
        .select('name slug category address city gallery workingHours')
        .sort({ createdAt: -1 })
        .lean();

    // Obtener servicios y profesionales para cada negocio en paralelo
    const enriched = await Promise.all(
        businesses.map(async (biz) => {
            const [services, professionals] = await Promise.all([
                Service.find({ businessId: biz._id, isActive: true })
                    .select('name')
                    .sort({ order: 1 })
                    .limit(3)
                    .lean(),
                Professional.find({ businessId: biz._id, isActive: true })
                    .select('rating totalReviews')
                    .lean(),
            ]);

            const totalReviews = professionals.reduce((sum, p) => sum + (p.totalReviews || 0), 0);
            const avgRating = professionals.length > 0
                ? Math.round(
                      (professionals.reduce((sum, p) => sum + (p.rating || 0) * (p.totalReviews || 0), 0) /
                          Math.max(totalReviews, 1)) *
                          10
                  ) / 10
                : 0;

            return {
                ...biz,
                services: services.map((s) => s.name),
                rating: avgRating,
                reviewCount: totalReviews,
            };
        })
    );

    return serialize(enriched);
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
 * Clientes atendidos por un profesional — cacheado por minutos.
 * Extrae clientes únicos de las citas no-canceladas del profesional,
 * con métricas por cliente (visitas, última visita, servicios frecuentes).
 */
export async function getCachedProfessionalClients(professionalId: string, todayISO: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('professional-clients', `professional-${professionalId}`);

    await connectDB();

    const appointments = await Appointment.find({
        professionalId,
        status: { $nin: ['cancelled'] },
    })
        .populate<{ clientId: { _id: string; name: string; email: string; phone?: string; tags?: string[] } }>(
            'clientId', 'name email phone tags'
        )
        .populate<{ serviceId: { _id: string; name: string } }>(
            'serviceId', 'name'
        )
        .sort({ date: -1 })
        .lean();

    // Agrupar por cliente único
    const clientMap = new Map<string, {
        _id: string;
        name: string;
        email: string;
        phone: string;
        tags: string[];
        totalVisits: number;
        lastVisit: string;
        services: Map<string, number>;
    }>();

    const today = new Date(todayISO);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let visitsThisMonth = 0;

    for (const apt of appointments) {
        if (!apt.clientId || typeof apt.clientId === 'string') continue;
        const client = apt.clientId;
        const clientIdStr = String(client._id);
        const serviceName = apt.serviceId && typeof apt.serviceId !== 'string'
            ? apt.serviceId.name : '';

        const aptDate = new Date(apt.date);
        if (aptDate >= startOfMonth && aptDate <= today) {
            visitsThisMonth++;
        }

        const existing = clientMap.get(clientIdStr);
        if (existing) {
            existing.totalVisits++;
            if (serviceName) {
                existing.services.set(serviceName, (existing.services.get(serviceName) || 0) + 1);
            }
        } else {
            const serviceMap = new Map<string, number>();
            if (serviceName) serviceMap.set(serviceName, 1);
            clientMap.set(clientIdStr, {
                _id: clientIdStr,
                name: client.name,
                email: client.email,
                phone: client.phone || '',
                tags: client.tags || [],
                totalVisits: 1,
                lastVisit: apt.date instanceof Date ? apt.date.toISOString() : String(apt.date),
                services: serviceMap,
            });
        }
    }

    // Obtener rating del profesional
    const professional = await Professional.findById(professionalId)
        .select('rating totalReviews')
        .lean();

    const clients = Array.from(clientMap.values()).map((c) => ({
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        tags: c.tags,
        totalVisits: c.totalVisits,
        lastVisit: c.lastVisit,
        // Top 3 servicios más frecuentes
        topServices: Array.from(c.services.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name),
    }));

    return serialize({
        clients,
        metrics: {
            totalClients: clients.length,
            visitsThisMonth,
            rating: professional?.rating ?? 0,
            totalReviews: professional?.totalReviews ?? 0,
        },
    });
}

/**
 * Reportes del profesional — cacheado por minutos.
 * Metricas y lista de citas para un rango de fechas.
 */
export async function getCachedProfessionalReport(
    professionalId: string,
    startDate: string,
    endDate: string,
) {
    'use cache';
    cacheLife('minutes');
    cacheTag('professional-reports', `professional-${professionalId}`);

    await connectDB();

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    const [appointmentsRaw, professional] = await Promise.all([
        Appointment.find({
            professionalId,
            date: { $gte: start, $lte: end },
            status: { $nin: ['cancelled'] },
        })
            .populate<{ serviceId: { _id: string; name: string; price: number } }>(
                'serviceId', 'name price',
            )
            .populate<{ clientId: { _id: string; name: string } }>(
                'clientId', 'name',
            )
            .sort({ date: -1 })
            .lean(),
        Professional.findById(professionalId)
            .select('rating totalReviews')
            .lean(),
    ]);

    // Calcular metricas
    const uniqueClientIds = new Set<string>();
    let totalRevenue = 0;

    for (const apt of appointmentsRaw) {
        if (apt.clientId && typeof apt.clientId !== 'string') {
            uniqueClientIds.add(String(apt.clientId._id));
        }
        if (apt.paymentStatus === 'paid') {
            totalRevenue += apt.paymentAmount || 0;
        }
    }

    const appointments = appointmentsRaw.map((apt) => ({
        _id: String(apt._id),
        date: apt.date instanceof Date ? apt.date.toISOString() : String(apt.date),
        startTime: apt.startTime,
        status: apt.status,
        paymentStatus: apt.paymentStatus,
        paymentAmount: apt.paymentAmount || 0,
        serviceName: apt.serviceId && typeof apt.serviceId !== 'string' ? apt.serviceId.name : '—',
        clientName: apt.clientId && typeof apt.clientId !== 'string' ? apt.clientId.name : '—',
    }));

    return serialize({
        metrics: {
            uniqueClients: uniqueClientIds.size,
            totalAppointments: appointmentsRaw.length,
            totalRevenue,
            rating: professional?.rating ?? 0,
            totalReviews: professional?.totalReviews ?? 0,
        },
        appointments,
    });
}

/**
 * Clientes de un negocio — cacheado por minutos.
 * Enriquece con visitas reales calculadas desde las citas (no depende de
 * Client.totalVisits/lastVisit que pueden estar desactualizados).
 */
export async function getCachedBusinessClients(businessId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag('clients', `business-${businessId}`);

    await connectDB();

    const [clients, appointments] = await Promise.all([
        Client.find({ businessId }).lean(),
        Appointment.find({
            businessId,
            status: { $nin: ['cancelled'] },
        })
            .select('clientId date status')
            .sort({ date: -1 })
            .lean(),
    ]);

    // Calcular visitas y última visita desde citas reales
    const visitMap = new Map<string, { count: number; lastDate: string }>();
    for (const apt of appointments) {
        if (!apt.clientId) continue;
        const cid = String(apt.clientId);
        const existing = visitMap.get(cid);
        const aptDate = apt.date instanceof Date ? apt.date.toISOString() : String(apt.date);
        if (existing) {
            existing.count++;
        } else {
            visitMap.set(cid, { count: 1, lastDate: aptDate });
        }
    }

    const enriched = clients.map((c) => {
        const cid = String(c._id);
        const stats = visitMap.get(cid);
        return {
            ...c,
            totalVisits: stats?.count ?? 0,
            lastVisit: stats?.lastDate ?? null,
        };
    });

    // Ordenar por última visita (más reciente primero), sin visita al final
    enriched.sort((a, b) => {
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });

    return serialize(enriched);
}
