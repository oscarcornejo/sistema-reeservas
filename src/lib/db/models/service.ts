/**
 * @fileoverview Modelo de Servicio.
 * Define los servicios que ofrece un negocio: nombre, duración, precio.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IService, SupportedCurrency } from '@/types';

export interface IServiceDocument extends Omit<IService, '_id'>, Document { }

const ServiceSchema = new Schema(
    {
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'El nombre del servicio es requerido'],
            trim: true,
            maxlength: 150,
        },
        description: { type: String, maxlength: 500 },
        category: {
            type: String,
            required: [true, 'La categoría es requerida'],
            trim: true,
        },
        duration: {
            type: Number,
            required: [true, 'La duración es requerida'],
            min: [5, 'La duración mínima es 5 minutos'],
            max: [480, 'La duración máxima es 8 horas'],
        },
        price: {
            type: Number,
            required: [true, 'El precio es requerido'],
            min: [0, 'El precio no puede ser negativo'],
        },
        currency: {
            type: String,
            enum: ['CLP', 'MXN'] satisfies SupportedCurrency[],
            default: 'CLP',
        },
        isActive: { type: Boolean, default: true },
        image: { type: String },
        order: { type: Number, default: 0 },
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

// Índice para listados del negocio
ServiceSchema.index({ businessId: 1, isActive: 1, order: 1 });

const Service: Model<IServiceDocument> =
    mongoose.models.Service ||
    mongoose.model<IServiceDocument>('Service', ServiceSchema);

export default Service;
