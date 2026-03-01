/**
 * @fileoverview Banner reutilizable para funciones restringidas por plan.
 * Muestra un mensaje indicando el plan requerido y un enlace a la página de suscripción.
 */

'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPlanName } from '@/lib/utils/plan-limits';
import type { SubscriptionPlan } from '@/types';

interface UpgradeBannerProps {
    /** Plan mínimo requerido para acceder a la funcionalidad */
    requiredPlan: 'professional' | 'enterprise';
    /** Descripción de la funcionalidad restringida */
    feature: string;
}

export function UpgradeBanner({ requiredPlan, feature }: UpgradeBannerProps) {
    const planName = getPlanName(requiredPlan as SubscriptionPlan);

    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                        {feature}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Esta función requiere el plan <strong>{planName}</strong>. Actualiza tu suscripción para desbloquear esta y más funcionalidades.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/suscripcion">
                        Ver planes
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
