/**
 * @fileoverview Diálogo de confirmación para desbloquear una agenda.
 */

'use client';

import { useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarCheck2, Loader2 } from 'lucide-react';
import { removeScheduleBlock } from '@/actions/schedule-blocks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { IScheduleBlockSerialized } from '@/types';

const BLOCK_TYPE_LABELS: Record<string, string> = {
    day: 'Día',
    week: 'Semana',
    month: 'Mes',
    full: 'Completa',
};

interface UnblockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    block: IScheduleBlockSerialized | null;
    onSuccess: () => void;
}

export function UnblockDialog({ open, onOpenChange, block, onSuccess }: UnblockDialogProps) {
    const [isPending, startTransition] = useTransition();

    if (!block) return null;

    const handleUnblock = () => {
        startTransition(async () => {
            const fd = new FormData();
            fd.set('blockId', block._id);

            const result = await removeScheduleBlock(fd);
            if (result.success) {
                toast.success('Agenda desbloqueada exitosamente');
                onSuccess();
            } else {
                toast.error(result.error || 'Error al desbloquear la agenda');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarCheck2 className="h-4 w-4 text-primary" />
                        Desbloquear agenda
                    </DialogTitle>
                    <DialogDescription>
                        ¿Deseas desbloquear esta agenda? Los slots volverán a estar disponibles para reservas.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-lg border border-border/60 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo</span>
                        <span className="font-medium">{BLOCK_TYPE_LABELS[block.blockType] || block.blockType}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Desde</span>
                        <span className="font-medium">
                            {format(new Date(block.startDate), "d 'de' MMMM yyyy", { locale: es })}
                        </span>
                    </div>
                    {block.endDate && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hasta</span>
                            <span className="font-medium">
                                {format(new Date(block.endDate), "d 'de' MMMM yyyy", { locale: es })}
                            </span>
                        </div>
                    )}
                    {!block.endDate && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hasta</span>
                            <span className="font-medium text-destructive">Indefinido</span>
                        </div>
                    )}
                    <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground shrink-0">Motivo</span>
                        <span className="font-medium text-right">{block.reason}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUnblock}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Desbloqueando...
                            </>
                        ) : (
                            'Desbloquear'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
