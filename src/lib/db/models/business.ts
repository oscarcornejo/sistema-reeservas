/**
 * @fileoverview Modelo de Negocio (Business).
 * Representa la entidad principal: barbería, spa, consultorio, etc.
 * Incluye índice geoespacial 2dsphere para búsquedas por ubicación.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
    IBusiness,
    SupportedCountry,
    SupportedCurrency,
    SubscriptionStatus,
    SubscriptionPlan,
    DayOfWeek,
} from '@/types';

export interface IBusinessDocument extends Omit<IBusiness, '_id'>, Document { }

/** Sub-schema de horarios de trabajo */
const WorkingHourSchema = new Schema(
    {
        dayOfWeek: {
            type: Number,
            enum: [0, 1, 2, 3, 4, 5, 6] satisfies DayOfWeek[],
            required: true,
        },
        isOpen: { type: Boolean, default: true },
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '18:00' },
    },
    { _id: false }
);

const BusinessSchema = new Schema(
    {
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El administrador es requerido'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'El nombre del negocio es requerido'],
            trim: true,
            maxlength: [150, 'El nombre no puede exceder 150 caracteres'],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: { type: String, maxlength: 1000 },
        logo: { type: String },
        coverImage: { type: String },
        category: {
            type: String,
            required: [true, 'La categoría es requerida'],
            trim: true,
        },
        // --- Ubicación ---
        address: {
            type: String,
            required: [true, 'La dirección es requerida'],
            trim: true,
        },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        country: {
            type: String,
            enum: ['CL', 'MX'] satisfies SupportedCountry[],
            required: true,
            default: 'CL',
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true,
            },
        },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        website: { type: String, trim: true },
        // --- Horarios ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workingHours: {
            type: [WorkingHourSchema] as any,
            default: () =>
                [1, 2, 3, 4, 5].map((day) => ({
                    dayOfWeek: day,
                    isOpen: true,
                    openTime: '09:00',
                    closeTime: '18:00',
                })),
        },
        timezone: { type: String, default: 'America/Santiago' },
        currency: {
            type: String,
            enum: ['CLP', 'MXN'] satisfies SupportedCurrency[],
            default: 'CLP',
        },
        // --- Suscripción ---
        subscriptionStatus: {
            type: String,
            enum: ['trial', 'active', 'cancelled', 'expired'] satisfies SubscriptionStatus[],
            default: 'trial',
        },
        subscriptionPlan: {
            type: String,
            enum: ['starter', 'professional', 'enterprise'] satisfies SubscriptionPlan[],
            default: 'starter',
        },
        subscriptionExpiresAt: { type: Date },
        mercadopagoSubscriptionId: { type: String },
        // --- Configuración ---
        allowOnlinePayments: { type: Boolean, default: false },
        requirePaymentUpfront: { type: Boolean, default: false },
        cancellationPolicy: { type: String, maxlength: 500 },
        isPublished: { type: Boolean, default: false },
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

// Índice geoespacial para búsquedas por cercanía
BusinessSchema.index({ location: '2dsphere' });
// Índice para marketplace público
BusinessSchema.index({ isPublished: 1, category: 1 });

const Business: Model<IBusinessDocument> =
    mongoose.models.Business ||
    mongoose.model<IBusinessDocument>('Business', BusinessSchema);

export default Business;
