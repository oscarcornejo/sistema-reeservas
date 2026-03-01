/**
 * @fileoverview Diálogo de detalle de cita.
 * Muestra información completa y acciones según el rol del usuario.
 */

'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { formatDate, formatTime, formatCurrency, APPOINTMENT_STATUS_CONFIG } from '@/lib/utils/format';
import type { IAppointmentPopulated, AppointmentStatus, UserRole } from '@/types';

interface AppointmentDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: IAppointmentPopulated | null;
    userRole: UserRole;
    onReschedule?: (apt: IAppointmentPopulated) => void;
    onCancel?: (apt: IAppointmentPopulated) => void;
}

export function AppointmentDetailDialog({
    open,
    onOpenChange,
    appointment,
    userRole,
    onReschedule,
    onCancel,
}: AppointmentDetailDialogProps) {
    if (!appointment) return null;

    const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status as AppointmentStatus];
    const canModify = !['completed', 'cancelled', 'no-show'].includes(appointment.status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
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
                        <Badge className={`${statusConfig.color} border-0`}>
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <Separator />

                    {/* Servicio */}
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

                    {/* Motivo de cancelación */}
                    {appointment.status === 'cancelled' && appointment.cancellationReason && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />
                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Motivo de cancelación</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-6">{appointment.cancellationReason}</p>
                            </div>
                        </>
                    )}

                    {/* Acciones */}
                    {canModify && (
                        <>
                            <Separator />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onReschedule?.(appointment)}
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
