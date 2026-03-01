/**
 * @fileoverview Server Actions para gestión de suscripciones.
 * CRUD de suscripciones con integración a MercadoPago PreApproval.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Subscription, Business } from '@/lib/db/models';
import { getUserBusiness } from '@/lib/auth/dal';
import { createSubscriptionSchema } from '@/lib/validators/schemas';
import { serialize } from '@/lib/utils';
import { getPreApprovalClient, PLAN_CONFIG } from '@/lib/mercadopago/client';
import type { ActionResult, ISubscription, SubscriptionPlan } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Obtener suscripción actual ────────────────────────────────────────────────

interface SubscriptionData {
    subscription: ISubscription | null;
    businessStatus: string;
    businessPlan: string;
}

/**
 * Obtener la suscripción actual del negocio del admin autenticado.
 */
export async function getCurrentSubscription(): Promise<ActionResult<SubscriptionData>> {
    try {
        const business = await getUserBusiness();
        if (!business) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        await connectDB();

        const subscription = await Subscription.findOne({
            businessId: business._id,
        }).lean();

        return {
            success: true,
            data: {
                subscription: subscription ? serialize(subscription) as ISubscription : null,
                businessStatus: business.subscriptionStatus,
                businessPlan: business.subscriptionPlan,
            },
        };
    } catch (error) {
        console.error('Error obteniendo suscripción:', error);
        return { success: false, error: 'Error al obtener la suscripción' };
    }
}

// ─── Crear suscripción ─────────────────────────────────────────────────────────

interface CreateSubscriptionResult {
    initPoint: string;
}

/**
 * Crear una suscripción en MercadoPago (PreApproval) y guardar en BD.
 * Retorna la URL de checkout para redirigir al usuario.
 */
export async function createSubscription(
    plan: SubscriptionPlan
): Promise<ActionResult<CreateSubscriptionResult>> {
    try {
        const business = await getUserBusiness();
        if (!business) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        // Validar plan
        const parsed = createSubscriptionSchema.safeParse({ plan });
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0].message };
        }

        await connectDB();

        // Verificar que no hay suscripción activa
        const existing = await Subscription.findOne({
            businessId: business._id,
            status: { $in: ['active', 'pending'] },
        });

        if (existing) {
            return {
                success: false,
                error: 'Ya tienes una suscripción activa o pendiente. Cancélala primero para cambiar de plan.',
            };
        }

        const planConfig = PLAN_CONFIG[parsed.data.plan];

        // Crear PreApproval en MercadoPago
        const preApproval = getPreApprovalClient();
        const now = new Date();

        const response = await preApproval.create({
            body: {
                reason: `TurnoPro - Plan ${planConfig.name}`,
                external_reference: business._id.toString(),
                payer_email: business.email,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: planConfig.price,
                    currency_id: 'CLP',
                },
                back_url: `${APP_URL}/admin/suscripcion`,
            },
        });

        if (!response.id || !response.init_point) {
            console.error('Respuesta inválida de MercadoPago:', response);
            return { success: false, error: 'Error al crear la suscripción en MercadoPago' };
        }

        // Crear o actualizar documento de suscripción
        await Subscription.findOneAndUpdate(
            { businessId: business._id },
            {
                businessId: business._id,
                plan: parsed.data.plan,
                status: 'pending',
                mercadopagoPreapprovalId: response.id,
                startDate: now,
                amount: planConfig.price,
                currency: 'CLP',
            },
            { upsert: true, new: true }
        );

        // Actualizar Business con el plan seleccionado
        await Business.findByIdAndUpdate(business._id, {
            subscriptionPlan: parsed.data.plan,
            mercadopagoSubscriptionId: response.id,
        });

        return {
            success: true,
            data: { initPoint: response.init_point },
        };
    } catch (error) {
        console.error('Error creando suscripción:', error);
        return { success: false, error: 'Error al crear la suscripción' };
    }
}

// ─── Cancelar suscripción ──────────────────────────────────────────────────────

/**
 * Cancelar la suscripción activa del negocio.
 * Actualiza el estado en MercadoPago y en la BD local.
 */
export async function cancelSubscription(): Promise<ActionResult> {
    try {
        const business = await getUserBusiness();
        if (!business) {
            return { success: false, error: 'Negocio no encontrado' };
        }

        await connectDB();

        const subscription = await Subscription.findOne({
            businessId: business._id,
            status: { $in: ['active', 'pending'] },
        });

        if (!subscription) {
            return { success: false, error: 'No hay suscripción activa para cancelar' };
        }

        // Cancelar en MercadoPago si tiene ID
        if (subscription.mercadopagoPreapprovalId) {
            try {
                const preApproval = getPreApprovalClient();
                await preApproval.update({
                    id: subscription.mercadopagoPreapprovalId,
                    body: { status: 'cancelled' },
                });
            } catch (mpError) {
                console.error('Error cancelando en MercadoPago:', mpError);
                // Continuar con la cancelación local aunque falle en MP
            }
        }

        // Actualizar suscripción local
        subscription.status = 'cancelled';
        subscription.endDate = new Date();
        await subscription.save();

        // Actualizar Business
        await Business.findByIdAndUpdate(business._id, {
            subscriptionStatus: 'cancelled',
        });

        return { success: true };
    } catch (error) {
        console.error('Error cancelando suscripción:', error);
        return { success: false, error: 'Error al cancelar la suscripción' };
    }
}
