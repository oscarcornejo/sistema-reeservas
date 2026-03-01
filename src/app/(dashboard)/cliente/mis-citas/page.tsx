/**
 * @fileoverview Página "Mis citas" del cliente.
 * Vista en cards con tabs: Próximas / Pasadas.
 */

'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar,
    Clock,
    Scissors,
    User,
    MapPin,
    Loader2,
    CalendarClock,
    XCircle,
    Search,
    CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
import { getClientAppointments } from '@/actions/appointments';
import {
    formatDate,
    formatTime,
    formatCurrency,
    APPOINTMENT_STATUS_CONFIG,
} from '@/lib/utils/format';
import { toast } from 'sonner';
import { AppointmentDetailDialog } from '@/components/booking/AppointmentDetailDialog';
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import { CancelDialog } from '@/components/booking/CancelDialog';
import type { IAppointmentPopulated, AppointmentStatus } from '@/types';

type TabFilter = 'upcoming' | 'past';

export default function MisCitasPage() {
    const [activeTab, setActiveTab] = useState<TabFilter>('upcoming');
    const [appointments, setAppointments] = useState<IAppointmentPopulated[]>([]);
    const [isPending, startTransition] = useTransition();

    // Dialog state
    const [selectedAppointment, setSelectedAppointment] = useState<IAppointmentPopulated | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    // ─── Carga de datos ──────────────────────────────────────────────────────

    const loadAppointments = useCallback(() => {
        startTransition(async () => {
            const result = await getClientAppointments(activeTab);
            if (result.success && result.data) {
                setAppointments(result.data);
            } else {
                toast.error(result.error || 'Error al cargar citas');
            }
        });
    }, [activeTab]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleAppointmentClick = useCallback((apt: IAppointmentPopulated) => {
        setSelectedAppointment(apt);
        setDetailOpen(true);
    }, []);

    const handleReschedule = useCallback((apt: IAppointmentPopulated) => {
        setDetailOpen(false);
        setSelectedAppointment(apt);
        setRescheduleOpen(true);
    }, []);

    const handleCancel = useCallback((apt: IAppointmentPopulated) => {
        setDetailOpen(false);
        setSelectedAppointment(apt);
        setCancelOpen(true);
    }, []);

    const handleActionSuccess = useCallback(() => {
        setDetailOpen(false);
        setRescheduleOpen(false);
        setCancelOpen(false);
        setSelectedAppointment(null);
        loadAppointments();
    }, [loadAppointments]);

    // ─── Render ──────────────────────────────────────────────────────────────

    const canModify = (apt: IAppointmentPopulated) =>
        !['completed', 'cancelled', 'no-show'].includes(apt.status);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <CalendarDays className="h-7 w-7 text-primary" />
                            Mis Citas
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus citas y reservas
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/buscar">
                            <Search className="h-4 w-4 mr-1.5" />
                            Nueva reserva
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
                <TabsList>
                    <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                    <TabsTrigger value="past">Pasadas</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Content */}
            {isPending ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                    <p className="text-sm text-muted-foreground">Cargando citas...</p>
                </div>
            ) : appointments.length === 0 ? (
                <EmptyState filter={activeTab} />
            ) : (
                <div className="grid gap-3" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                    {appointments.map((apt) => {
                        const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];
                        const businessName = (apt.businessId as unknown as { name: string })?.name || 'Negocio';
                        const serviceName = apt.serviceId?.name || 'Servicio';
                        const professionalName = apt.professionalId?.displayName || 'Profesional';
                        const servicePrice = apt.serviceId?.price;

                        return (
                            <Card
                                key={apt._id}
                                role="button"
                                tabIndex={0}
                                className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-[box-shadow] duration-300 cursor-pointer"
                                onClick={() => handleAppointmentClick(apt)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAppointmentClick(apt); } }}
                            >
                                {/* Barra de estado lateral */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.dot}`} />

                                <CardContent className="p-4 pl-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        {/* Info principal */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-sm">{serviceName}</h3>
                                                <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {businessName}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {professionalName}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(apt.date)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTime(apt.startTime)} — {apt.duration} min
                                                </span>
                                                {servicePrice != null && (
                                                    <span className="font-medium text-foreground">
                                                        {formatCurrency(servicePrice)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Motivo de cancelación */}
                                            {apt.status === 'cancelled' && apt.cancellationReason && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                    <XCircle className="h-3 w-3 inline mr-1" />
                                                    {apt.cancellationReason}
                                                </p>
                                            )}
                                        </div>

                                        {/* Acciones (solo próximas y modificables) */}
                                        {activeTab === 'upcoming' && canModify(apt) && (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleReschedule(apt);
                                                    }}
                                                >
                                                    <CalendarClock className="h-3.5 w-3.5 mr-1" />
                                                    Reagendar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancel(apt);
                                                    }}
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Dialogs */}
            <AppointmentDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                appointment={selectedAppointment}
                userRole="client"
                onReschedule={handleReschedule}
                onCancel={handleCancel}
            />
            <RescheduleDialog
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
                appointment={selectedAppointment}
                onSuccess={handleActionSuccess}
            />
            <CancelDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                appointment={selectedAppointment}
                onSuccess={handleActionSuccess}
            />
        </div>
    );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: TabFilter }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <CalendarDays className="h-7 w-7 text-muted-foreground/30" />
            </div>
            {filter === 'upcoming' ? (
                <>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                            No tienes citas programadas
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Busca un negocio y reserva tu próxima cita
                        </p>
                    </div>
                    <Button size="sm" asChild>
                        <Link href="/buscar">
                            <Search className="h-3.5 w-3.5 mr-1.5" />
                            Buscar servicios
                        </Link>
                    </Button>
                </>
            ) : (
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        No tienes citas anteriores
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                        Tu historial de citas aparecerá aquí
                    </p>
                </div>
            )}
        </div>
    );
}
