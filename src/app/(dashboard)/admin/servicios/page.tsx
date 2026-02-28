/**
 * @fileoverview Página de gestión de servicios del negocio.
 * CRUD de servicios con tabla interactiva y diálogo de creación.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Pencil,
    Trash2,
    Clock,
    DollarSign,
    Scissors,
    Loader2,
    Layers,
} from 'lucide-react';
import { createService, getBusinessServices, updateService, deleteService } from '@/actions/services';
import { formatCurrency, BUSINESS_CATEGORIES } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { IService } from '@/types';

export default function ServicesPage() {
    const [services, setServices] = useState<IService[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<IService | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadServices = () => {
        startTransition(async () => {
            const result = await getBusinessServices();
            if (result.success && result.data) {
                setServices(result.data);
            } else {
                toast.error(result.error || 'Error al cargar servicios');
            }
        });
    };

    useEffect(() => {
        loadServices();
    }, []);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            let result;
            if (editingService) {
                result = await updateService(editingService._id.toString(), formData);
            } else {
                result = await createService(formData);
            }

            if (result.success) {
                toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado');
                setIsDialogOpen(false);
                setEditingService(null);
                loadServices();
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleDelete = (serviceId: string) => {
        startTransition(async () => {
            const result = await deleteService(serviceId);
            if (result.success) {
                toast.success('Servicio eliminado');
                loadServices();
            } else {
                toast.error(result.error);
            }
        });
    };

    const activeServices = services.filter((s) => s.isActive);
    const avgPrice = activeServices.length > 0
        ? activeServices.reduce((sum, s) => sum + s.price, 0) / activeServices.length
        : 0;
    const avgDuration = activeServices.length > 0
        ? Math.round(activeServices.reduce((sum, s) => sum + s.duration, 0) / activeServices.length)
        : 0;

    return (
        <div className="space-y-6">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Scissors className="h-7 w-7 text-emerald-500" />
                            Servicios
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona los servicios que ofrece tu negocio
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingService(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 shrink-0">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo servicio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingService ? 'Editar servicio' : 'Nuevo servicio'}
                                </DialogTitle>
                            </DialogHeader>
                            <form action={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del servicio</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Ej: Corte de cabello"
                                        defaultValue={editingService?.name}
                                        className="border-border/60"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe el servicio..."
                                        defaultValue={editingService?.description}
                                        className="border-border/60"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select
                                        name="category"
                                        defaultValue={editingService?.category}
                                        required
                                    >
                                        <SelectTrigger className="border-border/60">
                                            <SelectValue placeholder="Selecciona categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BUSINESS_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duración (min)</Label>
                                        <Input
                                            id="duration"
                                            name="duration"
                                            type="number"
                                            min={5}
                                            max={480}
                                            placeholder="45"
                                            defaultValue={editingService?.duration}
                                            className="border-border/60"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Precio</Label>
                                        <Input
                                            id="price"
                                            name="price"
                                            type="number"
                                            min={0}
                                            placeholder="15000"
                                            defaultValue={editingService?.price}
                                            className="border-border/60"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                    disabled={isPending}
                                >
                                    {isPending ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear servicio'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ── Stats rápidas ── */}
            <div className="grid gap-4 sm:grid-cols-3" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Precio promedio</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">
                            {avgPrice > 0 ? formatCurrency(avgPrice) : '$0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">por servicio</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Duración promedio</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                                <Clock className="h-4.5 w-4.5 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">
                            {avgDuration > 0 ? `${avgDuration} min` : '0 min'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">por sesión</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Total servicios</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Layers className="h-4.5 w-4.5 text-primary" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{activeServices.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">activos</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Tabla de servicios ── */}
            <Card
                className="relative overflow-hidden border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-accent/40" />
                <CardContent className="p-0">
                    {isPending && services.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                            <p className="text-sm text-muted-foreground">Cargando servicios...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Servicio</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-right">Duración</TableHead>
                                    <TableHead className="text-right">Precio</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16">
                                            <Scissors className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                            <p className="text-muted-foreground text-sm">No hay servicios aún</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">Crea tu primer servicio para comenzar</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activeServices.map((service) => (
                                        <TableRow key={service._id.toString()} className="group">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium group-hover:text-primary transition-colors">
                                                        {service.name}
                                                    </p>
                                                    {service.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="text-[10px] border-0 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                                    {service.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/8 px-2 py-0.5 text-xs font-medium text-blue-600">
                                                    <Clock className="h-3 w-3" />
                                                    {service.duration} min
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-sm font-bold tabular-nums">
                                                    {formatCurrency(service.price)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500"
                                                        onClick={() => {
                                                            setEditingService(service);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                                                        onClick={() => handleDelete(service._id.toString())}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
