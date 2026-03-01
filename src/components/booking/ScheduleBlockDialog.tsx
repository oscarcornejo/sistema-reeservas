/**
 * @fileoverview Diálogo para crear un bloqueo de agenda.
 * Admin selecciona profesional; profesional solo bloquea su propia agenda.
 * Muestra preview de citas afectadas antes de confirmar.
 */

'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Ban, AlertTriangle, Calendar, CalendarRange, CalendarDays, Lock, Loader2 } from 'lucide-react';
import { createScheduleBlock, getAffectedAppointments } from '@/actions/schedule-blocks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ScheduleBlockType } from '@/types';

interface ProfessionalInfo {
    id: string;
    displayName: string;
    avatar?: string;
}

interface ScheduleBlockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    professionals: ProfessionalInfo[] | null;
    preselectedProfessionalId?: string;
    selectedDate: Date;
    userRole: 'admin' | 'professional';
    onSuccess: () => void;
}

const BLOCK_TYPE_OPTIONS: { value: ScheduleBlockType; label: string; description: string; icon: typeof Calendar }[] = [
    { value: 'day', label: 'Día', description: 'Bloquear un día completo', icon: Calendar },
    { value: 'week', label: 'Semana', description: 'Bloquear 7 días', icon: CalendarRange },
    { value: 'month', label: 'Mes', description: 'Bloquear un mes', icon: CalendarDays },
    { value: 'full', label: 'Completa', description: 'Bloquear indefinidamente', icon: Lock },
];

interface AffectedAppointment {
    clientName: string;
    serviceName: string;
    date: string;
    startTime: string;
}

export function ScheduleBlockDialog({
    open,
    onOpenChange,
    professionals,
    preselectedProfessionalId,
    selectedDate,
    userRole,
    onSuccess,
}: ScheduleBlockDialogProps) {
    const [professionalId, setProfessionalId] = useState('');
    const [blockType, setBlockType] = useState<ScheduleBlockType>('day');
    const [startDate, setStartDate] = useState('');
    const [reason, setReason] = useState('');
    const [affected, setAffected] = useState<AffectedAppointment[]>([]);
    const [isLoadingAffected, setIsLoadingAffected] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Reset al abrir
    useEffect(() => {
        if (open) {
            setProfessionalId(preselectedProfessionalId || '');
            setBlockType('day');
            setStartDate(format(selectedDate, 'yyyy-MM-dd'));
            setReason('');
            setAffected([]);
        }
    }, [open, preselectedProfessionalId, selectedDate]);

    // Preview de citas afectadas
    const loadAffected = useCallback(async () => {
        if (!professionalId || !startDate) {
            setAffected([]);
            return;
        }
        setIsLoadingAffected(true);
        const result = await getAffectedAppointments(professionalId, blockType, startDate);
        if (result.success && result.data) {
            setAffected(result.data);
        } else {
            setAffected([]);
        }
        setIsLoadingAffected(false);
    }, [professionalId, blockType, startDate]);

    useEffect(() => {
        if (open && professionalId && startDate) {
            loadAffected();
        }
    }, [open, professionalId, blockType, startDate, loadAffected]);

    const handleSubmit = () => {
        if (!professionalId || !startDate || reason.length < 5) return;

        startTransition(async () => {
            const fd = new FormData();
            fd.set('professionalId', professionalId);
            fd.set('blockType', blockType);
            fd.set('startDate', startDate);
            fd.set('reason', reason);

            const result = await createScheduleBlock(fd);
            if (result.success && result.data) {
                const msg = result.data.cancelledCount > 0
                    ? `Agenda bloqueada. ${result.data.cancelledCount} ${result.data.cancelledCount === 1 ? 'cita cancelada' : 'citas canceladas'}.`
                    : 'Agenda bloqueada exitosamente.';
                toast.success(msg);
                onSuccess();
            } else {
                toast.error(result.error || 'Error al bloquear la agenda');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-destructive" />
                        {userRole === 'admin' ? 'Bloquear agenda' : 'Bloquear mi agenda'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Selector de profesional (solo admin) */}
                    {userRole === 'admin' && professionals && (
                        <div className="space-y-1.5">
                            <Label>Profesional *</Label>
                            <Select value={professionalId} onValueChange={setProfessionalId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar profesional..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {professionals.map((prof) => (
                                        <SelectItem key={prof.id} value={prof.id}>
                                            {prof.displayName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Tipo de bloqueo */}
                    <div className="space-y-1.5">
                        <Label id="block-type-label">Tipo de bloqueo *</Label>
                        <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="block-type-label">
                            {BLOCK_TYPE_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = blockType === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setBlockType(opt.value)}
                                        className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border/60 hover:bg-muted/50 text-muted-foreground'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-xs font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fecha de inicio */}
                    {blockType !== 'full' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="block-start-date">Fecha de inicio *</Label>
                            <Input
                                id="block-start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Motivo */}
                    <div className="space-y-1.5">
                        <Label htmlFor="block-reason">Motivo *</Label>
                        <Textarea
                            id="block-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: Vacaciones, capacitación, licencia médica..."
                            maxLength={500}
                            rows={3}
                        />
                        <p className="text-[11px] text-muted-foreground text-right">
                            {reason.length}/500
                        </p>
                    </div>

                    {/* Preview de citas afectadas */}
                    {professionalId && startDate && (
                        <div className="rounded-lg border border-border/60 overflow-hidden">
                            {isLoadingAffected ? (
                                <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verificando citas...
                                </div>
                            ) : affected.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 dark:bg-amber-500/20 border-b border-amber-500/20 dark:border-amber-500/30">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                            Se cancelarán {affected.length} {affected.length === 1 ? 'cita' : 'citas'} automáticamente
                                        </p>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto divide-y divide-border/30">
                                        {affected.map((apt, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                                                <span className="tabular-nums text-muted-foreground">
                                                    {format(new Date(apt.date), 'dd/MM', { locale: es })} {apt.startTime}
                                                </span>
                                                <span className="truncate font-medium">{apt.serviceName}</span>
                                                <span className="ml-auto truncate text-muted-foreground">{apt.clientName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                                    No hay citas programadas en este periodo
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
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isPending || !professionalId || !startDate || reason.length < 5}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Bloqueando...
                            </>
                        ) : (
                            <>
                                <Ban className="h-4 w-4" />
                                Bloquear agenda
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
