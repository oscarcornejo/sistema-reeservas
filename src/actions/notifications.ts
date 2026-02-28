/**
 * @fileoverview Server Actions de Notificaciones.
 * CRUD para notificaciones in-app del usuario autenticado.
 */

'use server';

import { connectDB } from '@/lib/db/connection';
import { Notification } from '@/lib/db/models';
import { requireAuth } from '@/lib/auth/dal';
import { serialize } from '@/lib/utils';
import type { ActionResult, INotification } from '@/types';

/**
 * Obtener las últimas 20 notificaciones del usuario autenticado.
 */
export async function getMyNotifications(): Promise<ActionResult<INotification[]>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const notifications = await Notification.find({ recipientId: user.id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return { success: true, data: serialize(notifications) as INotification[] };
    } catch (error) {
        console.error('Error obteniendo notificaciones:', error);
        return { success: false, error: 'Error al obtener notificaciones' };
    }
}

/**
 * Obtener el conteo de notificaciones no leídas.
 */
export async function getUnreadCount(): Promise<ActionResult<number>> {
    const user = await requireAuth();

    try {
        await connectDB();

        const count = await Notification.countDocuments({
            recipientId: user.id,
            isRead: false,
        });

        return { success: true, data: count };
    } catch (error) {
        console.error('Error obteniendo conteo de no leídas:', error);
        return { success: false, error: 'Error al obtener conteo' };
    }
}

/**
 * Marcar una notificación como leída.
 * Verifica que la notificación pertenezca al usuario autenticado.
 */
export async function markNotificationAsRead(
    notificationId: string
): Promise<ActionResult> {
    const user = await requireAuth();

    try {
        await connectDB();

        const result = await Notification.findOneAndUpdate(
            { _id: notificationId, recipientId: user.id },
            { isRead: true }
        );

        if (!result) {
            return { success: false, error: 'Notificación no encontrada' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error marcando notificación como leída:', error);
        return { success: false, error: 'Error al actualizar notificación' };
    }
}

/**
 * Marcar todas las notificaciones del usuario como leídas.
 */
export async function markAllNotificationsAsRead(): Promise<ActionResult> {
    const user = await requireAuth();

    try {
        await connectDB();

        await Notification.updateMany(
            { recipientId: user.id, isRead: false },
            { isRead: true }
        );

        return { success: true };
    } catch (error) {
        console.error('Error marcando todas como leídas:', error);
        return { success: false, error: 'Error al actualizar notificaciones' };
    }
}
