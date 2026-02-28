/**
 * @fileoverview Página de inicio de sesión.
 * Formulario con email/contraseña usando Server Actions.
 * Diseño refinado con acentos visuales y animaciones.
 */

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { loginUser } from '@/actions/auth';
import { toast } from 'sonner';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            const result = await loginUser(formData);

            if (result.success) {
                toast.success('¡Bienvenido!');
                router.refresh();
            } else {
                setError(result.error || 'Error al iniciar sesión');
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
                            Bienvenido de vuelta
                        </CardTitle>
                        <CardDescription className="text-base">
                            Ingresa tus credenciales para acceder a tu cuenta
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
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

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Contraseña
                                </Label>
                                <Link
                                    href="#"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    disabled={isPending}
                                    className="pl-10 h-11 border-border/60"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/15 text-sm font-medium"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Ingresando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" />
                                    Iniciar sesión
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
                                ¿Nuevo en TurnoPro?
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-11 border-border/60 text-sm font-medium"
                        asChild
                    >
                        <Link href="/registro">
                            Crear cuenta gratis
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
