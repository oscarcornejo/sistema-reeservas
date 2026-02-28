/**
 * @fileoverview Modelo de Suscripción del negocio.
 * Gestiona el plan de pago del negocio para usar la plataforma TurnoPro.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
    ISubscription,
    SubscriptionPlan,
    SubscriptionStatus,
    SupportedCurrency,
} from '@/types';

export interface ISubscriptionDocument
    extends Omit<ISubscription, '_id'>,
    Document { }

/** Sub-schema de historial de pagos */
const PaymentRecordSchema = new Schema(
    {
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['approved', 'pending', 'rejected'],
            required: true,
        },
        mercadopagoPaymentId: { type: String, required: true },
    },
    { _id: false }
);

const SubscriptionSchema = new Schema(
    {
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            unique: true,
            index: true,
        },
        plan: {
            type: String,
            enum: ['starter', 'professional', 'enterprise'] satisfies SubscriptionPlan[],
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'pending', 'cancelled', 'expired'] satisfies SubscriptionStatus[],
            default: 'pending',
        },
        mercadopagoPreapprovalId: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        amount: { type: Number, required: true, min: 0 },
        currency: {
            type: String,
            enum: ['CLP', 'MXN'] satisfies SupportedCurrency[],
            default: 'CLP',
        },
        paymentHistory: { type: [PaymentRecordSchema], default: [] },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = (ret._id as { toString(): string }).toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

const Subscription: Model<ISubscriptionDocument> =
    mongoose.models.Subscription ||
    mongoose.model<ISubscriptionDocument>('Subscription', SubscriptionSchema);

export default Subscription;
