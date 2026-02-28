/**
 * @fileoverview Modelo de Profesional/Empleado.
 * Representa un profesional vinculado a un negocio (barbero, dentista, etc.).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IProfessional, DayOfWeek } from '@/types';

export interface IProfessionalDocument
    extends Omit<IProfessional, '_id'>,
    Document { }

/** Sub-schema de slots de disponibilidad */
const AvailableSlotSchema = new Schema(
    {
        start: { type: String, required: true },
        end: { type: String, required: true },
    },
    { _id: false }
);

/** Sub-schema de disponibilidad por día */
const DayAvailabilitySchema = new Schema(
    {
        dayOfWeek: {
            type: Number,
            enum: [0, 1, 2, 3, 4, 5, 6] satisfies DayOfWeek[],
            required: true,
        },
        slots: [AvailableSlotSchema],
    },
    { _id: false }
);

const ProfessionalSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido'],
            index: true,
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        displayName: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        specialties: {
            type: [String],
            default: [],
        },
        bio: { type: String, maxlength: 500 },
        avatar: { type: String },
        services: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Service',
            },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        availableHours: {
            type: [DayAvailabilitySchema] as any,
            default: () =>
                [1, 2, 3, 4, 5].map((day) => ({
                    dayOfWeek: day,
                    slots: [{ start: '09:00', end: '18:00' }],
                })),
        },
        isActive: { type: Boolean, default: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalReviews: { type: Number, default: 0, min: 0 },
        showInPublicPage: { type: Boolean, default: true },
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

// Índice compuesto para búsquedas del negocio
ProfessionalSchema.index({ businessId: 1, isActive: 1 });
// Índice para búsqueda por usuario
ProfessionalSchema.index({ userId: 1, businessId: 1 }, { unique: true });

const Professional: Model<IProfessionalDocument> =
    mongoose.models.Professional ||
    mongoose.model<IProfessionalDocument>('Professional', ProfessionalSchema);

export default Professional;
