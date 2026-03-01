/**
 * @fileoverview Módulo de audit trail para acciones críticas.
 * Emite logs estructurados con prefijo [AUDIT] para facilitar filtrado.
 */

import { auditLogger, type LogContext } from './index';

export type AuditAction =
    | 'login.success'
    | 'login.failure'
    | 'register.success'
    | 'register.failure'
    | 'password.change'
    | 'profile.update'
    | 'avatar.update'
    | 'avatar.remove'
    | 'booking.create'
    | 'webhook.received'
    | 'webhook.invalid_signature'
    | 'cron.execute'
    | 'rate_limit.exceeded';

interface AuditDetails extends LogContext {
    reason?: string;
}

/**
 * Emite un log de auditoría estructurado.
 * Acciones de éxito → info, fallos/bloqueos → warn.
 */
export function auditLog(action: AuditAction, details?: AuditDetails) {
    const context: LogContext = {
        ...details,
        action,
    };

    const message = `[AUDIT] ${action}`;
    const isFailure = action.includes('failure') || action.includes('invalid') || action === 'rate_limit.exceeded';

    if (isFailure) {
        auditLogger.warn(message, context);
    } else {
        auditLogger.info(message, context);
    }
}
