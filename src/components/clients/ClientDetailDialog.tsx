/**
 * @fileoverview Diálogo unificado de detalle/edición de cliente.
 * Admin: campos editables + citas recientes + guardar cambios.
 * Profesional: campos en modo lectura + citas recientes.
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    User,
    Mail,
    Loader2,
    CalendarClock,
    XCircle,
    CalendarDays,
    X,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { getClientDetail, updateClient } from '@/actions/clients';
import { formatDate, APPOINTMENT_STATUS_CONFIG } from '@/lib/utils/format';
import type { AppointmentStatus } from '@/types';

function getTagStyle(tag: string): string {
    const t = tag.toLowerCase();
    if (t === 'vip') return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
    if (t === 'frecuente') return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
    if (t === 'nuevo') return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    return 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400';
}

export interface ClientData {
    _id: string;
    name: string;
    email: string;
    phone: string;
    tags: string[];
    source: string;
    notes?: string;
}

interface AppointmentRow {
    _id: string;
    date: string;
    startTime: string;
    status: string;
    serviceId?: { name: string };
    professionalId?: { displayName: string };
}

interface ClientDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string | null;
    userRole: 'admin' | 'professional';
    onReschedule?: (appointment: any) => void;
    onCancel?: (appointment: any) => void;
    onDelete?: (client: ClientData) => void;
}

export function ClientDetailDialog({
    open,
    onOpenChange,
    clientId,
    userRole,
    onReschedule,
    onCancel,
    onDelete,
}: ClientDetailDialogProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isAdmin = userRole === 'admin';

    // Datos cargados
    const [client, setClient] = useState<ClientData | null>(null);
    const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Campos editables (solo admin)
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    // Cargar datos al abrir
    useEffect(() => {
        if (open && clientId) {
            setIsLoading(true);
            setError(null);
            setClient(null);
            setAppointments([]);

            getClientDetail(clientId).then((result) => {
                if (result.success && result.data) {
                    const data = result.data as unknown as { client: ClientData; appointments: AppointmentRow[] };
                    setClient(data.client);
                    setAppointments(data.appointments);
                    // Inicializar campos editables
                    setName(data.client.name);
                    setPhone(data.client.phone || '');
                    setNotes(data.client.notes || '');
                    setTags([...data.client.tags]);
                    setTagInput('');
                } else {
                    setError(result.error || 'Error al cargar los datos del cliente');
                }
                setIsLoading(false);
            });
        }
    }, [open, clientId]);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = tagInput.trim();
            if (value && !tags.includes(value)) {
                setTags((prev) => [...prev, value]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
    };

    const handleSave = () => {
        if (!client || !name.trim()) return;

        startTransition(async () => {
            const fd = new FormData();
            fd.set('clientId', client._id);
            fd.set('name', name.trim());
            fd.set('phone', phone.trim());
            fd.set('notes', notes.trim());
            fd.set('tags', JSON.stringify(tags));

            const result = await updateClient(fd);
            if (result.success) {
                toast.success('Cliente actualizado');
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error(result.error || 'Error al actualizar el cliente');
            }
        });
    };

    const canModifyAppointment = (status: string) =>
        ['pending', 'confirmed'].includes(status);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[85vh] flex flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Detalle del cliente
                    </DialogTitle>
                    <DialogDescription>
                        {isAdmin
                            ? 'Modifica los datos del cliente y gestiona sus citas'
                            : 'Información del cliente y sus citas recientes'}
                    </DialogDescription>
                </DialogHeader>

                {/* Estado de carga */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-center justify-center py-12">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Contenido scrollable */}
                {client && !isLoading && (
                    <div className="space-y-4 overflow-y-auto px-6 pb-2 min-h-0">
                        {/* -- Campos del cliente -- */}
                        {isAdmin ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="client-name">Nombre *</Label>
                                    <Input
                                        id="client-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nombre completo"
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client-phone">Teléfono</Label>
                                    <Input
                                        id="client-phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+56 9 1234 5678"
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client-notes">Notas</Label>
                                    <Textarea
                                        id="client-notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Notas internas sobre el cliente..."
                                        rows={3}
                                        className="resize-none"
                                        disabled={isPending}
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Etiquetas</Label>
                                    {tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    className={`text-[10px] border-0 gap-1 pr-1 ${getTagStyle(tag)}`}
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTag(tag)}
                                                        className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                                                        disabled={isPending}
                                                        aria-label={`Eliminar etiqueta ${tag}`}
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder="Escribe y presiona Enter para agregar..."
                                            className="pl-9"
                                            disabled={isPending}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Presiona Enter para agregar una etiqueta
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* -- Modo lectura (profesional) -- */
                            <>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Nombre</Label>
                                    <p className="text-sm font-medium">{client.name}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    {client.email}
                                </div>
                                {client.phone && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Teléfono</Label>
                                        <p className="text-sm font-medium">{client.phone}</p>
                                    </div>
                                )}
                                {client.tags.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Etiquetas</Label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {client.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    className={`text-[10px] border-0 ${getTagStyle(tag)}`}
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {client.notes && (
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Notas</Label>
                                        <p className="text-sm text-muted-foreground">{client.notes}</p>
                                    </div>
                                )}
                            </>
                        )}

                        <Separator />

                        {/* -- Citas recientes -- */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                <p className="text-sm font-semibold">
                                    Citas recientes ({appointments.length})
                                </p>
                            </div>

                            {appointments.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Este cliente no tiene citas registradas
                                </p>
                            ) : (
                                <div className="rounded-lg border border-border/60 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="text-xs">Fecha</TableHead>
                                                <TableHead className="text-xs">Servicio</TableHead>
                                                <TableHead className="text-xs">Estado</TableHead>
                                                <TableHead className="text-xs w-20" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {appointments.map((apt) => {
                                                const statusConfig = APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];
                                                return (
                                                    <TableRow key={apt._id}>
                                                        <TableCell className="text-xs tabular-nums py-2">
                                                            {formatDate(apt.date, 'dd/MM/yy')}
                                                        </TableCell>
                                                        <TableCell className="text-xs font-medium py-2 max-w-[160px] truncate">
                                                            {apt.serviceId?.name ?? '—'}
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Badge className={`text-[10px] border-0 ${statusConfig?.color ?? 'bg-gray-100 text-gray-800'}`}>
                                                                {statusConfig?.label ?? apt.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right py-2">
                                                            {canModifyAppointment(apt.status) && (
                                                                <div className="flex gap-1 justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => onReschedule?.(apt)}
                                                                    >
                                                                        <CalendarClock className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                        onClick={() => onCancel?.(apt)}
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* Footer fijo fuera del scroll */}
                {client && !isLoading && (
                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        {isAdmin && onDelete && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    onDelete(client);
                                    onOpenChange(false);
                                }}
                                disabled={isPending}
                            >
                                Eliminar cliente
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            {isAdmin ? 'Cancelar' : 'Cerrar'}
                        </Button>
                        {isAdmin && (
                            <Button
                                size="sm"
                                disabled={!name.trim() || isPending}
                                onClick={handleSave}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar cambios'
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
