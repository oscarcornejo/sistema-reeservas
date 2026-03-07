/**
 * @fileoverview Componente cliente de reportes del profesional.
 * Muestra 4 tarjetas de métricas, filtro de fechas por searchParams,
 * y tabla de citas del período seleccionado.
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    CalendarDays,
    DollarSign,
    Star,
    CalendarRange,
    FileSpreadsheet,
    BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface Metrics {
    uniqueClients: number;
    totalAppointments: number;
    totalRevenue: number;
    rating: number;
    totalReviews: number;
}

interface AppointmentRow {
    _id: string;
    date: string;
    startTime: string;
    status: string;
    paymentStatus: string;
    paymentAmount: number;
    serviceName: string;
    clientName: string;
}

interface Props {
    metrics: Metrics;
    appointments: AppointmentRow[];
    startDate: string;
    endDate: string;
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    paid: {
        label: 'Pagado',
        color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    pending: {
        label: 'Pendiente',
        color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    refunded: {
        label: 'Reembolsado',
        color: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    },
};

export function ProfessionalReportsClient({ metrics, appointments, startDate, endDate }: Props) {
    const router = useRouter();

    const handleDateChange = (field: 'desde' | 'hasta', value: string) => {
        const params = new URLSearchParams();
        if (field === 'desde') {
            params.set('desde', value);
            params.set('hasta', endDate);
        } else {
            params.set('desde', startDate);
            params.set('hasta', value);
        }
        router.push(`/profesional/reportes?${params.toString()}`);
    };

    const metricCards = [
        {
            label: 'Clientes atendidos',
            value: metrics.uniqueClients,
            icon: Users,
            gradient: 'from-violet-500/8 to-violet-500/3',
            iconColor: 'text-violet-500 dark:text-violet-400',
            bgIcon: 'bg-violet-500/10 dark:bg-violet-500/20',
        },
        {
            label: 'Citas del período',
            value: metrics.totalAppointments,
            icon: CalendarDays,
            gradient: 'from-blue-500/8 to-blue-500/3',
            iconColor: 'text-blue-500 dark:text-blue-400',
            bgIcon: 'bg-blue-500/10 dark:bg-blue-500/20',
        },
        {
            label: 'Ingresos concretados',
            value: formatCurrency(metrics.totalRevenue),
            icon: DollarSign,
            gradient: 'from-emerald-500/8 to-emerald-500/3',
            iconColor: 'text-emerald-500 dark:text-emerald-400',
            bgIcon: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        },
        {
            label: 'Calificación',
            value: metrics.rating > 0 ? `${metrics.rating.toFixed(1)}` : '—',
            subtitle: metrics.totalReviews > 0 ? `${metrics.totalReviews} reseña${metrics.totalReviews !== 1 ? 's' : ''}` : 'Sin reseñas',
            icon: Star,
            gradient: 'from-amber-500/8 to-amber-500/3',
            iconColor: 'text-amber-500 dark:text-amber-400',
            bgIcon: 'bg-amber-500/10 dark:bg-amber-500/20',
        },
    ];

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/8 via-background to-blue-500/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/8 dark:bg-violet-500/15 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/6 dark:bg-blue-500/12 blur-3xl" />

                <div className="relative space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <BarChart3 className="h-7 w-7 text-violet-500 dark:text-violet-400" />
                        Mis Reportes
                    </h1>
                    <p className="text-muted-foreground">
                        Revisa tu rendimiento y métricas de atención
                    </p>
                </div>
            </div>

            {/* ── Tarjetas de métricas ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metricCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Card
                            key={card.label}
                            className={`relative overflow-hidden border-border/50 bg-gradient-to-br ${card.gradient}`}
                            style={{ animation: `fadeIn 0.4s ease-out ${0.05 * (i + 1)}s both` }}
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {card.label}
                                    </p>
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bgIcon}`}>
                                        <Icon className={`h-4.5 w-4.5 ${card.iconColor}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold tabular-nums tracking-tight">
                                    {card.value}
                                </p>
                                {card.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.subtitle}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Filtro de fechas ── */}
            <Card
                className="relative overflow-hidden border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.25s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 to-blue-400/40" />
                <CardContent className="p-5">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="desde" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CalendarRange className="h-3 w-3" />
                                Desde
                            </Label>
                            <Input
                                id="desde"
                                type="date"
                                value={startDate}
                                onChange={(e) => handleDateChange('desde', e.target.value)}
                                className="w-[180px] border-border/60"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="hasta" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CalendarRange className="h-3 w-3" />
                                Hasta
                            </Label>
                            <Input
                                id="hasta"
                                type="date"
                                value={endDate}
                                onChange={(e) => handleDateChange('hasta', e.target.value)}
                                className="w-[180px] border-border/60"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabla de citas ── */}
            <Card
                className="relative overflow-hidden border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-violet-400/40" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                        Citas del período
                    </CardTitle>
                    <CardDescription>
                        {appointments.length} cita{appointments.length !== 1 ? 's' : ''} registrada{appointments.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Fecha</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                                <TableHead>Estado pago</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appointments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <FileSpreadsheet className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">
                                            No hay citas en este período
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                            Ajusta el rango de fechas para ver resultados
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appointments.map((apt) => {
                                    const paymentConfig = PAYMENT_STATUS_CONFIG[apt.paymentStatus] ?? {
                                        label: apt.paymentStatus,
                                        color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                                    };
                                    return (
                                        <TableRow key={apt._id}>
                                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                {formatDate(apt.date, 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="font-medium text-sm max-w-[200px] truncate">
                                                {apt.serviceName}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {apt.clientName}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-bold tabular-nums">
                                                    {formatCurrency(apt.paymentAmount)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                                        apt.paymentStatus === 'paid'
                                                            ? 'bg-emerald-500'
                                                            : apt.paymentStatus === 'refunded'
                                                                ? 'bg-red-500'
                                                                : 'bg-amber-500'
                                                    }`} />
                                                    <Badge className={`text-[10px] border-0 ${paymentConfig.color}`}>
                                                        {paymentConfig.label}
                                                    </Badge>
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
