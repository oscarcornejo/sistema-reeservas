/**
 * @fileoverview Dialogo de confirmacion para eliminar un cliente.
 * Muestra advertencia y requiere confirmacion antes de proceder.
 */

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Trash2,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { deleteClient } from '@/actions/clients';

interface DeleteClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: { _id: string; name: string } | null;
    onSuccess: () => void;
}

export function DeleteClientDialog({
    open,
    onOpenChange,
    client,
    onSuccess,
}: DeleteClientDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!client) return;

        startTransition(async () => {
            const fd = new FormData();
            fd.set('clientId', client._id);

            const result = await deleteClient(fd);
            if (result.success) {
                toast.success('Cliente eliminado');
                onOpenChange(false);
                onSuccess();
                router.refresh();
            } else {
                toast.error(result.error || 'Error al eliminar el cliente');
            }
        });
    };

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Eliminar cliente
                    </DialogTitle>
                    <DialogDescription>
                        Esta accion no se puede deshacer
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Advertencia */}
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Eliminar a {client.name}?
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Se eliminara el cliente y su historial de visitas. Las citas existentes no se eliminan.
                            </p>
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
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isPending}
                        onClick={handleDelete}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            'Eliminar cliente'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
