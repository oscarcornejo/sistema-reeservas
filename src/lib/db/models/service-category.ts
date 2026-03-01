/**
 * @fileoverview Modelo de Categoría de Servicio.
 * Define las categorías personalizadas de cada negocio para agrupar servicios.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IServiceCategory } from '@/types';

export interface IServiceCategoryDocument extends Omit<IServiceCategory, '_id'>, Document { }

const ServiceCategorySchema = new Schema(
    {
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'El nombre de la categoría es requerido'],
            trim: true,
            maxlength: 100,
        },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
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

ServiceCategorySchema.index({ businessId: 1, isActive: 1, order: 1 });

const ServiceCategory: Model<IServiceCategoryDocument> =
    mongoose.models.ServiceCategory ||
    mongoose.model<IServiceCategoryDocument>('ServiceCategory', ServiceCategorySchema);

export default ServiceCategory;
