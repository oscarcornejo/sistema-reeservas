/**
 * @fileoverview Modelo de Usuario para autenticación y gestión de perfiles.
 * Soporta tres roles: admin (negocio), professional y client.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IUser, UserRole, SupportedLocale } from '@/types';

/** Documento de Mongoose con métodos de instancia */
export interface IUserDocument extends Omit<IUser, '_id'>, Document { }

const UserSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
            select: false, // No incluir en queries por defecto
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        },
        phone: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'professional', 'client'] satisfies UserRole[],
            required: [true, 'El rol es requerido'],
            default: 'client',
        },
        avatar: {
            type: String, // URL de Cloudinary
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Date,
        },
        mfaEnabled: {
            type: Boolean,
            default: false,
        },
        mfaSecret: {
            type: String,
            select: false, // Nunca exponer el secreto MFA
        },
        preferredLocale: {
            type: String,
            enum: ['es-CL', 'es-MX'] satisfies SupportedLocale[],
            default: 'es-CL',
        },
    },
    {
        timestamps: true,
        toJSON: {
            // Transformar _id a id y eliminar campos sensibles
            transform(_doc, ret: Record<string, unknown>) {
                ret.id = (ret._id as { toString(): string }).toString();
                delete ret._id;
                delete ret.__v;
                delete ret.password;
                delete ret.mfaSecret;
                return ret;
            },
        },
    }
);

// Índices para búsquedas frecuentes
UserSchema.index({ role: 1, isActive: 1 });

/** Modelo de Usuario — singleton para evitar re-compilación en hot-reload */
const User: Model<IUserDocument> =
    mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
