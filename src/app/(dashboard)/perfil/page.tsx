/**
 * @fileoverview Página de edición de perfil de usuario.
 * Accesible para todos los roles desde el dropdown de usuario.
 * Secciones: avatar, información personal, preferencias, contraseña.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Camera,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Phone,
    Save,
    Trash2,
    Upload,
    UserCircle,
    Globe,
    Shield,
} from 'lucide-react';
import {
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar,
    removeAvatar,
} from '@/actions/profile';
import type { UserProfile } from '@/actions/profile';
import { toast } from 'sonner';

/** Etiquetas de rol en español */
const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    professional: 'Profesional',
    client: 'Cliente',
};

/** Colores de badge por rol */
const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-primary/10 text-primary hover:bg-primary/20',
    professional: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30',
    client: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30',
};

/** Opciones de locale */
const LOCALE_OPTIONS = [
    { value: 'es-CL', label: 'Español (Chile)', description: 'Formato chileno — CLP, dd/MM/yyyy' },
    { value: 'es-MX', label: 'Español (México)', description: 'Formato mexicano — MXN, dd/MM/yyyy' },
];

/** Obtener iniciales del nombre */
function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const passwordFormRef = useRef<HTMLFormElement>(null);

    const loadProfile = async () => {
        const result = await getProfile();
        if (result.success && result.data) {
            setProfile(result.data);
        } else {
            setError(result.error || 'Error al cargar el perfil');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        startTransition(loadProfile);
    }, []);

    /** Guardar información personal + preferencias */
    const handleProfileSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.success) {
                toast.success('Perfil actualizado correctamente');
                const refreshed = await getProfile();
                if (refreshed.success && refreshed.data) {
                    setProfile(refreshed.data);
                }
            } else {
                toast.error(result.error || 'Error al actualizar');
            }
        });
    };

    /** Cambiar contraseña */
    const handlePasswordSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await changePassword(formData);
            if (result.success) {
                toast.success('Contraseña actualizada correctamente');
                passwordFormRef.current?.reset();
                setShowCurrentPassword(false);
                setShowNewPassword(false);
            } else {
                toast.error(result.error || 'Error al cambiar la contraseña');
            }
        });
    };

    /** Subir avatar */
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        const formData = new FormData();
        formData.set('avatar', file);

        const result = await updateAvatar(formData);
        if (result.success && result.data) {
            toast.success('Foto de perfil actualizada');
            setProfile((prev) => prev ? { ...prev, avatar: result.data!.avatarUrl } : prev);
        } else {
            toast.error(result.error || 'Error al subir la imagen');
        }
        setAvatarUploading(false);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /** Eliminar avatar */
    const handleRemoveAvatar = () => {
        startTransition(async () => {
            const result = await removeAvatar();
            if (result.success) {
                toast.success('Foto de perfil eliminada');
                setProfile((prev) => prev ? { ...prev, avatar: undefined } : prev);
            } else {
                toast.error(result.error || 'Error al eliminar la imagen');
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground">Cargando perfil...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <UserCircle className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground">{error || 'No se pudo cargar el perfil'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6 sm:p-8"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex items-center gap-5">
                    <div className="relative group">
                        <Avatar className="h-18 w-18 ring-3 ring-offset-3 ring-offset-background ring-primary/20">
                            {profile.avatar ? (
                                <AvatarImage src={profile.avatar} alt={profile.name} asChild>
                                    <Image
                                        src={profile.avatar}
                                        alt={profile.name}
                                        width={72}
                                        height={72}
                                        className="object-cover"
                                    />
                                </AvatarImage>
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/15 text-primary text-xl font-semibold">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        {avatarUploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
                            <Badge className={`text-[10px] border-0 ${ROLE_COLORS[profile.role] || 'bg-muted text-muted-foreground'}`}>
                                {ROLE_LABELS[profile.role]}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{profile.email}</p>
                    </div>
                </div>
            </div>

            {/* ── Sección de avatar ── */}
            <Card
                className="relative overflow-hidden border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Camera className="h-4.5 w-4.5 text-primary" />
                        Foto de perfil
                    </CardTitle>
                    <CardDescription>
                        Sube una imagen en JPG, PNG o WebP (máximo 5 MB)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-5">
                        <Avatar className="h-20 w-20 ring-2 ring-offset-2 ring-offset-background ring-border/30">
                            {profile.avatar ? (
                                <AvatarImage src={profile.avatar} alt={profile.name} asChild>
                                    <Image
                                        src={profile.avatar}
                                        alt={profile.name}
                                        width={80}
                                        height={80}
                                        className="object-cover"
                                    />
                                </AvatarImage>
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/15 text-primary text-xl font-semibold">
                                {getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-border/60"
                                disabled={avatarUploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {avatarUploading ? 'Subiendo...' : 'Subir imagen'}
                            </Button>
                            {profile.avatar && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isPending}
                                    className="text-destructive hover:text-destructive border-border/60"
                                    onClick={handleRemoveAvatar}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Formulario de información personal + preferencias ── */}
            <form action={handleProfileSubmit} className="space-y-6">
                {/* Información personal */}
                <Card
                    className="relative overflow-hidden border-border/50"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserCircle className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
                            Información personal
                        </CardTitle>
                        <CardDescription>
                            Actualiza tu nombre y datos de contacto
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={profile.name}
                                placeholder="Tu nombre"
                                className="border-border/60"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                    No editable
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={profile.phone || ''}
                                    placeholder="+56 9 1234 5678"
                                    className="pl-9 border-border/60"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferencias */}
                <Card
                    className="relative overflow-hidden border-border/50"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400" />
                            Preferencias
                        </CardTitle>
                        <CardDescription>
                            Configura tu idioma y formato regional
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="preferredLocale">Idioma y región</Label>
                            <Select
                                name="preferredLocale"
                                defaultValue={profile.preferredLocale}
                            >
                                <SelectTrigger id="preferredLocale" className="border-border/60">
                                    <SelectValue placeholder="Selecciona idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LOCALE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div>
                                                <span>{option.label}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Botón guardar perfil */}
                <div className="flex justify-end" style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <Separator className="bg-border/40" />

            {/* ── Cambiar contraseña — formulario independiente ── */}
            <form ref={passwordFormRef} action={handlePasswordSubmit} className="space-y-6">
                <Card
                    className="relative overflow-hidden border-border/50"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.25s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Shield className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
                            Cambiar contraseña
                        </CardTitle>
                        <CardDescription>
                            Ingresa tu contraseña actual y luego la nueva. Mínimo 8 caracteres,
                            una mayúscula y un número.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Contraseña actual</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    placeholder="Tu contraseña actual"
                                    required
                                    className="pr-10 border-border/60"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    tabIndex={-1}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    className="pr-10 border-border/60"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repite la nueva contraseña"
                                required
                                className="border-border/60"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end" style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}>
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={isPending}
                        className="border-border/60"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Cambiar contraseña
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
