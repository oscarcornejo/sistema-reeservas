/**
 * @fileoverview Singleton de Resend para envío de emails.
 * Reutiliza la instancia en desarrollo (hot-reload) y en producción.
 */

import { Resend } from 'resend';

declare global {
    // eslint-disable-next-line no-var
    var resendClient: Resend | undefined;
}

/**
 * Obtener (o crear) la instancia de Resend.
 * Cachea en `globalThis` para evitar recrearla en hot-reload.
 */
export function getResend(): Resend {
    if (globalThis.resendClient) {
        return globalThis.resendClient;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    globalThis.resendClient = resend;
    return resend;
}
