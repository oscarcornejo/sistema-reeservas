/**
 * @fileoverview Campana de notificaciones in-app.
 * Muestra badge con conteo de no leídas y popover con la lista.
 * Polling cada 30s para actualizar conteo. Carga lista al abrir.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Ban,
    Bell,
    CalendarCheck2,
    CalendarPlus,
    Check,
    CheckCheck,
    Loader2,
    XCircle,
    CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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

/** Icono y color según el tipo de notificación */
const TYPE_CONFIG: Record<NotificationType, { icon: typeof CalendarPlus; color: string; bg: string }> = {
    'new-booking': {
        icon: CalendarPlus,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    'booking-cancelled': {
        icon: XCircle,
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10 dark:bg-red-500/20',
    },
    'booking-rescheduled': {
        icon: CalendarClock,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    'booking-reminder': {
        icon: Bell,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    'schedule-blocked': {
        icon: Ban,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    },
    'schedule-unblocked': {
        icon: CalendarCheck2,
        color: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    },
};

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    referenceId?: string;
}

/** Intervalo de polling en milisegundos (30 segundos) */
const POLL_INTERVAL = 30_000;

const ROLE_PATH: Record<string, string> = {
    admin: '/admin/notificaciones',
    professional: '/profesional/notificaciones',
};

const ROLE_CALENDAR: Record<string, string> = {
    admin: '/admin/calendario',
    professional: '/profesional/calendario',
};

interface NotificationBellProps {
    role?: string;
}

export default function NotificationBell({ role }: NotificationBellProps) {
    const router = useRouter();
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
                    referenceId: n.referenceId,
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
                        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in-50">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[360px] p-0" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-primary hover:text-primary"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Marcar todas
                        </Button>
                    )}
                </div>
                <Separator />

                {/* Lista */}
                <div className="overflow-y-auto max-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                                <Bell className="h-5 w-5 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Sin notificaciones
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                Las nuevas notificaciones aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => {
                                const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG['new-booking'];
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'flex gap-3 px-4 py-3 transition-colors cursor-pointer',
                                            !notification.isRead
                                                ? 'bg-primary/[0.04] dark:bg-primary/[0.08]'
                                                : 'hover:bg-muted/30'
                                        )}
                                        onClick={() => {
                                            if (notification.referenceId && role && ROLE_CALENDAR[role]) {
                                                if (!notification.isRead) handleMarkAsRead(notification.id);
                                                setIsOpen(false);
                                                router.push(`${ROLE_CALENDAR[role]}?cita=${notification.referenceId}`);
                                            }
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                                notification.isRead
                                                    ? 'bg-muted/60 text-muted-foreground'
                                                    : `${config.bg} ${config.color}`
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    'text-sm leading-tight',
                                                    !notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <div className="mt-1.5 flex items-center justify-between">
                                                <p className="text-[11px] text-muted-foreground/60">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                                    >
                                                        <Check className="mr-1 h-3 w-3" />
                                                        Leída
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Link a pagina completa */}
                {role && ROLE_PATH[role] && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground hover:text-foreground"
                                asChild
                                onClick={() => setIsOpen(false)}
                            >
                                <Link href={ROLE_PATH[role]}>
                                    Ver todas las notificaciones
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
