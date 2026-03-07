/**
 * @fileoverview Pagina de notificaciones del administrador.
 * Muestra todas las notificaciones con filtros y paginacion.
 */

import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';

export default function AdminNotificationsPage() {
    return <NotificationsPageClient role="admin" />;
}
