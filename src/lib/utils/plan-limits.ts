/**
 * @fileoverview Configuración centralizada de límites y permisos por plan de suscripción.
 * Define qué funcionalidades están disponibles para cada plan (starter, professional, enterprise).
 */

import type { SubscriptionPlan } from '@/types';

/** Funcionalidades restringidas por plan */
export type PlanFeature =
    | 'categories'
    | 'reports'
    | 'csvExport'
    | 'scheduleBlocks'
    | 'advancedClients'
    | 'reportsByProfessional'
    | 'onlinePayments'
    | 'advancedConfig'
    | 'multiBusiness'
    | 'inAppNotifications';

/** Límites numéricos y funcionalidades de un plan */
export interface PlanLimits {
    maxServices: number;
    maxProfessionals: number;
    features: PlanFeature[];
}

/** Configuración de límites por plan */
export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
    starter: {
        maxServices: 3,
        maxProfessionals: 1,
        features: [],
    },
    professional: {
        maxServices: Infinity,
        maxProfessionals: 5,
        features: [
            'categories',
            'reports',
            'csvExport',
            'scheduleBlocks',
            'advancedClients',
        ],
    },
    enterprise: {
        maxServices: Infinity,
        maxProfessionals: Infinity,
        features: [
            'categories',
            'reports',
            'csvExport',
            'scheduleBlocks',
            'advancedClients',
            'reportsByProfessional',
            'onlinePayments',
            'advancedConfig',
            'multiBusiness',
            'inAppNotifications',
        ],
    },
};

/** Nombres legibles de cada plan */
const PLAN_NAMES: Record<SubscriptionPlan, string> = {
    starter: 'Básico',
    professional: 'Profesional',
    enterprise: 'Corporativo',
};

/** Obtener los límites de un plan */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
    return PLAN_LIMITS[plan];
}

/** Verificar si un plan tiene acceso a una funcionalidad */
export function canAccess(plan: SubscriptionPlan, feature: PlanFeature): boolean {
    return PLAN_LIMITS[plan].features.includes(feature);
}

/** Obtener el nombre legible de un plan */
export function getPlanName(plan: SubscriptionPlan): string {
    return PLAN_NAMES[plan];
}

/** Obtener el plan mínimo requerido para una funcionalidad */
export function getRequiredPlan(feature: PlanFeature): SubscriptionPlan {
    if (PLAN_LIMITS.starter.features.includes(feature)) return 'starter';
    if (PLAN_LIMITS.professional.features.includes(feature)) return 'professional';
    return 'enterprise';
}
