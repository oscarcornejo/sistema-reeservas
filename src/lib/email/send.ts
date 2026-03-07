/**
 * @fileoverview Helper de envío de email con Resend.
 * Fire-and-forget: loggea errores pero nunca lanza excepciones.
 */

import { getResend } from './transporter';

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Enviar un email vía Resend.
 * No lanza errores — loggea y retorna silenciosamente en caso de fallo.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
    try {
        const from = process.env.EMAIL_FROM || 'TurnoPro <onboarding@resend.dev>';
        const resend = getResend();

        const { error } = await resend.emails.send({ from, to, subject, html });

        if (error) {
            console.error(`❌ Error enviando email a ${to}:`, error);
            return;
        }

        console.log(`📧 Email enviado a ${to}: "${subject}"`);
    } catch (error) {
        console.error(`❌ Error enviando email a ${to}:`, error);
    }
}
