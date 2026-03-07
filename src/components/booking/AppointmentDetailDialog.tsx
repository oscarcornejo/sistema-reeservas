/**
 * @fileoverview Dialogo de detalle de cita.
 * Muestra informacion completa, cambio de estado y reagendamiento inline.
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Clock,
    User,
    Scissors,
    CalendarDays,
    Mail,
    Phone,
    FileText,
    CalendarClock,
    XCircle,
    DollarSign,
    Loader2,
    ArrowRight,
    Check,
    X,
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { updateAppointmentStatus, getAvailableSlots, rescheduleAppointment } from '@/actions/appointments';
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUS_CONFIG } from '@/lib/utils/format';
import type { IAppointmentPopulated, AppointmentStatus, UserRole } from '@/types';

/** Transiciones validas de estado */
const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    pending: ['confirmed', 'cancelled', 'no-show'],
    confirmed: ['in-progress', 'cancelled', 'no-show'],
    'in-progress': ['completed', 'cancelled', 'no-show'],
    completed: [],
    cancelled: [],
    'no-show': [],
};

interface AppointmentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: IAppointmentPopulated | null;
    userRole: UserRole;
    onReschedule?: (apt: IAppointmentPopulated) => void;
    onCancel?: (apt: IAppointmentPopulated) => void;
    /** Callback despues de cambiar estado o reagendar (para refrescar datos en el padre) */
    onStatusChange?: () => void;
}

export function AppointmentDetailDialog({
    open,
    onOpenChange,
    appointment,
    userRole,
    onReschedule,
    onCancel,
    onStatusChange,
}: AppointmentDetailDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [localStatus, setLocalStatus] = useState<AppointmentStatus | null>(null);

    // Reagendamiento inline
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

    // Resetear estado local cuando cambia la cita
    useEffect(() => {
        setLocalStatus(null);
        setIsRescheduling(false);
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setSlots([]);
    }, [appointment?._id]);

    // Cargar slots al seleccionar fecha
    useEffect(() => {
        if (!selectedDate || !appointment || !isRescheduling) return;

        setSelectedSlot(null);
        setIsLoadingSlots(true);

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        getAvailableSlots(
            appointment.professionalId._id,
            dateStr,
            appointment.serviceId._id
        ).then((result) => {
            if (result.success && result.data) {
                setSlots(result.data);
            } else {
                setSlots([]);
            }
            setIsLoadingSlots(false);
        });
    }, [selectedDate, appointment, isRescheduling]);

    if (!appointment) return null;

    const currentStatus = (localStatus ?? appointment.status) as AppointmentStatus;
    const statusConfig = APPOINTMENT_STATUS_CONFIG[currentStatus];
    const canModify = !['completed', 'cancelled', 'no-show'].includes(currentStatus);
    const canChangeStatus = userRole !== 'client' && STATUS_TRANSITIONS[currentStatus]?.length > 0;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];
    const today = startOfDay(new Date());

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            const result = await updateAppointmentStatus(
                String(appointment._id),
                newStatus as AppointmentStatus,
            );
            if (result.success) {
                setLocalStatus(newStatus as AppointmentStatus);
                toast.success(`Estado actualizado a "${APPOINTMENT_STATUS_CONFIG[newStatus as AppointmentStatus].label}"`);
                router.refresh();
                onStatusChange?.();
            } else {
                toast.error(result.error || 'Error al actualizar el estado');
            }
        });
    };

    const handleRescheduleSubmit = () => {
        if (!selectedDate || !selectedSlot) return;

        setIsSubmittingReschedule(true);
        startTransition(async () => {
            const fd = new FormData();
            fd.set('appointmentId', appointment._id);
            fd.set('date', format(selectedDate, 'yyyy-MM-dd'));
            fd.set('startTime', selectedSlot);

            const result = await rescheduleAppointment(fd);
            setIsSubmittingReschedule(false);
            if (result.success) {
                toast.success('Cita reagendada exitosamente');
                setIsRescheduling(false);
                onOpenChange(false);
                router.refresh();
                onStatusChange?.();
            } else {
                toast.error(result.error || 'Error al reagendar la cita');
            }
        });
    };

    const handleStartReschedule = () => {
        // Si hay callback externo, usarlo (mantiene compatibilidad con RescheduleDialog)
        if (onReschedule) {
            onReschedule(appointment);
            return;
        }
        // Sino, reagendar inline
        setIsRescheduling(true);
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setSlots([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Detalle de la cita
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Estado */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        {canChangeStatus ? (
                            <div className="flex items-center gap-2">
                                {isPending && !isSubmittingReschedule && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                )}
                                <Select
                                    value={currentStatus}
                                    onValueChange={handleStatusChange}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="w-[160px] h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={currentStatus} disabled>
                                            <span className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                                                {statusConfig.label} (actual)
                                            </span>
                                        </SelectItem>
                                        {allowedTransitions.map((s) => {
                                            const cfg = APPOINTMENT_STATUS_CONFIG[s];
                                            return (
                                                <SelectItem key={s} value={s}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <Badge className={`${statusConfig.color} border-0`}>
                                {statusConfig.label}
                            </Badge>
                        )}
                    </div>

                    <Separator />

                    {/* Datos de la cita */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Scissors className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-24">Servicio</span>
                            <span className="font-medium">{appointment.serviceId?.name || 'Servicio'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-24">Profesional</span>
                            <span className="font-medium">{appointment.professionalId?.displayName || 'Profesional'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-24">Fecha</span>
                            <span className="font-medium">{formatDate(appointment.date)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-24">Horario</span>
                            <span className="font-medium">
                                {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)} ({appointment.duration} min)
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground w-24">Precio</span>
                            <span className="font-medium">
                                {appointment.serviceId?.price != null
                                    ? formatCurrency(appointment.serviceId.price)
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Cliente (visible para admin y profesional) */}
                    {userRole !== 'client' && appointment.clientId && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="font-medium">{appointment.clientId.name}</span>
                                </div>
                                {appointment.clientId.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">{appointment.clientId.email}</span>
                                    </div>
                                )}
                                {appointment.clientId.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">{appointment.clientId.phone}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Notas */}
                    {appointment.clientNotes && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas del cliente</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{appointment.clientNotes}</p>
                            </div>
                        </>
                    )}

                    {/* Motivo de cancelacion */}
                    {appointment.status === 'cancelled' && appointment.cancellationReason && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Motivo de cancelacion</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{appointment.cancellationReason}</p>
                            </div>
                        </>
                    )}

                    {/* Reagendamiento inline */}
                    {isRescheduling && canModify && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Reagendar cita
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setIsRescheduling(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Indicador de cambio */}
                                {selectedDate && (
                                    <div className="flex items-center gap-2 text-sm rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                                        <span className="text-muted-foreground line-through text-xs">
                                            {formatDate(appointment.date)} {formatTime(appointment.startTime)}
                                        </span>
                                        <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="font-medium text-primary text-xs">
                                            {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                                            {selectedSlot && ` ${formatTime(selectedSlot)}`}
                                        </span>
                                    </div>
                                )}

                                {/* Calendario */}
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => isBefore(date, today)}
                                    className="rounded-md border mx-auto"
                                />

                                {/* Slots */}
                                {selectedDate && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Horarios disponibles</p>
                                        {isLoadingSlots ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                                            </div>
                                        ) : slots.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-3">
                                                No hay horarios disponibles para esta fecha
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                {slots.map((slot) => (
                                                    <Button
                                                        key={slot}
                                                        type="button"
                                                        variant={selectedSlot === slot ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="text-xs tabular-nums"
                                                        onClick={() => setSelectedSlot(slot)}
                                                    >
                                                        {formatTime(slot)}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Boton confirmar */}
                                <Button
                                    className="w-full"
                                    disabled={!selectedDate || !selectedSlot || isSubmittingReschedule}
                                    onClick={handleRescheduleSubmit}
                                >
                                    {isSubmittingReschedule ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                            Reagendando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-1.5" />
                                            Confirmar reagendamiento
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Acciones */}
                    {canModify && !isRescheduling && (
                        <>
                            <Separator />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleStartReschedule}
                                >
                                    <CalendarClock className="h-4 w-4 mr-1.5" />
                                    Reagendar
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onCancel?.(appointment)}
                                >
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                    Anular
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
