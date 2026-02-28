/**
 * @fileoverview Página de registro de usuario.
 * Permite crear cuenta como Admin (negocio), Profesional o Cliente.
 * Diseño refinado con selector de roles visual y animaciones.
 */

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Building2,
    User,
    CalendarCheck,
    Loader2,
    UserPlus,
    Mail,
    Lock,
    Phone,
    UserCircle,
    CheckCircle2,
} from 'lucide-react';
import { registerUser } from '@/actions/auth';
import { toast } from 'sonner';

/** Descripción de cada rol para ayudar al usuario a elegir */
const ROLE_INFO = {
    admin: {
        label: 'Negocio',
        description: 'Administra tu negocio, empleados y clientes',
        icon: Building2,
        color: 'primary',
        gradient: 'from-primary/15 to-primary/5',
        borderActive: 'border-primary',
        textActive: 'text-primary',
        bgActive: 'bg-primary/5',
    },
    professional: {
        label: 'Profesional',
        description: 'Gestiona tu agenda y clientes',
        icon: User,
        color: 'blue-500',
        gradient: 'from-blue-500/15 to-blue-500/5',
        borderActive: 'border-blue-500',
        textActive: 'text-blue-500',
        bgActive: 'bg-blue-500/5',
    },
    client: {
        label: 'Cliente',
        description: 'Reserva citas con tus profesionales favoritos',
        icon: CalendarCheck,
        color: 'emerald-500',
        gradient: 'from-emerald-500/15 to-emerald-500/5',
        borderActive: 'border-emerald-500',
        textActive: 'text-emerald-500',
        bgActive: 'bg-emerald-500/5',
    },
};

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (formData: FormData) => {
        setError(null);
        formData.set('role', selectedRole);

        startTransition(async () => {
            const result = await registerUser(formData);

            if (result.success) {
                toast.success('¡Cuenta creada exitosamente!');
                router.push('/login');
            } else {
                setError(result.error || 'Error al crear la cuenta');
            }
        });
    };

    return (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <Card className="border-0 shadow-none">
                <CardHeader className="space-y-1 pb-6">
                    {/* Logo mobile */}
                    <div className="flex items-center gap-2.5 lg:hidden mb-8">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/20">
                            T
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TurnoPro
                        </span>
                    </div>

                    <div className="space-y-2">
                        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                            Crear cuenta
                        </CardTitle>
                        <CardDescription className="text-base">
                            Completa tus datos para comenzar a usar TurnoPro
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form action={handleSubmit} className="space-y-5">
                        {error && (
                            <div
                                className="flex items-start gap-2.5 rounded-xl bg-destructive/8 border border-destructive/15 px-4 py-3 text-sm text-destructive"
                                style={{ animation: 'fadeIn 0.3s ease-out' }}
                            >
                                <div className="h-4 w-4 rounded-full bg-destructive/15 flex items-center justify-center mt-0.5 shrink-0">
                                    <span className="text-[10px] font-bold">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* Selector de rol */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Tipo de cuenta</Label>
                            <div className="grid grid-cols-3 gap-2.5">
                                {(Object.entries(ROLE_INFO) as [string, typeof ROLE_INFO.admin][]).map(
                                    ([role, info]) => {
                                        const isSelected = selectedRole === role;
                                        const Icon = info.icon;
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => setSelectedRole(role)}
                                                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                                                    isSelected
                                                        ? `${info.borderActive} ${info.bgActive}`
                                                        : 'border-border/60 hover:border-border bg-background hover:bg-muted/30'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <CheckCircle2 className={`absolute top-1.5 right-1.5 h-3.5 w-3.5 ${info.textActive}`} />
                                                )}
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                                                    isSelected
                                                        ? `bg-gradient-to-br ${info.gradient}`
                                                        : 'bg-muted/50'
                                                }`}>
                                                    <Icon className={`h-5 w-5 transition-colors ${
                                                        isSelected ? info.textActive : 'text-muted-foreground'
                                                    }`} />
                                                </div>
                                                <span className={`text-xs font-semibold transition-colors ${
                                                    isSelected ? info.textActive : 'text-foreground'
                                                }`}>
                                                    {info.label}
                                                </span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                            {selectedRole && (
                                <p
                                    className="text-xs text-muted-foreground pl-0.5"
                                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                                >
                                    {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.description}
                                </p>
                            )}
                        </div>

                        {/* Nombre */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
                            <div className="relative">
                                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Juan Pérez"
                                    required
                                    autoComplete="name"
                                    disabled={isPending}
                                    className="pl-10 h-11 border-border/60"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                    disabled={isPending}
                                    className="pl-10 h-11 border-border/60"
                                />
                            </div>
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                                Teléfono <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+56 9 1234 5678"
                                    autoComplete="tel"
                                    disabled={isPending}
                                    className="pl-10 h-11 border-border/60"
                                />
                            </div>
                        </div>

                        {/* Contraseñas en grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Mín. 8 caracteres"
                                        required
                                        autoComplete="new-password"
                                        disabled={isPending}
                                        className="pl-10 h-11 border-border/60"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Repite contraseña"
                                        required
                                        autoComplete="new-password"
                                        disabled={isPending}
                                        className="pl-10 h-11 border-border/60"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/15 text-sm font-medium"
                            disabled={isPending || !selectedRole}
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creando cuenta...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Crear cuenta
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Separador */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-3 text-xs text-muted-foreground/60">
                                ¿Ya tienes cuenta?
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-11 border-border/60 text-sm font-medium"
                        asChild
                    >
                        <Link href="/login">
                            Iniciar sesión
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
