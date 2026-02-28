/**
 * @fileoverview Helper de envío de email.
 * Fire-and-forget: loggea errores pero nunca lanza excepciones.
 */

import { getTransporter } from './transporter';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Enviar un email vía SMTP.
 * No lanza errores — loggea y retorna silenciosamente en caso de fallo.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
    try {
        const from = process.env.EMAIL_FROM || 'TurnoPro <noreply@turnopro.cl>';
        const transporter = getTransporter();

        await transporter.sendMail({ from, to, subject, html });
        console.log(`📧 Email enviado a ${to}: "${subject}"`);
    } catch (error) {
        console.error(`❌ Error enviando email a ${to}:`, error);
    }
}
