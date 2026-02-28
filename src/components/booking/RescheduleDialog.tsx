/**
 * @fileoverview Diálogo para reagendar una cita.
 * Permite seleccionar nueva fecha y horario disponible.
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
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import {
    CalendarClock,
    ArrowRight,
    Loader2,
    Clock,
} from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { getAvailableSlots, rescheduleAppointment } from '@/actions/appointments';
import { formatDate, formatTime } from '@/lib/utils/format';
import type { IAppointmentPopulated } from '@/types';

interface RescheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointment: IAppointmentPopulated | null;
    onSuccess: () => void;
}

export function RescheduleDialog({
    open,
    onOpenChange,
    appointment,
    onSuccess,
}: RescheduleDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [slots, setSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Reset al abrir
    useEffect(() => {
        if (open) {
            setSelectedDate(undefined);
            setSelectedSlot(null);
            setSlots([]);
        }
    }, [open]);

    // Cargar slots al cambiar fecha
    useEffect(() => {
        if (!selectedDate || !appointment) return;

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
                toast.error(result.error || 'Error al cargar horarios');
            }
            setIsLoadingSlots(false);
        });
    }, [selectedDate, appointment]);

    const handleSubmit = () => {
        if (!appointment || !selectedDate || !selectedSlot) return;

        startTransition(async () => {
            const fd = new FormData();
            fd.set('appointmentId', appointment._id);
            fd.set('date', format(selectedDate, 'yyyy-MM-dd'));
            fd.set('startTime', selectedSlot);

            const result = await rescheduleAppointment(fd);
            if (result.success) {
                toast.success('Cita reagendada exitosamente');
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(result.error || 'Error al reagendar la cita');
            }
        });
    };

    if (!appointment) return null;

    const today = startOfDay(new Date());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        Reagendar cita
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Cita actual */}
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Horario actual
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                {formatDate(appointment.date)} — {formatTime(appointment.startTime)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 pl-6">
                            {appointment.serviceId?.name} con {appointment.professionalId?.displayName}
                        </p>
                    </div>

                    {selectedDate && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">
                                {formatDate(appointment.date)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-primary" />
                            <span className="font-medium text-primary">
                                {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                            </span>
                        </div>
                    )}

                    <Separator />

                    {/* Selector de fecha */}
                    <div>
                        <p className="text-sm font-medium mb-2">Selecciona nueva fecha</p>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => isBefore(date, today)}
                            className="rounded-md border"
                        />
                    </div>

                    {/* Slots disponibles */}
                    {selectedDate && (
                        <div>
                            <p className="text-sm font-medium mb-2">Horarios disponibles</p>
                            {isLoadingSlots ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
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
                                            className={`text-xs tabular-nums ${selectedSlot === slot ? 'bg-primary text-primary-foreground' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={!selectedDate || !selectedSlot || isPending}
                        onClick={handleSubmit}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Reagendando...
                            </>
                        ) : (
                            'Confirmar reagendamiento'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
