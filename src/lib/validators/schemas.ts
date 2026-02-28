/**
 * @fileoverview Schemas de validación Zod para formularios y Server Actions.
 * Centralizamos toda la validación de entrada aquí para reutilizar
 * entre client-side (forms) y server-side (actions).
 */

import { z } from 'zod';

// =============================================================================
// Autenticación
// =============================================================================

/** Schema de login */
export const loginSchema = z.object({
    email: z
        .string()
        .email('Ingresa un email válido')
        .min(1, 'El email es requerido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/** Schema de registro */
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z
        .string()
        .email('Ingresa un email válido'),
    password: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'professional', 'client'], {
        error: 'Selecciona un tipo de cuenta',
    }),
    phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

// =============================================================================
// Servicios
// =============================================================================

/** Schema para crear/editar servicio */
export const serviceSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(150, 'Máximo 150 caracteres'),
    description: z.string().max(500).optional(),
    category: z.string().min(1, 'La categoría es requerida'),
    duration: z
        .number({ message: 'La duración es requerida' })
        .min(5, 'Mínimo 5 minutos')
        .max(480, 'Máximo 8 horas'),
    price: z
        .number({ message: 'El precio es requerido' })
        .min(0, 'El precio no puede ser negativo'),
});

// =============================================================================
// Citas
// =============================================================================

/** Schema para crear una cita */
export const createAppointmentSchema = z.object({
    businessId: z.string().min(1, 'El negocio es requerido'),
    professionalId: z.string().min(1, 'El profesional es requerido'),
    serviceId: z.string().min(1, 'El servicio es requerido'),
    date: z.string().min(1, 'La fecha es requerida'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
    clientNotes: z.string().max(500).optional(),
});

/** Schema para reserva pública (sin autenticación requerida) */
export const publicBookingSchema = z.object({
    businessId: z.string().min(1, 'El negocio es requerido'),
    professionalId: z.string().min(1, 'El profesional es requerido'),
    serviceId: z.string().min(1, 'El servicio es requerido'),
    date: z.string().min(1, 'La fecha es requerida'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
    clientName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    clientEmail: z.string().email('Email inválido'),
    clientPhone: z.string().min(8, 'Teléfono inválido'),
    clientNotes: z.string().max(500).optional(),
});

// =============================================================================
// Profesionales
// =============================================================================

/** Schema para crear/editar profesional */
export const professionalSchema = z.object({
    email: z.string().email('Email inválido'),
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
    specialties: z.array(z.string()).min(1, 'Agrega al menos una especialidad'),
    bio: z.string().max(500).optional(),
});

// =============================================================================
// Negocio
// =============================================================================

/** Schema para configurar el negocio */
export const businessSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(150),
    description: z.string().max(1000).optional(),
    category: z.string().min(1, 'La categoría es requerida'),
    address: z.string().min(5, 'La dirección es requerida'),
    city: z.string().min(2, 'La ciudad es requerida'),
    state: z.string().min(2, 'La región/estado es requerido'),
    country: z.enum(['CL', 'MX']),
    phone: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido'),
    website: z.string().url().optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

/** Schema para información general del negocio (configuración) */
export const businessSettingsSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(150),
    description: z.string().max(1000).optional(),
    category: z.string().min(1, 'La categoría es requerida'),
});

/** Schema para ubicación y contacto del negocio */
export const businessLocationSchema = z.object({
    address: z.string().min(5, 'La dirección es requerida'),
    city: z.string().min(2, 'La ciudad es requerida'),
    state: z.string().min(2, 'La región/estado es requerido'),
    country: z.enum(['CL', 'MX']),
    phone: z.string().min(8, 'Teléfono inválido'),
    email: z.string().email('Email inválido'),
    website: z.string().url('URL inválida').optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

/** Schema para horarios de trabajo (array de 7 días) */
export const workingHoursSchema = z.array(
    z.object({
        dayOfWeek: z.number().min(0).max(6),
        isOpen: z.boolean(),
        openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
        closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
    })
).length(7, 'Se requieren los 7 días de la semana');

/** Schema para preferencias de pago y publicación */
export const businessPreferencesSchema = z.object({
    timezone: z.string().min(1, 'La zona horaria es requerida'),
    currency: z.enum(['CLP', 'MXN']),
    allowOnlinePayments: z.boolean(),
    requirePaymentUpfront: z.boolean(),
    cancellationPolicy: z.string().max(500, 'Máximo 500 caracteres').optional(),
    isPublished: z.boolean(),
});

/** Schema para datos del cliente */
export const clientSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Teléfono inválido'),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string()).optional(),
    source: z.enum(['online', 'walk-in', 'referral', 'marketplace']).optional(),
});

// =============================================================================
// Perfil de usuario
// =============================================================================

/** Schema para editar perfil de usuario */
export const profileSchema = z.object({
    name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres'),
    phone: z
        .string()
        .min(8, 'El teléfono debe tener al menos 8 caracteres')
        .optional()
        .or(z.literal('')),
    preferredLocale: z.enum(['es-CL', 'es-MX'], {
        error: 'Selecciona un idioma válido',
    }),
});

/** Schema para cambiar contraseña */
export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'La contraseña actual es requerida'),
    newPassword: z
        .string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

// =============================================================================
// Tipos inferidos (para uso en formularios)
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type AppointmentInput = z.infer<typeof createAppointmentSchema>;
export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
export type BusinessLocationInput = z.infer<typeof businessLocationSchema>;
export type WorkingHoursInput = z.infer<typeof workingHoursSchema>;
export type BusinessPreferencesInput = z.infer<typeof businessPreferencesSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
