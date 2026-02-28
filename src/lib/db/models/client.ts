/**
 * @fileoverview Modelo de Cliente.
 * Vinculado a un negocio específico. Incluye historial de visitas y segmentación.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IClient, ClientSource } from '@/types';

export interface IClientDocument extends Omit<IClient, '_id'>, Document { }

/** Sub-schema de historial de visitas */
const VisitRecordSchema = new Schema(
    {
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        date: { type: Date, required: true },
        serviceName: { type: String, required: true },
        professionalName: { type: String, required: true },
        notes: { type: String },
    },
    { _id: false }
);

const ClientSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'El teléfono es requerido'],
            trim: true,
        },
        notes: { type: String, maxlength: 2000 },
        tags: { type: [String], default: [] },
        visitHistory: { type: [VisitRecordSchema], default: [] },
        source: {
            type: String,
            enum: ['online', 'walk-in', 'referral', 'marketplace'] satisfies ClientSource[],
            default: 'online',
        },
        totalSpent: { type: Number, default: 0, min: 0 },
        totalVisits: { type: Number, default: 0, min: 0 },
        lastVisit: { type: Date },
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

// Índice compuesto: un cliente por negocio + email
ClientSchema.index({ businessId: 1, email: 1 }, { unique: true });
// Índice para búsqueda por tags
ClientSchema.index({ businessId: 1, tags: 1 });

const Client: Model<IClientDocument> =
    mongoose.models.Client ||
    mongoose.model<IClientDocument>('Client', ClientSchema);

export default Client;
