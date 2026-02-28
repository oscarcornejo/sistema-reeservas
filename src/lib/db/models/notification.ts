/**
 * @fileoverview Modelo de Notificación.
 * Almacena notificaciones in-app para profesionales y admins.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { INotification, NotificationType } from '@/types';

export interface INotificationDocument
    extends Omit<INotification, '_id'>,
    Document { }

const NotificationSchema = new Schema(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El destinatario es requerido'],
            index: true,
        },
        type: {
            type: String,
            enum: [
                'new-booking',
                'booking-cancelled',
                'booking-rescheduled',
                'booking-reminder',
                'schedule-blocked',
                'schedule-unblocked',
            ] satisfies NotificationType[],
            required: [true, 'El tipo es requerido'],
        },
        title: {
            type: String,
            required: [true, 'El título es requerido'],
            maxlength: 200,
        },
        message: {
            type: String,
            required: [true, 'El mensaje es requerido'],
            maxlength: 500,
        },
        referenceId: { type: String },
        referenceModel: {
            type: String,
            enum: ['Appointment', 'Business', 'ScheduleBlock'],
        },
        isRead: {
            type: Boolean,
            default: false,
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

// Índice compuesto: notificaciones no leídas del usuario, ordenadas por fecha
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotificationDocument> =
    mongoose.models.Notification ||
    mongoose.model<INotificationDocument>('Notification', NotificationSchema);

export default Notification;
