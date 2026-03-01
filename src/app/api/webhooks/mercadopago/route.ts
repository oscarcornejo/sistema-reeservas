/**
 * @fileoverview Webhook de MercadoPago para procesar eventos de suscripción.
 * Recibe notificaciones de cambios en PreApproval y pagos,
 * y actualiza el estado de la suscripción y el negocio en la BD.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Subscription, Business } from '@/lib/db/models';
import {
    verifyWebhookSignature,
    getPreApprovalClient,
    getPaymentClient,
} from '@/lib/mercadopago/client';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { paymentLogger } from '@/lib/logger';
import { auditLog } from '@/lib/logger/audit';

// ─── Mapeo de estados MercadoPago → estados internos ───────────────────────────

const STATUS_MAP: Record<string, 'active' | 'pending' | 'cancelled' | 'expired'> = {
    authorized: 'active',
    pending: 'pending',
    paused: 'cancelled',
    cancelled: 'cancelled',
};

// ─── GET: verificación de URL por MercadoPago ──────────────────────────────────

export async function GET() {
    return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// ─── POST: procesamiento de eventos ────────────────────────────────────────────

export async function POST(request: NextRequest) {
    // Rate limit por IP
    const ip = getClientIp(request.headers);
    const rateCheck = checkRateLimit(`webhook:${ip}`, RATE_LIMITS.webhook);
    if (!rateCheck.allowed) {
        paymentLogger.warn('Webhook rate limit excedido', { ip });
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { type, data } = body;

        // Verificar firma si hay headers de seguridad
        const xSignature = request.headers.get('x-signature');
        const xRequestId = request.headers.get('x-request-id');
        const dataId = data?.id?.toString() || '';

        if (xSignature && xRequestId) {
            const isValid = verifyWebhookSignature(dataId, xRequestId, xSignature);
            if (!isValid) {
                auditLog('webhook.invalid_signature', { ip, metadata: { xRequestId, dataId } });
                return NextResponse.json(
                    { error: 'Firma inválida' },
                    { status: 401 }
                );
            }
        }

        auditLog('webhook.received', { ip, metadata: { type, dataId } });

        await connectDB();

        // Procesar según tipo de evento
        if (type === 'subscription_preapproval') {
            await handlePreApprovalEvent(dataId);
        } else if (type === 'payment') {
            await handlePaymentEvent(dataId);
        }

        // Siempre responder 200 para que MercadoPago no reintente
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        paymentLogger.error('Error procesando webhook de MercadoPago', error);
        // Responder 200 para evitar reintentos infinitos
        return NextResponse.json({ received: true }, { status: 200 });
    }
}

// ─── Handlers internos ─────────────────────────────────────────────────────────

/**
 * Procesar evento de cambio en PreApproval (suscripción).
 * Consulta el estado actual en MercadoPago y actualiza la BD.
 */
async function handlePreApprovalEvent(preapprovalId: string) {
    if (!preapprovalId) return;

    try {
        const preApproval = getPreApprovalClient();
        const response = await preApproval.get({ id: preapprovalId });

        if (!response.status) return;

        const newStatus = STATUS_MAP[response.status] || 'pending';

        // Buscar suscripción por ID de MercadoPago
        const subscription = await Subscription.findOne({
            mercadopagoPreapprovalId: preapprovalId,
        });

        if (!subscription) {
            paymentLogger.warn(`Webhook: no se encontró suscripción para preapproval ${preapprovalId}`);
            return;
        }

        // Actualizar suscripción
        subscription.status = newStatus;
        if (newStatus === 'cancelled') {
            subscription.endDate = new Date();
        }
        await subscription.save();

        // Actualizar Business
        const businessUpdate: Record<string, unknown> = {
            subscriptionStatus: newStatus,
        };

        if (newStatus === 'active' && response.auto_recurring?.transaction_amount) {
            businessUpdate.subscriptionExpiresAt = response.next_payment_date
                ? new Date(response.next_payment_date)
                : undefined;
        }

        await Business.findByIdAndUpdate(subscription.businessId, businessUpdate);

        paymentLogger.info(`Webhook: suscripción ${preapprovalId} actualizada a ${newStatus}`);
    } catch (error) {
        paymentLogger.error(`Error procesando preapproval ${preapprovalId}`, error);
    }
}

/**
 * Procesar evento de pago individual.
 * Agrega el pago al historial y activa la suscripción si estaba pendiente.
 */
async function handlePaymentEvent(paymentId: string) {
    if (!paymentId) return;

    try {
        const paymentClient = getPaymentClient();
        const payment = await paymentClient.get({ id: paymentId });

        if (!payment.external_reference) return;

        // external_reference contiene el businessId
        const subscription = await Subscription.findOne({
            businessId: payment.external_reference,
        });

        if (!subscription) return;

        // Mapear estado del pago
        const paymentStatusMap: Record<string, 'approved' | 'pending' | 'rejected'> = {
            approved: 'approved',
            pending: 'pending',
            in_process: 'pending',
            rejected: 'rejected',
            refunded: 'rejected',
            cancelled: 'rejected',
        };

        const paymentStatus = paymentStatusMap[payment.status || ''] || 'pending';

        // Agregar al historial de pagos
        subscription.paymentHistory.push({
            date: new Date(),
            amount: payment.transaction_amount || subscription.amount,
            status: paymentStatus,
            mercadopagoPaymentId: paymentId,
        });

        // Si el pago fue aprobado y la suscripción estaba pendiente, activarla
        if (paymentStatus === 'approved' && subscription.status === 'pending') {
            subscription.status = 'active';

            await Business.findByIdAndUpdate(subscription.businessId, {
                subscriptionStatus: 'active',
            });
        }

        await subscription.save();

        paymentLogger.info(`Webhook: pago ${paymentId} procesado (${paymentStatus})`);
    } catch (error) {
        paymentLogger.error(`Error procesando pago ${paymentId}`, error);
    }
}
