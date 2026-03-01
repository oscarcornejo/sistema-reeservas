/**
 * @fileoverview Dashboard del Admin (negocio).
 * Saludo personalizado, métricas con personalidad visual,
 * indicador de ocupación, y accesos rápidos.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    DollarSign,
    TrendingUp,
    Clock,
    ArrowRight,
    Users,
    Scissors,
    BarChart3,
    Sparkles,
} from 'lucide-react';
import { getCachedDashboardMetrics } from '@/lib/data/queries';
import { getUserBusiness, requireAdmin } from '@/lib/auth/dal';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import Link from 'next/link';

// =============================================================================
// Saludo según hora del día
// =============================================================================

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

// =============================================================================
// Componentes de métricas
// =============================================================================

/** Anillo visual de porcentaje para ocupación */
function OccupancyRing({ rate }: { rate: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rate / 100) * circumference;

    return (
        <div className="relative h-28 w-28 shrink-0">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/60"
                />
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="url(#occupancy-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
                <defs>
                    <linearGradient id="occupancy-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-accent)" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight">{rate}%</span>
            </div>
        </div>
    );
}

// =============================================================================
// Contenido dinámico (cacheado, dentro de Suspense)
// =============================================================================

async function DashboardContent() {
    const [user, business] = await Promise.all([
        requireAdmin(),
        getUserBusiness(),
    ]);

    const metrics = business
        ? await getCachedDashboardMetrics(business._id.toString(), new Date().toISOString())
        : { todayAppointments: 0, upcomingAppointments: 0, monthlyRevenue: 0, occupancyRate: 0 };

    const firstName = user.name?.split(' ')[0] || 'Admin';
    const todayFormatted = formatDate(new Date(), "EEEE dd 'de' MMMM");

    return (
        <div className="space-y-8">
            {/* ── Saludo personalizado ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6 sm:p-8"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                {/* Decoración sutil */}
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {getGreeting()}, {firstName}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-accent" />
                            {business?.name || 'Tu negocio'} · <span className="capitalize">{todayFormatted}</span>
                        </p>
                    </div>
                    <Link
                        href="/admin/calendario"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 shrink-0"
                    >
                        <Calendar className="h-4 w-4" />
                        Ver calendario
                    </Link>
                </div>
            </div>

            {/* ── Métricas principales ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Citas hoy */}
                <Card
                    className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Citas hoy</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Calendar className="h-4.5 w-4.5 text-primary" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{metrics.todayAppointments}</p>
                        <p className="text-xs text-muted-foreground mt-1">citas programadas</p>
                    </CardContent>
                </Card>

                {/* Próximas citas */}
                <Card
                    className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Próximos 7 días</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/15 transition-colors">
                                <Clock className="h-4.5 w-4.5 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{metrics.upcomingAppointments}</p>
                        <p className="text-xs text-muted-foreground mt-1">citas por venir</p>
                    </CardContent>
                </Card>

                {/* Ingresos del mes */}
                <Card
                    className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Ingresos del mes</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{formatCurrency(metrics.monthlyRevenue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">facturación actual</p>
                    </CardContent>
                </Card>

                {/* Ocupación con anillo */}
                <Card
                    className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Ocupación mensual</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors">
                                <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
                            </div>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">{metrics.occupancyRate}%</p>
                        <p className="text-xs text-muted-foreground mt-1">tasa de ocupación</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Panel inferior: Ocupación visual + Accesos rápidos ── */}
            <div
                className="grid gap-6 lg:grid-cols-5"
                style={{ animation: 'fadeIn 0.4s ease-out 0.25s both' }}
            >
                {/* Resumen de ocupación */}
                <Card className="lg:col-span-2 border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Resumen del mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <OccupancyRing rate={metrics.occupancyRate} />
                            <div className="space-y-3 flex-1 min-w-0">
                                <div>
                                    <p className="text-sm text-muted-foreground">Hoy</p>
                                    <p className="text-lg font-semibold">{metrics.todayAppointments} citas</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Esta semana</p>
                                    <p className="text-lg font-semibold">{metrics.upcomingAppointments} citas</p>
                                </div>
                                <Separator />
                                <div>
                                    <p className="text-sm text-muted-foreground">Ingresos</p>
                                    <p className="text-lg font-semibold">{formatCurrency(metrics.monthlyRevenue)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Accesos rápidos */}
                <div className="lg:col-span-3 grid gap-3 sm:grid-cols-2 content-start">
                    <Link href="/admin/calendario" className="group">
                        <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">Calendario</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Gestiona las citas del día</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/clientes" className="group">
                        <Card className="h-full border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                                    <Users className="h-5 w-5 text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm group-hover:text-accent transition-colors">Clientes</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Base de datos y historial</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/servicios" className="group">
                        <Card className="h-full border-border/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/15 transition-colors">
                                    <Scissors className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">Servicios</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Precios, duración y categorías</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/reportes" className="group">
                        <Card className="h-full border-border/50 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                            <CardContent className="p-5 flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors">
                                    <BarChart3 className="h-5 w-5 text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm group-hover:text-amber-600 transition-colors">Reportes</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Rendimiento y analíticas</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Skeleton de carga
// =============================================================================

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Greeting skeleton */}
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-muted rounded" />
                        <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                    <div className="h-10 w-40 bg-muted rounded-xl" />
                </div>
            </div>
            {/* Metric cards skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-4 w-20 bg-muted rounded" />
                                <div className="h-9 w-9 bg-muted rounded-lg" />
                            </div>
                            <div className="h-10 w-24 bg-muted rounded" />
                            <div className="h-3 w-28 bg-muted rounded mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Bottom panel skeleton */}
            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-2 border-border/50">
                    <CardContent className="p-6">
                        <div className="h-32 w-full bg-muted rounded" />
                    </CardContent>
                </Card>
                <div className="lg:col-span-3 grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-border/50">
                            <CardContent className="p-5">
                                <div className="h-14 w-full bg-muted rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Página principal
// =============================================================================

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
