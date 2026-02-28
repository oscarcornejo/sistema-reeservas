/**
 * @fileoverview Diálogo para cancelar una cita.
 * Requiere motivo obligatorio de al menos 10 caracteres.
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    XCircle,
    Loader2,
    AlertTriangle,
    Clock,
    Scissors,
    User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cancelAppointment } from '@/actions/appointments';
import { formatDate, formatTime } from '@/lib/utils/format';
import type { IAppointmentPopulated } from '@/types';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

interface CancelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: IAppointmentPopulated | null;
    onSuccess: () => void;
}

export function CancelDialog({
    open,
    onOpenChange,
    appointment,
    onSuccess,
}: CancelDialogProps) {
    const [reason, setReason] = useState('');
    const [isPending, startTransition] = useTransition();

    // Reset al abrir
    useEffect(() => {
        if (open) {
            setReason('');
        }
    }, [open]);

    const handleSubmit = () => {
        if (!appointment || reason.length < MIN_REASON_LENGTH) return;

        startTransition(async () => {
            const fd = new FormData();
            fd.set('appointmentId', appointment._id);
            fd.set('cancellationReason', reason);

            const result = await cancelAppointment(fd);
            if (result.success) {
                toast.success('Cita cancelada');
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(result.error || 'Error al cancelar la cita');
            }
        });
    };

    if (!appointment) return null;

    const isValid = reason.length >= MIN_REASON_LENGTH;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <XCircle className="h-4 w-4" />
                        Cancelar cita
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Advertencia */}
                    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Esta acción no se puede deshacer. Se notificará a las partes involucradas.
                        </p>
                    </div>

                    {/* Resumen de la cita */}
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{appointment.serviceId?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{appointment.professionalId?.displayName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {formatDate(appointment.date)} — {formatTime(appointment.startTime)}
                            </span>
                        </div>
                    </div>

                    <Separator />

                    {/* Motivo */}
                    <div className="space-y-2">
                        <label htmlFor="cancel-reason" className="text-sm font-medium">
                            Motivo de cancelación *
                        </label>
                        <Textarea
                            id="cancel-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value.slice(0, MAX_REASON_LENGTH))}
                            placeholder="Describe el motivo de la cancelación..."
                            rows={3}
                            className="resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <p className={`text-xs ${reason.length > 0 && !isValid ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {reason.length > 0 && !isValid
                                    ? `Mínimo ${MIN_REASON_LENGTH} caracteres`
                                    : 'Ingresa el motivo de la cancelación'}
                            </p>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {reason.length}/{MAX_REASON_LENGTH}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Volver
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={!isValid || isPending}
                        onClick={handleSubmit}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelando...
                            </>
                        ) : (
                            'Confirmar cancelación'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
