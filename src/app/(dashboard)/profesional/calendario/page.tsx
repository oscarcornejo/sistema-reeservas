/**
 * @fileoverview Calendario del profesional.
 * Vista timeline simplificada de una sola fila (solo el profesional autenticado).
 * Vistas: día y semana.
 */

'use client';

import { useState, useEffect, useCallback, useTransition, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/components/ui/tooltip';
import {
    Ban,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Scissors,
    CalendarDays,
    Loader2,
} from 'lucide-react';
import { getProfessionalAppointments } from '@/actions/appointments';
import { getProfessionalBlocks, getMyProfessionalId } from '@/actions/schedule-blocks';
import {
    formatRelativeDate,
    APPOINTMENT_STATUS_CONFIG,
} from '@/lib/utils/format';
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    isToday,
    eachDayOfInterval,
    isSameDay,
    addWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { AppointmentDetailDialog } from '@/components/booking/AppointmentDetailDialog';
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import { CancelDialog } from '@/components/booking/CancelDialog';
import { ScheduleBlockDialog } from '@/components/booking/ScheduleBlockDialog';
import { UnblockDialog } from '@/components/booking/UnblockDialog';
import type { IAppointmentPopulated, IScheduleBlockSerialized, AppointmentStatus } from '@/types';

// ─── Constantes ──────────────────────────────────────────────────────────────

const WORK_HOURS = Array.from({ length: 16 }, (_, i) => i + 8);
const HOUR_WIDTH_PX = 150;
const DAY_START_MINUTES = 480;

const HALF_HOUR_SLOTS: string[] = [];
for (const hour of WORK_HOURS) {
    const hh = String(hour).padStart(2, '0');
    HALF_HOUR_SLOTS.push(`${hh}:00`, `${hh}:30`);
}

const SLOT_WIDTH_PX = HOUR_WIDTH_PX / 2;

type ViewMode = 'today' | 'week';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToPx(minutes: number): number {
    return ((minutes - DAY_START_MINUTES) / 60) * HOUR_WIDTH_PX;
}

function durationToPx(duration: number): number {
    return (duration / 60) * HOUR_WIDTH_PX;
}

/** Verifica si una fecha está bloqueada */
function isDateBlockedProf(
    date: Date,
    blocks: IScheduleBlockSerialized[],
): IScheduleBlockSerialized | null {
    for (const block of blocks) {
        const blockStart = new Date(block.startDate);
        if (block.endDate === null) {
            if (date >= blockStart) return block;
        } else {
            const blockEnd = new Date(block.endDate);
            if (date >= blockStart && date <= blockEnd) return block;
        }
    }
    return null;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ProfessionalCalendarPage() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<IAppointmentPopulated[]>([]);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<ViewMode>('today');
    const [myProfessionalId, setMyProfessionalId] = useState('');

    // Dialog state
    const [selectedAppointment, setSelectedAppointment] = useState<IAppointmentPopulated | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    // Schedule blocks
    const [scheduleBlocks, setScheduleBlocks] = useState<IScheduleBlockSerialized[]>([]);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<IScheduleBlockSerialized | null>(null);

    // ─── Carga de datos ──────────────────────────────────────────────────────

    useEffect(() => {
        getMyProfessionalId().then((result) => {
            if (result.success && result.data) {
                setMyProfessionalId(result.data);
            }
        });
    }, []);

    const loadAppointments = useCallback(() => {
        let start: string;
        let end: string;

        if (viewMode === 'week') {
            start = format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            end = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else {
            const dayStr = format(selectedDate, 'yyyy-MM-dd');
            start = dayStr;
            end = dayStr;
        }

        startTransition(async () => {
            const [aptsResult, blocksResult] = await Promise.all([
                getProfessionalAppointments(start, end),
                getProfessionalBlocks(start, end),
            ]);
            if (aptsResult.success && aptsResult.data) {
                setAppointments(aptsResult.data);
            } else {
                toast.error(aptsResult.error || 'Error al cargar citas');
            }
            if (blocksResult.success && blocksResult.data) {
                setScheduleBlocks(blocksResult.data);
            }
        });
    }, [selectedDate, viewMode]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    // ─── Datos derivados ─────────────────────────────────────────────────────

    const dayAppointments = useMemo(
        () =>
            appointments.filter((apt) => {
                const aptDate = new Date(apt.date);
                return (
                    aptDate.getFullYear() === selectedDate.getFullYear() &&
                    aptDate.getMonth() === selectedDate.getMonth() &&
                    aptDate.getDate() === selectedDate.getDate()
                );
            }),
        [appointments, selectedDate],
    );

    const contextAppointments = viewMode === 'today' ? dayAppointments : appointments;
    const confirmedCount = contextAppointments.filter((a) => a.status === 'confirmed').length;
    const pendingCount = contextAppointments.filter((a) => a.status === 'pending').length;

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/8 via-background to-primary/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                                <CalendarDays className="h-7 w-7 text-accent" />
                                Mi Calendario
                            </h1>
                            <p className="text-muted-foreground">
                                {viewMode === 'today' ? (
                                    <>
                                        {formatRelativeDate(selectedDate)} —{' '}
                                        <span className="capitalize">
                                            {format(selectedDate, "EEEE dd 'de' MMMM", { locale: es })}
                                        </span>
                                    </>
                                ) : (
                                    (() => {
                                        const wStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                                        const wEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
                                        return (
                                            <span className="capitalize">
                                                Semana del {format(wStart, 'd', { locale: es })} al{' '}
                                                {format(wEnd, "d 'de' MMMM", { locale: es })}
                                            </span>
                                        );
                                    })()
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border/60 text-destructive hover:text-destructive"
                                onClick={() => setBlockDialogOpen(true)}
                            >
                                <Ban className="h-4 w-4" />
                                <span className="hidden sm:inline">Bloquear mi agenda</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-border/60"
                                onClick={() =>
                                    setSelectedDate((d) =>
                                        viewMode === 'week' ? addWeeks(d, -1) : addDays(d, -1),
                                    )
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={isToday(selectedDate) && viewMode === 'today' ? 'default' : 'outline'}
                                size="sm"
                                className={
                                    isToday(selectedDate) && viewMode === 'today'
                                        ? 'bg-gradient-to-r from-accent to-primary hover:opacity-90'
                                        : 'border-border/60'
                                }
                                onClick={() => {
                                    setSelectedDate(new Date());
                                    setViewMode('today');
                                }}
                            >
                                Hoy
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-border/60"
                                onClick={() =>
                                    setSelectedDate((d) =>
                                        viewMode === 'week' ? addWeeks(d, 1) : addDays(d, 1),
                                    )
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="hidden sm:block">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                            <TabsList variant="line">
                                <TabsTrigger value="today">Hoy</TabsTrigger>
                                <TabsTrigger value="week">Semana</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Sidebar */}
                <div className="hidden lg:flex flex-col gap-4" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                    <Card className="border-border/50 overflow-hidden">
                        <CardContent className="p-3">
                            <CalendarWidget
                                locale={es}
                                mode="single"
                                selected={selectedDate}
                                month={selectedDate}
                                onMonthChange={setSelectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                className="rounded-md"
                            />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
                        <CardContent className="p-4 space-y-3">
                            <p className="text-sm font-semibold">
                                {viewMode === 'week' ? 'Resumen de la semana' : 'Resumen del día'}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    Total citas
                                </span>
                                <span className="text-lg font-bold">{contextAppointments.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Confirmadas</span>
                                <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0">
                                    {confirmedCount}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pendientes</span>
                                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0">
                                    {pendingCount}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline */}
                <Card className="border-border/50 overflow-hidden pb-0 gap-0" style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}>
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-blue-400/40" />
                    <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                        {isPending ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                                <p className="text-sm text-muted-foreground">Cargando citas...</p>
                            </div>
                        ) : viewMode === 'week' ? (
                            <ProfWeekView
                                appointments={appointments}
                                selectedDate={selectedDate}
                                scheduleBlocks={scheduleBlocks}
                                onDayClick={(day) => {
                                    setViewMode('today');
                                    setSelectedDate(day);
                                }}
                                onAppointmentClick={handleAppointmentClick}
                            />
                        ) : dayAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <CalendarDays className="h-12 w-12 text-muted-foreground/20" />
                                <p className="text-muted-foreground text-sm">Sin citas para este día</p>
                            </div>
                        ) : (
                            <ProfTimelineView
                                dayAppointments={dayAppointments}
                                selectedDate={selectedDate}
                                scheduleBlocks={scheduleBlocks}
                                onAppointmentClick={handleAppointmentClick}
                                onBlockClick={(block) => {
                                    setSelectedBlock(block);
                                    setUnblockDialogOpen(true);
                                }}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <AppointmentDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                appointment={selectedAppointment}
                userRole="professional"
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
            <ScheduleBlockDialog
                open={blockDialogOpen}
                onOpenChange={setBlockDialogOpen}
                professionals={null}
                preselectedProfessionalId={myProfessionalId}
                selectedDate={selectedDate}
                userRole="professional"
                onSuccess={() => {
                    setBlockDialogOpen(false);
                    loadAppointments();
                }}
            />
            <UnblockDialog
                open={unblockDialogOpen}
                onOpenChange={setUnblockDialogOpen}
                block={selectedBlock}
                onSuccess={() => {
                    setUnblockDialogOpen(false);
                    setSelectedBlock(null);
                    loadAppointments();
                }}
            />
        </div>
    );
}

// ─── Vista semanal profesional ───────────────────────────────────────────────

function ProfWeekView({
    appointments,
    selectedDate,
    scheduleBlocks,
    onDayClick,
    onAppointmentClick,
}: {
    appointments: IAppointmentPopulated[];
    selectedDate: Date;
    scheduleBlocks: IScheduleBlockSerialized[];
    onDayClick: (day: Date) => void;
    onAppointmentClick: (apt: IAppointmentPopulated) => void;
}) {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
        <div className="p-2 sm:p-4" style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/40">
                {days.map((day) => {
                    const dayApts = appointments.filter((apt) => isSameDay(new Date(apt.date), day));
                    const today = isToday(day);
                    const blocked = isDateBlockedProf(day, scheduleBlocks);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`bg-card flex flex-col cursor-pointer hover:bg-muted/40 transition-colors ${blocked ? 'bg-red-500/[0.03]' : ''}`}
                            onClick={() => onDayClick(day)}
                        >
                            <div className={`sticky top-0 bg-card border-b border-border/40 px-2 py-2.5 text-center ${today ? 'bg-primary/5' : ''}`}>
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {format(day, 'EEE', { locale: es })}
                                </span>
                                <span className={`block text-lg font-bold mt-0.5 ${today ? 'text-primary' : 'text-foreground'}`}>
                                    {format(day, 'd')}
                                </span>
                                {dayApts.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        {dayApts.length} {dayApts.length === 1 ? 'cita' : 'citas'}
                                    </span>
                                )}
                                {blocked && (
                                    <span className="flex items-center justify-center gap-0.5 text-[10px] text-red-500">
                                        <Ban className="h-2.5 w-2.5" />
                                        Bloqueado
                                    </span>
                                )}
                            </div>
                            <div className="p-1.5 space-y-1 min-h-[120px] flex-1">
                                {dayApts.map((apt) => {
                                    const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];
                                    const clientName = apt.clientId?.name || 'Cliente';
                                    return (
                                        <div
                                            key={apt._id}
                                            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-[11px] leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAppointmentClick(apt);
                                            }}
                                        >
                                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
                                            <span className="font-semibold tabular-nums text-accent-foreground">
                                                {apt.startTime}
                                            </span>
                                            <span className="truncate text-muted-foreground">{clientName}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Timeline de un día (una sola fila) ──────────────────────────────────────

const ROW_HEIGHT = 80;
const BLOCK_EXPANDED_THRESHOLD = 70;
const WIDE_BLOCK_THRESHOLD = 120;

function ProfTimelineView({
    dayAppointments,
    selectedDate,
    scheduleBlocks,
    onAppointmentClick,
    onBlockClick,
}: {
    dayAppointments: IAppointmentPopulated[];
    selectedDate: Date;
    scheduleBlocks: IScheduleBlockSerialized[];
    onAppointmentClick: (apt: IAppointmentPopulated) => void;
    onBlockClick?: (block: IScheduleBlockSerialized) => void;
}) {
    const totalWidth = WORK_HOURS.length * HOUR_WIDTH_PX;
    const isTodaySelected = isToday(selectedDate);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [nowMinutes, setNowMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        if (!isTodaySelected) return;
        const interval = setInterval(() => {
            const now = new Date();
            setNowMinutes(now.getHours() * 60 + now.getMinutes());
        }, 60_000);
        return () => clearInterval(interval);
    }, [isTodaySelected]);

    const nowInRange =
        isTodaySelected &&
        nowMinutes >= DAY_START_MINUTES &&
        nowMinutes <= DAY_START_MINUTES + WORK_HOURS.length * 60;
    const nowPx = nowInRange ? minutesToPx(nowMinutes) : 0;

    // Auto-scroll para centrar la línea "ahora"
    useEffect(() => {
        if (!nowInRange || !scrollRef.current) return;
        const container = scrollRef.current;
        const scrollTarget = nowPx - container.clientWidth / 2;
        container.scrollLeft = Math.max(0, scrollTarget);
    }, [nowInRange]); // eslint-disable-line react-hooks/exhaustive-deps

    const nowTimeLabel = `${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`;

    return (
        <TooltipProvider delayDuration={200}>
            <div ref={scrollRef} className="overflow-auto flex-1" style={{ animation: 'fadeIn 0.25s ease-out' }}>
                {/* Header */}
                <div className="flex sticky top-0 z-20 bg-card border-b border-border/40" style={{ minWidth: totalWidth }}>
                    <div className="relative" style={{ width: totalWidth, height: 40 }}>
                        {HALF_HOUR_SLOTS.map((slotTime, slotIdx) => (
                            <div
                                key={slotTime}
                                className={`absolute top-0 bottom-0 ${slotIdx % 2 === 0 ? 'border-l border-border/40' : 'border-l border-border/15'}`}
                                style={{ left: slotIdx * SLOT_WIDTH_PX, width: SLOT_WIDTH_PX }}
                            />
                        ))}
                        {WORK_HOURS.map((hour, i) => (
                            <div
                                key={hour}
                                className="absolute top-0 bottom-0 pointer-events-none"
                                style={{ left: i * HOUR_WIDTH_PX, width: HOUR_WIDTH_PX }}
                            >
                                <div className="absolute top-0 bottom-0 flex items-end pb-1.5 left-0">
                                    <span className={`text-[11px] tabular-nums pl-2 select-none ${hour === 12 ? 'font-bold text-foreground' : hour % 2 === 0 ? 'font-semibold text-muted-foreground' : 'font-medium text-muted-foreground/60'}`}>
                                        {String(hour).padStart(2, '0')}:00
                                    </span>
                                </div>
                                <div className="absolute top-0 bottom-0 flex items-end pb-1.5" style={{ left: SLOT_WIDTH_PX }}>
                                    <span className="text-[10px] tabular-nums pl-1 select-none text-muted-foreground/40">
                                        {String(hour).padStart(2, '0')}:30
                                    </span>
                                </div>
                            </div>
                        ))}
                        {nowInRange && (
                            <>
                                <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10" style={{ left: nowPx - 0.5 }} />
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="absolute top-0 z-10 h-3 w-3 rounded-full bg-primary -translate-x-1/2 shadow-sm shadow-primary/30 cursor-help"
                                            style={{ left: nowPx }}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs">
                                        <p className="font-semibold">{nowTimeLabel} — Hora actual</p>
                                        <p className="text-muted-foreground">Indicador de la hora en tiempo real</p>
                                    </TooltipContent>
                                </Tooltip>
                            </>
                        )}
                    </div>
                </div>

                {/* Track */}
                <div className="flex border-b border-border/30" style={{ minWidth: totalWidth }}>
                    <div className="relative" style={{ width: totalWidth, height: ROW_HEIGHT }}>
                        {HALF_HOUR_SLOTS.map((slotTime, slotIdx) => (
                            <div
                                key={slotTime}
                                className={`absolute top-0 bottom-0 ${slotIdx % 2 === 0 ? 'border-l border-border/40' : 'border-l border-border/15'}`}
                                style={{ left: slotIdx * SLOT_WIDTH_PX, width: SLOT_WIDTH_PX }}
                            />
                        ))}
                        {dayAppointments.map((apt) => {
                            const startMin = timeToMinutes(apt.startTime);
                            const left = minutesToPx(startMin);
                            const width = durationToPx(apt.duration);
                            const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];
                            const clientName = apt.clientId?.name || 'Cliente';
                            const serviceName = apt.serviceId?.name || 'Servicio';
                            const servicePrice = apt.serviceId?.price;
                            const effectiveWidth = Math.max(width, 28);
                            const isExpanded = effectiveWidth >= BLOCK_EXPANDED_THRESHOLD;
                            const isWide = effectiveWidth >= WIDE_BLOCK_THRESHOLD;
                            const isReduced = ['completed', 'cancelled', 'no-show'].includes(apt.status);

                            return (
                                <Tooltip key={apt._id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`absolute top-1.5 bottom-1.5 rounded-lg overflow-hidden cursor-pointer transition-all
                                                bg-card border border-accent/30 bg-accent/10
                                                ${apt.status === 'pending' ? 'border-dashed' : ''}
                                                ${apt.status === 'in-progress' ? 'ring-2 ring-primary/25' : ''}
                                                ${isReduced ? 'opacity-60' : ''}
                                                shadow-sm hover:shadow-md hover:z-20 hover:scale-[1.02]`}
                                            style={{ left, width: effectiveWidth }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAppointmentClick(apt);
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.dot}`} />
                                            {isWide ? (
                                                <div className="relative pl-3 pr-2 py-1 h-full flex flex-col justify-center min-w-0">
                                                    <p className="text-[11px] font-bold tabular-nums leading-tight flex items-center gap-1.5 text-accent-foreground">
                                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`} />
                                                        {apt.startTime} – {apt.endTime}
                                                    </p>
                                                    <p className="text-[10px] font-semibold text-foreground/90 truncate leading-tight mt-0.5">{serviceName}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate leading-tight">{clientName}</p>
                                                </div>
                                            ) : isExpanded ? (
                                                <div className="relative pl-3 pr-1.5 py-1.5 h-full flex flex-col justify-center min-w-0">
                                                    <p className="text-[11px] font-bold tabular-nums leading-tight flex items-center gap-1 text-accent-foreground">
                                                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`} />
                                                        {apt.startTime}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-foreground/80 truncate leading-tight mt-0.5">{serviceName}</p>
                                                </div>
                                            ) : (
                                                <div className="relative pl-3 pr-1 h-full flex items-center min-w-0">
                                                    <p className="text-[10px] font-bold tabular-nums leading-none text-accent-foreground">{apt.startTime}</p>
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[260px] bg-popover text-popover-foreground border border-border shadow-lg p-3">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-semibold text-xs tabular-nums">{apt.startTime} – {apt.endTime}</span>
                                                <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${statusConfig.color}`}>{statusConfig.label}</Badge>
                                            </div>
                                            <div className="h-px bg-border/50" />
                                            <div className="space-y-1 text-[11px]">
                                                <p className="flex items-center gap-1.5">
                                                    <Scissors className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    <span className="font-medium">{serviceName}</span>
                                                    {servicePrice != null && <span className="ml-auto text-muted-foreground tabular-nums">${servicePrice.toLocaleString()}</span>}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    {clientName}
                                                </p>
                                                <p className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                                    {apt.duration} min
                                                </p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                        {/* Overlay de bloqueo */}
                        {(() => {
                            const blockedBlock = isDateBlockedProf(selectedDate, scheduleBlocks);
                            if (!blockedBlock) return null;
                            return (
                                <div
                                    className="absolute inset-0 z-[5] flex items-center justify-center gap-2 cursor-pointer"
                                    style={{
                                        background:
                                            'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onBlockClick?.(blockedBlock);
                                    }}
                                >
                                    <Ban className="h-4 w-4 text-red-500/60" />
                                    <span className="text-xs font-medium text-red-500/70">Bloqueado</span>
                                </div>
                            );
                        })()}
                        {nowInRange && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none" style={{ left: nowPx - 0.5 }} />
                        )}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
