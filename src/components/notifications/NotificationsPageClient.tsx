/**
 * @fileoverview Cliente compartido para la página de notificaciones.
 * Usado tanto por admin como por profesional.
 * Muestra tabla con filtros, paginación y acciones de lectura.
 */

'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Ban,
    Bell,
    CalendarCheck2,
    CalendarClock,
    CalendarPlus,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    getAllMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/actions/notifications';
import { useNotificationStore } from '@/lib/store';
import { formatTimeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

const TYPE_CONFIG: Record<NotificationType, { icon: typeof CalendarPlus; label: string; color: string; bg: string }> = {
    'new-booking': {
        icon: CalendarPlus,
        label: 'Nueva reserva',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    'booking-cancelled': {
        icon: XCircle,
        label: 'Cancelada',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10 dark:bg-red-500/20',
    },
    'booking-rescheduled': {
        icon: CalendarClock,
        label: 'Reagendada',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    'booking-reminder': {
        icon: Bell,
        label: 'Recordatorio',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    },
    'schedule-blocked': {
        icon: Ban,
        label: 'Bloqueo',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    },
    'schedule-unblocked': {
        icon: CalendarCheck2,
        label: 'Desbloqueo',
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

const ROLE_CALENDAR: Record<string, string> = {
    admin: '/admin/calendario',
    professional: '/profesional/calendario',
};

interface NotificationsPageClientProps {
    role?: string;
}

export default function NotificationsPageClient({ role }: NotificationsPageClientProps) {
    const router = useRouter();
    const { setUnreadCount, decrementUnread, clearUnread } = useNotificationStore();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [typeFilter, setTypeFilter] = useState('all');
    const [readFilter, setReadFilter] = useState('all');
    const [isPending, startTransition] = useTransition();

    const fetchNotifications = useCallback(async (p: number, type: string, isRead: string) => {
        setIsLoading(true);
        const result = await getAllMyNotifications({
            page: p,
            limit: 20,
            type,
            isRead: isRead === 'all' ? undefined : isRead,
        });
        if (result.success && result.data) {
            setNotifications(
                result.data.notifications.map((n) => ({
                    id: (n as unknown as { id: string }).id ?? String(n._id),
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    isRead: n.isRead,
                    createdAt: String(n.createdAt),
                    referenceId: n.referenceId,
                }))
            );
            setTotal(result.data.total);
            setTotalPages(result.data.totalPages);
            setPage(result.data.page);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchNotifications(page, typeFilter, readFilter);
    }, [page, typeFilter, readFilter, fetchNotifications]);

    async function handleMarkAsRead(id: string) {
        startTransition(async () => {
            const result = await markNotificationAsRead(id);
            if (result.success) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
                );
                decrementUnread();
            }
        });
    }

    async function handleMarkAllAsRead() {
        startTransition(async () => {
            const result = await markAllNotificationsAsRead();
            if (result.success) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                clearUnread();
            }
        });
    }

    const unreadInPage = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {total === 0
                                ? 'No tienes notificaciones'
                                : `${total} notificaci${total === 1 ? 'on' : 'ones'} en total`}
                        </p>
                    </div>
                    {unreadInPage > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            disabled={isPending}
                        >
                            <CheckCheck className="mr-1.5 h-4 w-4" />
                            Marcar todas como leidas
                        </Button>
                    )}
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
                </div>
                <Select
                    value={typeFilter}
                    onValueChange={(v) => { setTypeFilter(v); setPage(1); }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                {config.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={readFilter}
                    onValueChange={(v) => { setReadFilter(v); setPage(1); }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="false">No leidas</SelectItem>
                        <SelectItem value="true">Leidas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Lista */}
            <Card className="border-border/50">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
                                <Bell className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Sin notificaciones
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                {typeFilter !== 'all' || readFilter !== 'all'
                                    ? 'No hay resultados con los filtros seleccionados'
                                    : 'Las nuevas notificaciones apareceran aqui'}
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
                                            'flex gap-4 px-5 py-4 transition-colors cursor-pointer',
                                            !notification.isRead
                                                ? 'bg-primary/[0.03] dark:bg-primary/[0.06]'
                                                : 'hover:bg-muted/30'
                                        )}
                                        onClick={() => {
                                            if (notification.referenceId && role && ROLE_CALENDAR[role]) {
                                                if (!notification.isRead) handleMarkAsRead(notification.id);
                                                router.push(`${ROLE_CALENDAR[role]}?cita=${notification.referenceId}`);
                                            }
                                        }}
                                    >
                                        {/* Icono */}
                                        <div
                                            className={cn(
                                                'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                notification.isRead
                                                    ? 'bg-muted/60 text-muted-foreground'
                                                    : `${config.bg} ${config.color}`
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        {/* Contenido */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn(
                                                            'text-sm leading-tight',
                                                            !notification.isRead
                                                                ? 'font-semibold'
                                                                : 'font-medium text-muted-foreground'
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                        )}
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-[10px] px-1.5 py-0 h-5 shrink-0',
                                                                notification.isRead
                                                                    ? 'text-muted-foreground'
                                                                    : `${config.color}`
                                                            )}
                                                        >
                                                            {config.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>

                                                {/* Accion */}
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="shrink-0 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                                        disabled={isPending}
                                                    >
                                                        <Check className="mr-1 h-3.5 w-3.5" />
                                                        Marcar leida
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Paginacion */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Pagina {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Siguiente
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
