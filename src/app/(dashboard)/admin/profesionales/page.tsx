/**
 * @fileoverview Página de gestión de profesionales del admin.
 * Lista de profesionales del negocio con CRUD completo.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    UserPlus,
    Star,
    Calendar,
    Scissors,
    Search,
    Users,
    Activity,
    Loader2,
    Pencil,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createProfessional,
    getBusinessProfessionals,
    updateProfessional,
    deleteProfessional,
} from '@/actions/professionals';
import type { IProfessional } from '@/types';

/** Colores de acento rotados por tarjeta */
const CARD_ACCENTS = [
    { gradient: 'from-primary to-primary/40', bg: 'bg-primary/10', hover: 'hover:shadow-primary/5', text: 'text-primary' },
    { gradient: 'from-blue-500 to-blue-400/40', bg: 'bg-blue-500/10', hover: 'hover:shadow-blue-500/5', text: 'text-blue-500' },
    { gradient: 'from-emerald-500 to-emerald-400/40', bg: 'bg-emerald-500/10', hover: 'hover:shadow-emerald-500/5', text: 'text-emerald-500' },
];

export default function ProfessionalsPage() {
    const [professionals, setProfessionals] = useState<IProfessional[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPro, setEditingPro] = useState<IProfessional | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadProfessionals = () => {
        startTransition(async () => {
            const result = await getBusinessProfessionals();
            if (result.success && result.data) {
                setProfessionals(result.data);
            } else {
                toast.error(result.error || 'Error al cargar profesionales');
            }
        });
    };

    useEffect(() => {
        loadProfessionals();
    }, []);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            let result;
            if (editingPro) {
                result = await updateProfessional(editingPro._id.toString(), formData);
            } else {
                result = await createProfessional(formData);
            }

            if (result.success) {
                toast.success(editingPro ? 'Profesional actualizado' : 'Profesional agregado');
                setIsDialogOpen(false);
                setEditingPro(null);
                loadProfessionals();
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleDelete = (professionalId: string) => {
        startTransition(async () => {
            const result = await deleteProfessional(professionalId);
            if (result.success) {
                toast.success('Profesional eliminado');
                loadProfessionals();
            } else {
                toast.error(result.error);
            }
        });
    };

    const activeProfessionals = professionals.filter((p) => p.isActive);

    const filtered = activeProfessionals.filter((p) =>
        p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/8 via-background to-primary/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Users className="h-7 w-7 text-emerald-500" />
                            Profesionales
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona el equipo de tu negocio
                        </p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingPro(null);
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 shrink-0">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Agregar profesional
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingPro ? 'Editar profesional' : 'Nuevo profesional'}
                                </DialogTitle>
                            </DialogHeader>
                            <form action={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="proName">Nombre</Label>
                                    <Input
                                        id="proName"
                                        name="name"
                                        placeholder="Nombre completo"
                                        defaultValue={editingPro?.displayName}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proEmail">Email</Label>
                                    <Input
                                        id="proEmail"
                                        name="email"
                                        type="email"
                                        placeholder="email@ejemplo.com"
                                        defaultValue={editingPro ? '' : ''}
                                        required
                                        disabled={!!editingPro}
                                    />
                                    {!editingPro && (
                                        <p className="text-xs text-muted-foreground">
                                            Se creará una cuenta con contraseña temporal: Password123
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proSpecialties">Especialidades</Label>
                                    <Input
                                        id="proSpecialties"
                                        name="specialties"
                                        placeholder="Corte, Barba, Color (separar con comas)"
                                        defaultValue={editingPro?.specialties.join(', ')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proBio">Biografía</Label>
                                    <Textarea
                                        id="proBio"
                                        name="bio"
                                        placeholder="Describe la experiencia del profesional..."
                                        defaultValue={editingPro?.bio}
                                        rows={3}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                    disabled={isPending}
                                >
                                    {isPending ? 'Guardando...' : editingPro ? 'Actualizar' : 'Agregar profesional'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ── Stats rápidas ── */}
            <div className="grid gap-4 sm:grid-cols-3" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Total equipo</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Users className="h-4.5 w-4.5 text-primary" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{professionals.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">profesionales</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Activos</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                                <Activity className="h-4.5 w-4.5 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{activeProfessionals.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">disponibles</p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Calificación promedio</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                                <Star className="h-4.5 w-4.5 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">
                            {activeProfessionals.length > 0
                                ? (activeProfessionals.reduce((sum, p) => sum + p.rating, 0) / activeProfessionals.length).toFixed(1)
                                : '0.0'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">estrellas</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Búsqueda ── */}
            <div
                className="relative max-w-md"
                style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar profesional..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-border/60"
                />
            </div>

            {/* ── Grid de profesionales ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isPending && professionals.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                        <p className="text-sm text-muted-foreground">Cargando profesionales...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground text-sm">
                            {searchQuery ? 'No se encontraron profesionales' : 'No hay profesionales aún'}
                        </p>
                        {!searchQuery && (
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Agrega tu primer profesional para comenzar
                            </p>
                        )}
                    </div>
                ) : (
                    filtered.map((pro, i) => {
                        const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
                        return (
                            <Card
                                key={pro._id.toString()}
                                className={`group relative overflow-hidden border-border/50 hover:shadow-lg ${accent.hover} transition-all duration-300 hover:-translate-y-0.5`}
                                style={{ animation: `fadeIn 0.4s ease-out ${0.15 + i * 0.05}s both` }}
                            >
                                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${accent.gradient}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-offset-background ring-border/30">
                                            <AvatarFallback className={`${accent.bg} ${accent.text} font-semibold`}>
                                                {pro.displayName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold text-lg">
                                                    {pro.displayName}
                                                </h3>
                                                <Badge
                                                    className={`text-[10px] border-0 shrink-0 ${
                                                        pro.isActive
                                                            ? 'bg-emerald-500/10 text-emerald-600'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {pro.isActive ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </div>
                                            {pro.bio && (
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {pro.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Especialidades */}
                                    {pro.specialties.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {pro.specialties.map((s) => (
                                                <Badge key={s} variant="outline" className="text-xs border-border/60">
                                                    <Scissors className="h-2.5 w-2.5 mr-1 opacity-60" />
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Métricas + Acciones */}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                                    <Star className="h-3.5 w-3.5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm">{pro.rating.toFixed(1)}</span>
                                                    <p className="text-[10px] text-muted-foreground">calificación</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent.bg}`}>
                                                    <Calendar className={`h-3.5 w-3.5 ${accent.text}`} />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-sm">{pro.totalReviews}</span>
                                                    <p className="text-[10px] text-muted-foreground">reseñas</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500"
                                                onClick={() => {
                                                    setEditingPro(pro);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                                                onClick={() => handleDelete(pro._id.toString())}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
