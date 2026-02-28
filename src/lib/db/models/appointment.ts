/**
 * @fileoverview Modelo de Cita/Turno (Appointment).
 * Pieza central del sistema — vincula cliente, profesional, servicio y negocio.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
    IAppointment,
    AppointmentStatus,
    PaymentStatus,
    PaymentMethod,
} from '@/types';

export interface IAppointmentDocument
    extends Omit<IAppointment, '_id'>,
    Document { }

/** Sub-schema de log de recordatorios */
const ReminderLogSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['email'],
            default: 'email',
        },
        sentAt: { type: Date, required: true },
        status: {
            type: String,
            enum: ['sent', 'failed'],
            required: true,
        },
    },
    { _id: false }
);

const AppointmentSchema = new Schema(
    {
        businessId: {
            type: Schema.Types.ObjectId,
            ref: 'Business',
            required: [true, 'El negocio es requerido'],
            index: true,
        },
        clientId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'El cliente es requerido'],
            index: true,
        },
        professionalId: {
            type: Schema.Types.ObjectId,
            ref: 'Professional',
            required: [true, 'El profesional es requerido'],
            index: true,
        },
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: [true, 'El servicio es requerido'],
        },
        // --- Horario ---
        date: {
            type: Date,
            required: [true, 'La fecha es requerida'],
            index: true,
        },
        startTime: {
            type: String,
            required: [true, 'La hora de inicio es requerida'],
        },
        endTime: {
            type: String,
            required: [true, 'La hora de fin es requerida'],
        },
        duration: {
            type: Number,
            required: [true, 'La duración es requerida'],
            min: 5,
        },
        // --- Estado ---
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'in-progress',
                'completed',
                'cancelled',
                'no-show',
            ] satisfies AppointmentStatus[],
            default: 'pending',
            index: true,
        },
        // --- Pago ---
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'] satisfies PaymentStatus[],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'mercadopago'] satisfies PaymentMethod[],
        },
        paymentAmount: { type: Number, default: 0, min: 0 },
        mercadopagoPaymentId: { type: String },
        // --- Notas ---
        clientNotes: { type: String, maxlength: 500 },
        professionalNotes: { type: String, maxlength: 1000 },
        cancellationReason: { type: String, maxlength: 500 },
        // --- Recordatorios ---
        remindersSent: { type: [ReminderLogSchema], default: [] },
        // --- Rating ---
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String, maxlength: 500 },
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

// Índice compuesto principal: calendario del negocio por fecha y profesional
AppointmentSchema.index({ businessId: 1, date: 1, professionalId: 1 });
// Índice para historial del cliente
AppointmentSchema.index({ clientId: 1, date: -1 });
// Índice para búsqueda de recordatorios pendientes
AppointmentSchema.index({ status: 1, date: 1, 'remindersSent.type': 1 });

const Appointment: Model<IAppointmentDocument> =
    mongoose.models.Appointment ||
    mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);

export default Appointment;
