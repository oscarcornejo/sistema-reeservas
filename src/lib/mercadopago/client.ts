/**
 * @fileoverview Cliente singleton de MercadoPago.
 * Configura la instancia de MercadoPago y expone helpers para
 * PreApproval (suscripciones) y Payment (pagos).
 */

import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { createHmac } from 'crypto';
import type { SubscriptionPlan } from '@/types';

// ─── Validación de variables de entorno ────────────────────────────────────────

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

// ─── Configuración de planes ───────────────────────────────────────────────────

export interface PlanConfig {
    name: string;
    price: number;
    description: string;
    features: string[];
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
    starter: {
        name: 'Básico',
        price: 10_000,
        description: 'Para negocios que comienzan',
        features: [
            'Dashboard con métricas',
            'Calendario y agenda',
            'Hasta 3 servicios',
            '1 profesional',
            'Gestión de clientes básica',
            'Perfil público en marketplace',
            'Reservas online',
            'Notificaciones por email',
        ],
    },
    professional: {
        name: 'Profesional',
        price: 20_000,
        description: 'Para negocios en crecimiento',
        features: [
            'Todo lo del plan Básico',
            'Servicios ilimitados',
            'Hasta 5 profesionales',
            'Categorías de servicios personalizadas',
            'Reportes de ingresos y ocupación',
            'Exportación CSV',
            'Bloqueo de agenda',
            'Gestión avanzada de clientes',
        ],
    },
    enterprise: {
        name: 'Corporativo',
        price: 35_000,
        description: 'Para negocios consolidados',
        features: [
            'Todo lo del plan Profesional',
            'Profesionales ilimitados',
            'Reportes detallados por profesional',
            'Pagos online con MercadoPago',
            'Configuración avanzada',
            'Multi-negocio',
            'Notificaciones in-app + email',
            'Soporte prioritario',
        ],
    },
};

// ─── Singleton de MercadoPago ──────────────────────────────────────────────────

interface MpCache {
    config: MercadoPagoConfig | null;
}

declare global {
    // eslint-disable-next-line no-var
    var mercadopagoCache: MpCache | undefined;
}

const cached: MpCache = globalThis.mercadopagoCache ?? { config: null };
globalThis.mercadopagoCache = cached;

/**
 * Obtener la instancia de MercadoPagoConfig (singleton).
 * @throws Error si MERCADOPAGO_ACCESS_TOKEN no está definido
 */
function getMpConfig(): MercadoPagoConfig {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
        throw new Error(
            'MERCADOPAGO_ACCESS_TOKEN no está definido en las variables de entorno'
        );
    }

    if (!cached.config) {
        cached.config = new MercadoPagoConfig({
            accessToken: MERCADOPAGO_ACCESS_TOKEN,
        });
    }

    return cached.config;
}

/**
 * Obtener cliente de PreApproval para suscripciones recurrentes.
 */
export function getPreApprovalClient(): PreApproval {
    return new PreApproval(getMpConfig());
}

/**
 * Obtener cliente de Payment para consultar pagos individuales.
 */
export function getPaymentClient(): Payment {
    return new Payment(getMpConfig());
}

// ─── Verificación de webhook ───────────────────────────────────────────────────

/**
 * Verificar la firma HMAC-SHA256 del webhook de MercadoPago.
 * @param dataId - ID del recurso (query param `data.id`)
 * @param xRequestId - Header `x-request-id`
 * @param xSignature - Header `x-signature` con formato `ts=...,v1=...`
 * @returns true si la firma es válida
 */
export function verifyWebhookSignature(
    dataId: string,
    xRequestId: string,
    xSignature: string
): boolean {
    if (!MERCADOPAGO_WEBHOOK_SECRET) {
        console.warn('MERCADOPAGO_WEBHOOK_SECRET no definido, omitiendo verificación');
        return true;
    }

    // Parsear ts y v1 del header x-signature
    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    for (const part of parts) {
        const [key, value] = part.trim().split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') hash = value;
    }

    if (!ts || !hash) return false;

    // Construir el manifest según documentación de MercadoPago
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const hmac = createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET)
        .update(manifest)
        .digest('hex');

    return hmac === hash;
}
