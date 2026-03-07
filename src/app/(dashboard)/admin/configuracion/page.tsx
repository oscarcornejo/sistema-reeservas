/**
 * @fileoverview Página de configuración del negocio.
 * Permite al admin editar información general, ubicación, horarios,
 * preferencias de pago y visibilidad pública del negocio.
 */

'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Building2,
    MapPin,
    Clock,
    CreditCard,
    Globe,
    Loader2,
    Settings,
    ImageIcon,
    Palette,
    Plus,
    Trash2,
    X,
    Check,
} from 'lucide-react';
import {
    getBusinessSettings,
    updateBusinessSettings,
    updateBusinessLocation,
    updateWorkingHours,
    updateBusinessPreferences,
    updateBusinessTheme,
    addGalleryImage,
    removeGalleryImage,
} from '@/actions/business';
import { BUSINESS_THEMES } from '@/lib/themes';
import { DAYS_OF_WEEK, BUSINESS_CATEGORIES } from '@/lib/utils/format';
import { toast } from 'sonner';
import { canAccess } from '@/lib/utils/plan-limits';
import type { IBusiness, WorkingHour } from '@/types';

/** Horarios por defecto para los 7 días */
const DEFAULT_WORKING_HOURS: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i as WorkingHour['dayOfWeek'],
    isOpen: i >= 1 && i <= 5,
    openTime: '09:00',
    closeTime: '18:00',
}));

/** Zonas horarias soportadas */
const TIMEZONES = [
    { value: 'America/Santiago', label: 'Chile (Santiago)' },
    { value: 'America/Mexico_City', label: 'México (Ciudad de México)' },
    { value: 'America/Cancun', label: 'México (Cancún)' },
    { value: 'America/Tijuana', label: 'México (Tijuana)' },
] as const;

export default function ConfiguracionPage() {
    const [business, setBusiness] = useState<IBusiness | null>(null);
    const [hours, setHours] = useState<WorkingHour[]>(DEFAULT_WORKING_HOURS);
    const [isPending, startTransition] = useTransition();

    // Cargar datos del negocio al montar
    useEffect(() => {
        startTransition(async () => {
            const result = await getBusinessSettings();
            if (result.success && result.data) {
                setBusiness(result.data);
                // Llenar horarios — asegurar que siempre haya 7 días
                if (result.data.workingHours?.length === 7) {
                    setHours(result.data.workingHours);
                } else {
                    const merged = DEFAULT_WORKING_HOURS.map((def) => {
                        const existing = result.data!.workingHours?.find(
                            (h) => h.dayOfWeek === def.dayOfWeek
                        );
                        return existing || def;
                    });
                    setHours(merged);
                }
            } else {
                toast.error(result.error || 'Error al cargar configuración');
            }
        });
    }, []);

    // === Handlers de guardado por sección ===

    const handleSaveGeneral = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateBusinessSettings(formData);
            if (result.success) {
                toast.success('Información general actualizada');
                // Refrescar datos locales
                const refresh = await getBusinessSettings();
                if (refresh.success && refresh.data) setBusiness(refresh.data);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleSaveLocation = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateBusinessLocation(formData);
            if (result.success) {
                toast.success('Ubicación actualizada');
                const refresh = await getBusinessSettings();
                if (refresh.success && refresh.data) setBusiness(refresh.data);
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleSaveHours = () => {
        startTransition(async () => {
            const result = await updateWorkingHours(hours);
            if (result.success) {
                toast.success('Horarios actualizados');
            } else {
                toast.error(result.error);
            }
        });
    };

    const handleSavePreferences = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateBusinessPreferences(formData);
            if (result.success) {
                toast.success('Preferencias actualizadas');
                const refresh = await getBusinessSettings();
                if (refresh.success && refresh.data) setBusiness(refresh.data);
            } else {
                toast.error(result.error);
            }
        });
    };

    // === Helpers de horarios ===

    const updateHour = (dayOfWeek: number, field: keyof WorkingHour, value: string | boolean) => {
        setHours((prev) =>
            prev.map((h) =>
                h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
            )
        );
    };

    if (!business && isPending) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground">Cargando configuración...</p>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Settings className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground">No se encontró el negocio. Verifica tu cuenta.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <Settings className="h-7 w-7 text-primary" />
                        Configuración
                    </h1>
                    <p className="text-muted-foreground">
                        Administra la información y preferencias de{' '}
                        <span className="font-medium text-foreground">{business.name}</span>
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                <TabsList variant="line">
                    <TabsTrigger value="general" className="gap-2 after:bg-primary">
                        <Building2 className="h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="ubicacion" className="gap-2 after:bg-blue-500 dark:after:bg-blue-400">
                        <MapPin className="h-4 w-4" />
                        Ubicación
                    </TabsTrigger>
                    <TabsTrigger value="horarios" className="gap-2 after:bg-emerald-500 dark:after:bg-emerald-400">
                        <Clock className="h-4 w-4" />
                        Horarios
                    </TabsTrigger>
                    <TabsTrigger value="pagos" className="gap-2 after:bg-amber-500 dark:after:bg-amber-400">
                        <CreditCard className="h-4 w-4" />
                        Pagos
                    </TabsTrigger>
                    <TabsTrigger value="galeria" className="gap-2 after:bg-fuchsia-500 dark:after:bg-fuchsia-400">
                        <ImageIcon className="h-4 w-4" />
                        Galería
                    </TabsTrigger>
                    <TabsTrigger value="tema" className="gap-2 after:bg-rose-500 dark:after:bg-rose-400">
                        <Palette className="h-4 w-4" />
                        Tema
                    </TabsTrigger>
                    <TabsTrigger value="publicacion" className="gap-2 after:bg-violet-500 dark:after:bg-violet-400">
                        <Globe className="h-4 w-4" />
                        Publicación
                    </TabsTrigger>
                </TabsList>

                {/* ============ Tab: General ============ */}
                <TabsContent value="general">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                        <CardHeader>
                            <CardTitle>Información general</CardTitle>
                            <CardDescription>
                                Nombre, descripción y categoría de tu negocio
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSaveGeneral} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del negocio</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={business.name}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">URL pública (slug)</Label>
                                    <Input
                                        id="slug"
                                        value={business.slug}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        El slug se genera automáticamente y no puede editarse
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        defaultValue={business.description || ''}
                                        rows={4}
                                        placeholder="Describe tu negocio..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Categoría</Label>
                                    <Select
                                        name="category"
                                        defaultValue={business.category}
                                    >
                                        <SelectTrigger id="category">
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

                                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ Tab: Ubicación ============ */}
                <TabsContent value="ubicacion">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40 dark:from-blue-400 dark:to-blue-500/40" />
                        <CardHeader>
                            <CardTitle>Ubicación y contacto</CardTitle>
                            <CardDescription>
                                Dirección, teléfono y datos de contacto del negocio
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSaveLocation} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        defaultValue={business.address}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ciudad</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            defaultValue={business.city}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">Región / Estado</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            defaultValue={business.state}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">País</Label>
                                        <Select
                                            name="country"
                                            defaultValue={business.country}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CL">Chile</SelectItem>
                                                <SelectItem value="MX">México</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            defaultValue={business.phone}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email de contacto</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={business.email}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Sitio web</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        defaultValue={business.website || ''}
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitud</Label>
                                        <Input
                                            id="latitude"
                                            name="latitude"
                                            type="number"
                                            step="any"
                                            defaultValue={business.location?.coordinates?.[1]}
                                            placeholder="-33.4489"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitud</Label>
                                        <Input
                                            id="longitude"
                                            name="longitude"
                                            type="number"
                                            step="any"
                                            defaultValue={business.location?.coordinates?.[0]}
                                            placeholder="-70.6693"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ Tab: Horarios ============ */}
                <TabsContent value="horarios">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40 dark:from-emerald-400 dark:to-emerald-500/40" />
                        <CardHeader>
                            <CardTitle>Horarios de trabajo</CardTitle>
                            <CardDescription>
                                Configura los días y horas de atención de tu negocio
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {hours
                                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                                    .map((hour) => (
                                        <div
                                            key={hour.dayOfWeek}
                                            className="flex items-center gap-4 py-2 border-b last:border-b-0"
                                        >
                                            <div className="w-28 flex items-center gap-2">
                                                <Switch
                                                    checked={hour.isOpen}
                                                    onCheckedChange={(checked) =>
                                                        updateHour(hour.dayOfWeek, 'isOpen', checked)
                                                    }
                                                />
                                                <span className="text-sm font-medium">
                                                    {DAYS_OF_WEEK[hour.dayOfWeek]}
                                                </span>
                                            </div>

                                            {hour.isOpen ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={hour.openTime}
                                                        onChange={(e) =>
                                                            updateHour(hour.dayOfWeek, 'openTime', e.target.value)
                                                        }
                                                        className="w-32"
                                                    />
                                                    <span className="text-muted-foreground">a</span>
                                                    <Input
                                                        type="time"
                                                        value={hour.closeTime}
                                                        onChange={(e) =>
                                                            updateHour(hour.dayOfWeek, 'closeTime', e.target.value)
                                                        }
                                                        className="w-32"
                                                    />
                                                </div>
                                            ) : (
                                                <Badge variant="secondary">Cerrado</Badge>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            <Button
                                className="mt-6 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                                onClick={handleSaveHours}
                                disabled={isPending}
                            >
                                {isPending ? 'Guardando...' : 'Guardar horarios'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ Tab: Pagos y preferencias ============ */}
                <TabsContent value="pagos">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40 dark:from-amber-400 dark:to-amber-500/40" />
                        <CardHeader>
                            <CardTitle>Pagos y políticas</CardTitle>
                            <CardDescription>
                                Moneda, pagos en línea y política de cancelación
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSavePreferences} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Zona horaria</Label>
                                        <Select
                                            name="timezone"
                                            defaultValue={business.timezone}
                                        >
                                            <SelectTrigger id="timezone">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONES.map((tz) => (
                                                    <SelectItem key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Moneda</Label>
                                        <Select
                                            name="currency"
                                            defaultValue={business.currency}
                                        >
                                            <SelectTrigger id="currency">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                                                <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {canAccess(business.subscriptionPlan, 'advancedConfig') ? (
                                    <>
                                        <div className="space-y-4 pt-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">Pagos en línea</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Permitir que los clientes paguen al reservar
                                                    </p>
                                                </div>
                                                <SwitchWithHidden
                                                    name="allowOnlinePayments"
                                                    defaultChecked={business.allowOnlinePayments}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">Pago anticipado requerido</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Exigir pago al momento de agendar la cita
                                                    </p>
                                                </div>
                                                <SwitchWithHidden
                                                    name="requirePaymentUpfront"
                                                    defaultChecked={business.requirePaymentUpfront}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cancellationPolicy">Política de cancelación</Label>
                                            <Textarea
                                                id="cancellationPolicy"
                                                name="cancellationPolicy"
                                                defaultValue={business.cancellationPolicy || ''}
                                                rows={3}
                                                placeholder="Ej: Las cancelaciones deben realizarse con al menos 24 horas de anticipación..."
                                            />
                                            <p className="text-xs text-muted-foreground">Máximo 500 caracteres</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 pt-2 opacity-60">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Pagos en línea</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Permitir que los clientes paguen al reservar
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px]">Plan Corporativo</Badge>
                                                <Switch disabled />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Pago anticipado requerido</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Exigir pago al momento de agendar la cita
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px]">Plan Corporativo</Badge>
                                                <Switch disabled />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Política de cancelación</Label>
                                            <Textarea disabled rows={3} placeholder="Disponible en el plan Corporativo..." />
                                            <Badge variant="secondary" className="text-[10px]">Plan Corporativo</Badge>
                                        </div>
                                        {/* Campos ocultos para mantener valores actuales */}
                                        <input type="hidden" name="allowOnlinePayments" value="false" />
                                        <input type="hidden" name="requirePaymentUpfront" value="false" />
                                        <input type="hidden" name="cancellationPolicy" value={business.cancellationPolicy || ''} />
                                    </div>
                                )}

                                {/* Campo oculto para isPublished — mantener valor actual */}
                                <input
                                    type="hidden"
                                    name="isPublished"
                                    value={business.isPublished ? 'true' : 'false'}
                                />

                                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ Tab: Galería ============ */}
                <TabsContent value="galeria">
                    <GalleryTab
                        gallery={business.gallery ?? []}
                        isPending={isPending}
                        onUpload={(file) => {
                            startTransition(async () => {
                                const formData = new FormData();
                                formData.append('image', file);
                                const result = await addGalleryImage(formData);
                                if (result.success) {
                                    toast.success('Imagen agregada a la galería');
                                    const refresh = await getBusinessSettings();
                                    if (refresh.success && refresh.data) setBusiness(refresh.data);
                                } else {
                                    toast.error(result.error);
                                }
                            });
                        }}
                        onRemove={(url) => {
                            startTransition(async () => {
                                const result = await removeGalleryImage(url);
                                if (result.success) {
                                    toast.success('Imagen eliminada');
                                    const refresh = await getBusinessSettings();
                                    if (refresh.success && refresh.data) setBusiness(refresh.data);
                                } else {
                                    toast.error(result.error);
                                }
                            });
                        }}
                    />
                </TabsContent>

                {/* ============ Tab: Tema ============ */}
                <TabsContent value="tema">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 to-rose-400/40 dark:from-rose-400 dark:to-rose-500/40" />
                        <CardHeader>
                            <CardTitle>Tema visual</CardTitle>
                            <CardDescription>
                                Personaliza los colores de tu página pública. El tema seleccionado se aplica automáticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {BUSINESS_THEMES.map((theme) => {
                                    const isSelected = (business.theme || 'salud') === theme.id;
                                    return (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => {
                                                if (isSelected) return;
                                                const prevTheme = business.theme;
                                                // Optimistic update — feedback visual inmediato
                                                setBusiness((prev) => prev ? { ...prev, theme: theme.id } : prev);
                                                startTransition(async () => {
                                                    try {
                                                        const result = await updateBusinessTheme(theme.id);
                                                        if (result.success) {
                                                            toast.success(`Tema "${theme.label}" aplicado`);
                                                        } else {
                                                            toast.error(result.error || 'Error al aplicar el tema');
                                                            // Revertir al tema anterior
                                                            setBusiness((prev) => prev ? { ...prev, theme: prevTheme } : prev);
                                                        }
                                                    } catch {
                                                        toast.error('Error al aplicar el tema');
                                                        // Revertir al tema anterior
                                                        setBusiness((prev) => prev ? { ...prev, theme: prevTheme } : prev);
                                                    }
                                                });
                                            }}
                                            className={`relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md disabled:opacity-50 ${
                                                isSelected
                                                    ? 'border-primary shadow-md shadow-primary/10'
                                                    : 'border-border/50 hover:border-border'
                                            }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                            )}

                                            {/* Swatches de color */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div
                                                    className="h-8 w-8 rounded-lg shadow-sm"
                                                    style={{ backgroundColor: theme.colors.primary }}
                                                />
                                                <div
                                                    className="h-8 w-8 rounded-lg shadow-sm"
                                                    style={{ backgroundColor: theme.colors.accent }}
                                                />
                                                <div
                                                    className="h-8 w-8 rounded-lg border shadow-sm"
                                                    style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold flex items-center gap-1.5">
                                                    <span>{theme.emoji}</span>
                                                    {theme.label}
                                                </p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {theme.description}
                                                </p>
                                            </div>

                                            {/* Barra preview */}
                                            <div className="mt-3 h-2 rounded-full overflow-hidden flex">
                                                <div className="flex-1" style={{ backgroundColor: theme.colors.primary }} />
                                                <div className="flex-1" style={{ backgroundColor: theme.colors.accent }} />
                                                <div className="flex-1" style={{ backgroundColor: theme.colors.muted }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ Tab: Publicación ============ */}
                <TabsContent value="publicacion">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 to-violet-400/40 dark:from-violet-400 dark:to-violet-500/40" />
                        <CardHeader>
                            <CardTitle>Visibilidad pública</CardTitle>
                            <CardDescription>
                                Controla si tu negocio aparece en el marketplace público
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSavePublish} className="space-y-4">
                                {/* Campos ocultos para mantener preferencias actuales */}
                                <input type="hidden" name="timezone" value={business.timezone} />
                                <input type="hidden" name="currency" value={business.currency} />
                                <input
                                    type="hidden"
                                    name="allowOnlinePayments"
                                    value={business.allowOnlinePayments ? 'true' : 'false'}
                                />
                                <input
                                    type="hidden"
                                    name="requirePaymentUpfront"
                                    value={business.requirePaymentUpfront ? 'true' : 'false'}
                                />
                                <input
                                    type="hidden"
                                    name="cancellationPolicy"
                                    value={business.cancellationPolicy || ''}
                                />

                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="space-y-1">
                                        <p className="font-medium">Publicar negocio</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cuando está activo, tu negocio será visible en la búsqueda pública
                                            y los clientes podrán agendar citas en línea.
                                        </p>
                                    </div>
                                    <SwitchWithHidden
                                        name="isPublished"
                                        defaultChecked={business.isPublished}
                                    />
                                </div>

                                {business.isPublished && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Globe className="h-4 w-4" />
                                        <span>
                                            Tu negocio es accesible en{' '}
                                            <span className="font-mono text-foreground">
                                                /negocio/{business.slug}
                                            </span>
                                        </span>
                                    </div>
                                )}

                                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                                    {isPending ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

    /** Handler para el tab de publicación — reutiliza updateBusinessPreferences */
    function handleSavePublish(formData: FormData) {
        startTransition(async () => {
            const result = await updateBusinessPreferences(formData);
            if (result.success) {
                toast.success('Visibilidad actualizada');
                const refresh = await getBusinessSettings();
                if (refresh.success && refresh.data) setBusiness(refresh.data);
            } else {
                toast.error(result.error);
            }
        });
    }
}

/** Máximo de imágenes en la galería */
const MAX_GALLERY_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Tab de galería de imágenes del negocio.
 * Permite subir, previsualizar y eliminar imágenes.
 */
function GalleryTab({
    gallery,
    isPending,
    onUpload,
    onRemove,
}: {
    gallery: string[];
    isPending: boolean;
    onUpload: (file: File) => void;
    onRemove: (url: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const canAdd = gallery.length < MAX_GALLERY_IMAGES;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Formato no permitido. Usa JPG, PNG o WebP');
            return;
        }
        if (file.size > MAX_SIZE) {
            toast.error('La imagen no puede superar 5 MB');
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    const handleUpload = () => {
        if (!selectedFile) return;
        onUpload(selectedFile);
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const cancelPreview = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Card className="relative overflow-hidden border-border/50">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-400/40 dark:from-fuchsia-400 dark:to-fuchsia-500/40" />
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Galería de imágenes</span>
                    <Badge variant="secondary" className="text-xs font-normal">
                        {gallery.length} de {MAX_GALLERY_IMAGES}
                    </Badge>
                </CardTitle>
                <CardDescription>
                    Sube fotos de tus instalaciones, trabajos y ambiente. Se mostrarán en tu perfil público.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Grid de imágenes existentes */}
                {gallery.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {gallery.map((url) => (
                            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50">
                                <Image
                                    src={url}
                                    alt="Imagen de galería"
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => onRemove(url)}
                                    disabled={isPending}
                                    className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Eliminar imagen</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {gallery.length === 0 && !preview && (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-xl">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground mb-1">No hay imágenes en la galería</p>
                        <p className="text-xs text-muted-foreground">Sube fotos para mostrar tu negocio</p>
                    </div>
                )}

                {/* Preview de imagen seleccionada */}
                {preview && (
                    <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                        <p className="text-sm font-medium mb-3">Vista previa</p>
                        <div className="relative aspect-video max-w-sm overflow-hidden rounded-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={preview}
                                alt="Vista previa"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <Button
                                onClick={handleUpload}
                                disabled={isPending}
                                size="sm"
                                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            >
                                {isPending ? 'Subiendo...' : 'Subir imagen'}
                            </Button>
                            <Button
                                onClick={cancelPreview}
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Botón para agregar */}
                {canAdd && !preview && (
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPending}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar imagen
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            JPG, PNG o WebP. Máximo 5 MB por imagen.
                        </p>
                    </div>
                )}

                {!canAdd && !preview && (
                    <p className="text-sm text-muted-foreground">
                        Has alcanzado el límite de {MAX_GALLERY_IMAGES} imágenes. Elimina alguna para agregar más.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Switch que incluye un input hidden para enviar su valor en FormData.
 * Los switches nativos no envían valor en forms, así que necesitamos este wrapper.
 */
function SwitchWithHidden({
    name,
    defaultChecked = false,
}: {
    name: string;
    defaultChecked?: boolean;
}) {
    const [checked, setChecked] = useState(defaultChecked);

    return (
        <>
            <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
            <Switch checked={checked} onCheckedChange={setChecked} />
        </>
    );
}
