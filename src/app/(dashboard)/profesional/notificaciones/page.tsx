/**
 * @fileoverview Pagina de notificaciones del profesional.
 * Muestra todas las notificaciones con filtros y paginacion.
 */

import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';

export default function ProfessionalNotificationsPage() {
    return <NotificationsPageClient role="professional" />;
}
