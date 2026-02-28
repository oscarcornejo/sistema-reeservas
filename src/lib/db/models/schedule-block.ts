/**
 * @fileoverview Modelo de Bloqueo de Agenda (ScheduleBlock).
 * Permite a admins y profesionales bloquear periodos de tiempo.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IScheduleBlock, ScheduleBlockType } from '@/types';

export interface IScheduleBlockDocument
    extends Omit<IScheduleBlock, '_id'>,
    Document { }

const ScheduleBlockSchema = new Schema(
    {
        professionalId: {
            type: Schema.Types.ObjectId,
            ref: 'Professional',
            required: [true, 'El profesional es requerido'],
            index: true,
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        blockType: {
            type: String,
            enum: ['day', 'week', 'month', 'full'] satisfies ScheduleBlockType[],
            required: [true, 'El tipo de bloqueo es requerido'],
        },
        startDate: {
            type: Date,
            required: [true, 'La fecha de inicio es requerida'],
        },
        endDate: {
            type: Date,
            default: null,
        },
        reason: {
            type: String,
            required: [true, 'El motivo es requerido'],
            maxlength: 500,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El creador es requerido'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
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

// Índice compuesto: bloques activos de un profesional por rango de fechas
ScheduleBlockSchema.index({ professionalId: 1, isActive: 1, startDate: 1, endDate: 1 });

const ScheduleBlock: Model<IScheduleBlockDocument> =
    mongoose.models.ScheduleBlock ||
    mongoose.model<IScheduleBlockDocument>('ScheduleBlock', ScheduleBlockSchema);

export default ScheduleBlock;
