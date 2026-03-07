/**
 * @fileoverview Utilidades de formato para fechas y moneda.
 * Soporta locales cl (Chile) y mx (México).
 */

import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SupportedCurrency, SupportedLocale } from '@/types';

/**
 * Formatear monto como moneda local.
 * CLP: sin decimales, prefijo $
 * MXN: con 2 decimales, prefijo $
 */
export function formatCurrency(
    amount: number,
    currency: SupportedCurrency = 'CLP'
): string {
    const locale = currency === 'CLP' ? 'es-CL' : 'es-MX';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: currency === 'CLP' ? 0 : 2,
        maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(amount);
}

/**
 * Formatear fecha en formato legible.
 * @param date - ISO string o Date
 * @param formatStr - Formato de date-fns (default: "dd 'de' MMMM, yyyy")
 */
export function formatDate(
    date: string | Date,
    formatStr: string = "dd 'de' MMMM, yyyy"
): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: es });
}

/**
 * Formatear hora en formato HH:mm legible.
 * @param time - String "HH:mm"
 */
export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${minutes} ${period}`;
}

/**
 * Texto relativo: "Hoy", "Mañana", o fecha formateada.
 */
export function formatRelativeDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    return format(d, "EEEE dd 'de' MMMM", { locale: es });
}

/**
 * "Hace 2 horas", "en 3 días", etc.
 */
export function formatTimeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

/**
 * Días de la semana en español.
 */
export const DAYS_OF_WEEK = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
] as const;

/**
 * Categorías de negocio disponibles.
 */
export const BUSINESS_CATEGORIES = [
    'Barbería',
    'Spa',
    'Consultorio Dental',
    'Peluquería',
    'Centro de Estética',
    'Clínica',
    'Centro de Masajes',
    'Salón de Belleza',
    'Consultorio Médico',
    'Clínica de Fisioterapia',
    'Uñas y Manicure',
    'Otro',
] as const;

/**
 * Colores de estado de cita para UI.
 */
export const APPOINTMENT_STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
    confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
    'in-progress': { label: 'En progreso', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-800', dot: 'bg-green-400' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', dot: 'bg-red-400' },
    'no-show': { label: 'No asistió', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
} as const;
