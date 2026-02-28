/**
 * @fileoverview Singleton de transporter Nodemailer.
 * Reutiliza la instancia en desarrollo (hot-reload) y en producción.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

declare global {
    // eslint-disable-next-line no-var
    var emailTransporter: Transporter | undefined;
}

/**
 * Obtener (o crear) el transporter de Nodemailer.
 * Cachea la instancia en `globalThis` para evitar recrearlo en hot-reload.
 */
export function getTransporter(): Transporter {
    if (globalThis.emailTransporter) {
        return globalThis.emailTransporter;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    globalThis.emailTransporter = transporter;
    return transporter;
}
