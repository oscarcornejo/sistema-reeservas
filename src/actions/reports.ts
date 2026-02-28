/**
 * @fileoverview Server Actions de Reportes.
 * Generación de reportes de ocupación y facturación con exportación CSV.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Appointment } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import { parseISO } from 'date-fns';
import { serialize } from '@/lib/utils';
import type { ActionResult } from '@/types';

/** Estructura de un registro del reporte de facturación */
interface RevenueReport {
    date: string;
    serviceName: string;
    professionalName: string;
    clientName: string;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
}

/** Estructura del reporte de ocupación */
interface OccupancyReport {
    professionalName: string;
    totalSlots: number;
    usedSlots: number;
    occupancyRate: number;
    revenue: number;
}

/**
 * Generar reporte de facturación por rango de fechas.
 */
export async function getRevenueReport(
    startDate: string,
    endDate: string
): Promise<ActionResult<RevenueReport[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const appointments = await Appointment.find({
            businessId: business._id,
            date: { $gte: parseISO(startDate), $lte: parseISO(endDate) },
            status: { $in: ['completed', 'confirmed'] },
        })
            .populate('serviceId', 'name')
            .populate('professionalId', 'displayName')
            .populate('clientId', 'name')
            .sort({ date: 1 })
            .lean();

        const report: RevenueReport[] = appointments.map((apt) => ({
            date: apt.date.toISOString().split('T')[0],
            serviceName: (apt.serviceId as unknown as { name: string })?.name || 'N/A',
            professionalName:
                (apt.professionalId as unknown as { displayName: string })?.displayName || 'N/A',
            clientName: (apt.clientId as unknown as { name: string })?.name || 'N/A',
            amount: apt.paymentAmount,
            paymentStatus: apt.paymentStatus,
            paymentMethod: apt.paymentMethod || 'N/A',
        }));

        return { success: true, data: serialize(report) };
    } catch (error) {
        console.error('Error generando reporte:', error);
        return { success: false, error: 'Error al generar el reporte' };
    }
}

/**
 * Generar reporte de ocupación por profesional.
 */
export async function getOccupancyReport(
    startDate: string,
    endDate: string
): Promise<ActionResult<OccupancyReport[]>> {
    const business = await getUserBusiness();
    if (!business) {
        return { success: false, error: 'Negocio no encontrado' };
    }

    try {
        await connectDB();

        const report = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    date: { $gte: parseISO(startDate), $lte: parseISO(endDate) },
                },
            },
            {
                $lookup: {
                    from: 'professionals',
                    localField: 'professionalId',
                    foreignField: '_id',
                    as: 'professional',
                },
            },
            { $unwind: '$professional' },
            {
                $group: {
                    _id: '$professionalId',
                    professionalName: { $first: '$professional.displayName' },
                    totalSlots: { $sum: 1 },
                    usedSlots: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['completed', 'confirmed', 'in-progress']] },
                                1,
                                0,
                            ],
                        },
                    },
                    revenue: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$paymentAmount', 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    professionalName: 1,
                    totalSlots: 1,
                    usedSlots: 1,
                    occupancyRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$usedSlots', '$totalSlots'] }, 100] },
                            1,
                        ],
                    },
                    revenue: 1,
                },
            },
            { $sort: { occupancyRate: -1 } },
        ]);

        return { success: true, data: serialize(report) };
    } catch (error) {
        console.error('Error generando reporte de ocupación:', error);
        return { success: false, error: 'Error al generar el reporte' };
    }
}

/**
 * Exportar datos a formato CSV.
 * Convierte un array de objetos en string CSV.
 */
export async function exportToCSV(
    data: Record<string, unknown>[],
    filename: string
): Promise<ActionResult<string>> {
    if (!data.length) {
        return { success: false, error: 'No hay datos para exportar' };
    }

    try {
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Escapar comillas dobles y envolver en comillas si contiene coma
                        const cell = String(value ?? '').replace(/"/g, '""');
                        return cell.includes(',') ? `"${cell}"` : cell;
                    })
                    .join(',')
            ),
        ];

        const csvContent = csvRows.join('\n');

        return { success: true, data: csvContent };
    } catch (error) {
        console.error('Error exportando CSV:', error);
        return { success: false, error: 'Error al exportar' };
    }
}
