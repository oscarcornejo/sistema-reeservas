/**
 * @fileoverview Rate limiter in-memory con sliding window counter.
 * Usa globalThis singleton (mismo patrón que connection.ts).
 * Compatible con Vercel serverless (cada instancia tiene su propio estado).
 */

import { securityLogger } from '@/lib/logger';
import { auditLog } from '@/lib/logger/audit';

// ─── Tipos ──────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
    /** Duración de la ventana en milisegundos */
    windowMs: number;
    /** Número máximo de requests permitidos en la ventana */
    maxRequests: number;
}

export interface RateLimitResult {
    /** Si el request fue permitido */
    allowed: boolean;
    /** Requests restantes en la ventana actual */
    remaining: number;
    /** Timestamp de cuando se resetea la ventana */
    resetAt: number;
}

interface WindowEntry {
    /** Timestamps de cada request en la ventana */
    timestamps: number[];
}

// ─── Límites predefinidos ───────────────────────────────────────────────────────

export const RATE_LIMITS = {
    /** Login por email (fuerza bruta): 5 intentos / 15 min */
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    /** Login por IP (abuso masivo): 20 intentos / 15 min */
    authByIp: { windowMs: 15 * 60 * 1000, maxRequests: 20 },
    /** Registro: 5 intentos / 15 min */
    register: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    /** Reserva pública: 10 / min */
    publicBooking: { windowMs: 60 * 1000, maxRequests: 10 },
    /** Webhook: 100 / min */
    webhook: { windowMs: 60 * 1000, maxRequests: 100 },
    /** Cron: 5 / min */
    cron: { windowMs: 60 * 1000, maxRequests: 5 },
} as const satisfies Record<string, RateLimitConfig>;

// ─── Singleton store via globalThis ─────────────────────────────────────────────

interface RateLimitStore {
    entries: Map<string, WindowEntry>;
    cleanupInterval: ReturnType<typeof setInterval> | null;
}

const globalForRateLimit = globalThis as unknown as {
    rateLimitStore?: RateLimitStore;
};

function getStore(): RateLimitStore {
    if (!globalForRateLimit.rateLimitStore) {
        globalForRateLimit.rateLimitStore = {
            entries: new Map(),
            cleanupInterval: null,
        };

        // Cleanup automático cada 5 minutos
        globalForRateLimit.rateLimitStore.cleanupInterval = setInterval(() => {
            cleanup();
        }, 5 * 60 * 1000);

        // No bloquear el event loop al cerrar
        if (globalForRateLimit.rateLimitStore.cleanupInterval?.unref) {
            globalForRateLimit.rateLimitStore.cleanupInterval.unref();
        }
    }

    return globalForRateLimit.rateLimitStore;
}

/**
 * Limpia entradas expiradas del store.
 */
function cleanup() {
    const store = getStore();
    const now = Date.now();
    // Ventana máxima: 15 min (la más larga de RATE_LIMITS)
    const maxWindow = 15 * 60 * 1000;

    for (const [key, entry] of store.entries) {
        // Filtrar timestamps fuera de la ventana máxima
        entry.timestamps = entry.timestamps.filter(t => now - t < maxWindow);
        if (entry.timestamps.length === 0) {
            store.entries.delete(key);
        }
    }
}

// ─── API pública ────────────────────────────────────────────────────────────────

/**
 * Verifica si un request está dentro del límite.
 * Registra el intento automáticamente.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
    const store = getStore();
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = store.entries.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.entries.set(key, entry);
    }

    // Filtrar timestamps fuera de la ventana
    entry.timestamps = entry.timestamps.filter(t => t > windowStart);

    const resetAt = entry.timestamps.length > 0
        ? entry.timestamps[0] + config.windowMs
        : now + config.windowMs;

    if (entry.timestamps.length >= config.maxRequests) {
        // Límite excedido
        securityLogger.warn('Rate limit excedido', {
            action: 'rate_limit.check',
            metadata: { key, current: entry.timestamps.length, max: config.maxRequests },
        });
        auditLog('rate_limit.exceeded', {
            metadata: { key, windowMs: config.windowMs, maxRequests: config.maxRequests },
        });

        return {
            allowed: false,
            remaining: 0,
            resetAt,
        };
    }

    // Registrar este intento
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetAt,
    };
}

/**
 * Extrae la IP del cliente desde los headers de la request.
 */
export function getClientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        // x-forwarded-for puede contener múltiples IPs: "client, proxy1, proxy2"
        return forwarded.split(',')[0].trim();
    }
    return headers.get('x-real-ip') || 'unknown';
}
