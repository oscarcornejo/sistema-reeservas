/**
 * @fileoverview Dashboard del cliente.
 * Saludo personalizado, accesos rápidos premium y próximas citas.
 * Diseño al mismo nivel que el admin dashboard.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    Clock,
    Search,
    ArrowRight,
    Sparkles,
    Star,
} from 'lucide-react';
import Link from 'next/link';
import { Greeting } from '@/components/ui/greeting';

// =============================================================================
// Contenido del dashboard
// =============================================================================

function DashboardContent() {
    return (
        <div className="space-y-8">
            {/* ── Hero personalizado ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6 sm:p-8"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            <Suspense fallback="Hola"><Greeting /></Suspense>
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Gestiona tus citas y encuentra nuevos servicios
                        </p>
                    </div>
                    <Link
                        href="/buscar"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 shrink-0"
                    >
                        <Search className="h-4 w-4" />
                        Nueva reserva
                    </Link>
                </div>
            </div>

            {/* ── Acciones rápidas ── */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Link
                    href="/buscar"
                    className="group"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                >
                    <Card className="h-full relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                                <Search className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">Reservar cita</h3>
                            <p className="text-xs text-muted-foreground mt-1">Encuentra y agenda servicios</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link
                    href="/cliente/mis-citas"
                    className="group"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                >
                    <Card className="h-full relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-accent/40" />
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4 group-hover:bg-accent/15 transition-colors">
                                <Calendar className="h-6 w-6 text-accent" />
                            </div>
                            <h3 className="font-semibold group-hover:text-accent transition-colors">Mis citas</h3>
                            <p className="text-xs text-muted-foreground mt-1">Ve tus citas programadas</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link
                    href="/cliente/historial"
                    className="group"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
                >
                    <Card className="h-full relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-0.5">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                        <CardContent className="p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 mb-4 group-hover:bg-emerald-500/15 transition-colors">
                                <Clock className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Historial</h3>
                            <p className="text-xs text-muted-foreground mt-1">Revisa visitas anteriores</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* ── Próximas citas ── */}
            <Card
                className="border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}
            >
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Próximas citas</CardTitle>
                        <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">
                            Sin citas
                        </Badge>
                    </div>
                    <CardDescription>Tus citas programadas más cercanas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                            <Calendar className="h-7 w-7 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">No tienes citas programadas</p>
                        <p className="text-xs text-muted-foreground/60 mb-4">Busca un negocio y reserva tu próxima cita</p>
                        <Button size="sm" asChild>
                            <Link href="/buscar">
                                <Search className="h-3.5 w-3.5 mr-1.5" />
                                Reservar una cita
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// =============================================================================
// Skeleton de carga
// =============================================================================

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted rounded" />
                        <div className="h-4 w-56 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-40 bg-muted rounded-xl" />
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-6">
                            <div className="h-12 w-12 bg-muted rounded-xl mb-4" />
                            <div className="h-5 w-28 bg-muted rounded mb-1" />
                            <div className="h-3 w-40 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// Página principal
// =============================================================================

export default function ClientDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
