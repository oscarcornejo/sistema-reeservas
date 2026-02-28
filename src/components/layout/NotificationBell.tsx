/**
 * @fileoverview Campana de notificaciones in-app.
 * Muestra badge con conteo de no leídas y popover con la lista.
 * Polling cada 30s para actualizar conteo. Carga lista al abrir.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Ban, Bell, CalendarCheck2, CalendarPlus, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    getMyNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/actions/notifications';
import { useNotificationStore } from '@/lib/store';
import { formatTimeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

/** Icono según el tipo de notificación */
const TYPE_ICONS: Record<NotificationType, typeof CalendarPlus> = {
    'new-booking': CalendarPlus,
    'booking-cancelled': CalendarPlus,
    'booking-rescheduled': CalendarPlus,
    'booking-reminder': Bell,
    'schedule-blocked': Ban,
    'schedule-unblocked': CalendarCheck2,
};

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

/** Intervalo de polling en milisegundos (30 segundos) */
const POLL_INTERVAL = 30_000;

export default function NotificationBell() {
    const { unreadCount, setUnreadCount, decrementUnread, clearUnread } =
        useNotificationStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    /** Obtener conteo de no leídas */
    const fetchUnreadCount = useCallback(async () => {
        const result = await getUnreadCount();
        if (result.success && result.data !== undefined) {
            setUnreadCount(result.data);
        }
    }, [setUnreadCount]);

    /** Cargar lista completa de notificaciones */
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        const result = await getMyNotifications();
        if (result.success && result.data) {
            setNotifications(
                result.data.map((n) => ({
                    id: (n as unknown as { id: string }).id ?? String(n._id),
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: n.isRead,
                    createdAt: String(n.createdAt),
                }))
            );
        }
        setIsLoading(false);
    }, []);

    // Polling para conteo
    useEffect(() => {
        fetchUnreadCount();
        intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchUnreadCount]);

    // Cargar notificaciones al abrir popover
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    /** Marcar una notificación como leída */
    async function handleMarkAsRead(id: string) {
        const result = await markNotificationAsRead(id);
        if (result.success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            decrementUnread();
        }
    }

    /** Marcar todas como leídas */
    async function handleMarkAllAsRead() {
        const result = await markAllNotificationsAsRead();
        if (result.success) {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            clearUnread();
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <h3 className="text-sm font-semibold">Notificaciones</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar todas
                        </Button>
                    )}
                </div>
                <Separator />

                {/* Lista */}
                <ScrollArea className="max-h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                Sin notificaciones
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const Icon = TYPE_ICONS[notification.type];
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'flex gap-3 px-4 py-3 transition-colors',
                                            !notification.isRead && 'bg-primary/5'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                notification.isRead
                                                    ? 'bg-muted text-muted-foreground'
                                                    : 'bg-primary/10 text-primary'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium leading-tight">
                                                {notification.title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="mt-1 text-[11px] text-muted-foreground/70">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0 self-center"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                aria-label="Marcar como leída"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
