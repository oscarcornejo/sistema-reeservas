/**
 * @fileoverview Página de gestión de suscripción del negocio.
 * Muestra planes disponibles, estado actual, historial de pagos
 * e integración con MercadoPago para pagos recurrentes.
 */

'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    CreditCard,
    Check,
    Crown,
    Rocket,
    Building2,
    Loader2,
    CalendarDays,
    Receipt,
    XCircle,
} from 'lucide-react';
import {
    getCurrentSubscription,
    createSubscription,
    cancelSubscription,
} from '@/actions/subscriptions';
import { PLAN_CONFIG } from '@/lib/mercadopago/client';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { ISubscription, SubscriptionPlan, SubscriptionStatus } from '@/types';

// ─── Configuración de UI ───────────────────────────────────────────────────────

const PLAN_ICONS: Record<SubscriptionPlan, React.ReactNode> = {
    starter: <Rocket className="h-6 w-6" />,
    professional: <Crown className="h-6 w-6" />,
    enterprise: <Building2 className="h-6 w-6" />,
};

const PLAN_COLORS: Record<SubscriptionPlan, { gradient: string; accent: string; badge: string }> = {
    starter: {
        gradient: 'from-blue-500/10 via-blue-400/5 to-transparent',
        accent: 'text-blue-500 dark:text-blue-400',
        badge: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30',
    },
    professional: {
        gradient: 'from-primary/10 via-primary/5 to-transparent',
        accent: 'text-primary',
        badge: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    enterprise: {
        gradient: 'from-amber-500/10 via-amber-400/5 to-transparent',
        accent: 'text-amber-500 dark:text-amber-400',
        badge: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30',
    },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    trial: { label: 'Prueba gratuita', variant: 'secondary' },
    active: { label: 'Activa', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'outline' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
    expired: { label: 'Expirada', variant: 'destructive' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    approved: { label: 'Aprobado', className: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    pending: { label: 'Pendiente', className: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' },
    rejected: { label: 'Rechazado', className: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400' },
};

const PLANS_ORDER: SubscriptionPlan[] = ['starter', 'professional', 'enterprise'];

// ─── Componente principal ──────────────────────────────────────────────────────

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState<ISubscription | null>(null);
    const [businessStatus, setBusinessStatus] = useState<string>('trial');
    const [businessPlan, setBusinessPlan] = useState<string>('starter');
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlan | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadSubscription = useCallback(() => {
        startTransition(async () => {
            const result = await getCurrentSubscription();
            if (result.success && result.data) {
                setSubscription(result.data.subscription);
                setBusinessStatus(result.data.businessStatus);
                setBusinessPlan(result.data.businessPlan);
            } else {
                toast.error(result.error || 'Error al cargar la suscripción');
            }
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        loadSubscription();
    }, [loadSubscription]);

    const handleSubscribe = (plan: SubscriptionPlan) => {
        setSubscribingPlan(plan);
        startTransition(async () => {
            const result = await createSubscription(plan);
            if (result.success && result.data) {
                toast.success('Redirigiendo a MercadoPago...');
                window.location.href = result.data.initPoint;
            } else {
                toast.error(result.error || 'Error al crear la suscripción');
                setSubscribingPlan(null);
            }
        });
    };

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelSubscription();
            if (result.success) {
                toast.success('Suscripción cancelada correctamente');
                setIsCancelDialogOpen(false);
                loadSubscription();
            } else {
                toast.error(result.error || 'Error al cancelar');
            }
        });
    };

    const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'pending';
    const statusConfig = STATUS_CONFIG[businessStatus] || STATUS_CONFIG.trial;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground">Cargando suscripción...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <CreditCard className="h-7 w-7 text-primary" />
                            Suscripción
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tu plan y método de pago
                        </p>
                    </div>
                    <Badge variant={statusConfig.variant} className="w-fit text-sm px-3 py-1">
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* ── Grid de planes ── */}
            <div
                className="grid gap-6 md:grid-cols-3"
                style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
            >
                {PLANS_ORDER.map((planKey) => {
                    const plan = PLAN_CONFIG[planKey];
                    const colors = PLAN_COLORS[planKey];
                    const isCurrentPlan = businessPlan === planKey && hasActiveSubscription;
                    const isPopular = planKey === 'professional';

                    return (
                        <Card
                            key={planKey}
                            className={`relative overflow-hidden border-border/50 transition-[box-shadow] duration-300 hover:shadow-lg ${
                                isCurrentPlan ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : ''
                            } ${isPopular ? 'md:-translate-y-2' : ''}`}
                        >
                            {/* Gradiente superior */}
                            <div className={`absolute top-0 left-0 h-24 w-full bg-gradient-to-b ${colors.gradient}`} />

                            {/* Badge "Más popular" */}
                            {isPopular && (
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-lg">
                                        Más popular
                                    </Badge>
                                </div>
                            )}

                            {/* Badge "Plan actual" */}
                            {isCurrentPlan && (
                                <div className="absolute top-3 left-3 z-10">
                                    <Badge variant="outline" className="text-[10px] font-semibold border-primary/50 text-primary">
                                        Plan actual
                                    </Badge>
                                </div>
                            )}

                            <CardContent className="relative pt-8 pb-6 px-6 flex flex-col h-full">
                                {/* Icono y nombre */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-background shadow-sm border border-border/50 ${colors.accent}`}>
                                        {PLAN_ICONS[planKey]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{plan.name}</h3>
                                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                                    </div>
                                </div>

                                {/* Precio */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold tracking-tight">
                                            {formatCurrency(plan.price)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">/mes</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                                            <Check className={`h-4 w-4 mt-0.5 shrink-0 ${colors.accent}`} />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isCurrentPlan ? (
                                    <Button disabled className="w-full" variant="outline">
                                        Plan actual
                                    </Button>
                                ) : hasActiveSubscription ? (
                                    <Button disabled className="w-full" variant="outline">
                                        Cancela tu plan actual primero
                                    </Button>
                                ) : (
                                    <Button
                                        className={`w-full ${
                                            isPopular
                                                ? 'bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20'
                                                : ''
                                        }`}
                                        variant={isPopular ? 'default' : 'outline'}
                                        onClick={() => handleSubscribe(planKey)}
                                        disabled={isPending && subscribingPlan === planKey}
                                    >
                                        {isPending && subscribingPlan === planKey ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            'Suscribirse'
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Detalles de suscripción actual ── */}
            {subscription && (
                <Card
                    className="relative overflow-hidden border-border/50"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CalendarDays className="h-5 w-5 text-primary" />
                            Detalles de tu suscripción
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Plan</p>
                                <p className="font-semibold">
                                    {PLAN_CONFIG[subscription.plan as SubscriptionPlan]?.name || subscription.plan}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Estado</p>
                                <Badge variant={STATUS_CONFIG[subscription.status as SubscriptionStatus]?.variant || 'secondary'}>
                                    {STATUS_CONFIG[subscription.status as SubscriptionStatus]?.label || subscription.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                                <p className="font-semibold">
                                    {formatDate(subscription.startDate)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Monto mensual</p>
                                <p className="font-semibold">
                                    {formatCurrency(subscription.amount, subscription.currency)}
                                </p>
                            </div>
                        </div>

                        {/* Botón cancelar */}
                        {hasActiveSubscription && (
                            <div className="mt-6 pt-4 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                    onClick={() => setIsCancelDialogOpen(true)}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar suscripción
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Historial de pagos ── */}
            {subscription && subscription.paymentHistory.length > 0 && (
                <Card
                    className="relative overflow-hidden border-border/50"
                    style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
                >
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Receipt className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                            Historial de pagos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">ID de pago</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...subscription.paymentHistory]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((payment, index) => {
                                        const statusCfg = PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.pending;
                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {formatDate(payment.date, "dd/MM/yyyy")}
                                                </TableCell>
                                                <TableCell className="font-semibold tabular-nums">
                                                    {formatCurrency(payment.amount, subscription.currency)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-[10px] border-0 ${statusCfg.className}`}>
                                                        {statusCfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                    {payment.mercadopagoPaymentId}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* ── AlertDialog para confirmar cancelación ── */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Al cancelar tu suscripción perderás acceso a las funcionalidades de tu plan actual.
                            Podrás suscribirte nuevamente en cualquier momento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleCancel}
                            disabled={isPending}
                        >
                            {isPending ? 'Cancelando...' : 'Sí, cancelar suscripción'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
