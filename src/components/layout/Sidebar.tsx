/**
 * @fileoverview Sidebar de navegación para dashboards.
 * Responsiva: sidebar lateral en desktop, bottom bar en mobile.
 * Soporta los tres roles del sistema con diferentes items de menú.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    Building2,
    Calendar,
    LayoutDashboard,
    Users,
    Scissors,
    BarChart3,
    Settings,
    CreditCard,
    Search,
    Clock,
    UserCircle,
    LogOut,
    Menu,
} from 'lucide-react';
import { UserDropdownMenu } from './TopNavbar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';
import type { UserRole, SubscriptionPlan } from '@/types';

/** Tipo de item de navegación */
interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    /** Planes que tienen acceso a este item (solo aplica para admin) */
    allowedPlans?: SubscriptionPlan[];
}

/** Items de navegación por rol */
const NAV_CONFIG: Record<UserRole, NavItem[]> = {
    admin: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Negocios', href: '/admin/negocios', icon: Building2, allowedPlans: ['enterprise'] },
        { label: 'Calendario', href: '/admin/calendario', icon: Calendar },
        { label: 'Servicios', href: '/admin/servicios', icon: Scissors },
        { label: 'Profesionales', href: '/admin/profesionales', icon: Users },
        { label: 'Clientes', href: '/admin/clientes', icon: UserCircle },
        { label: 'Reportes', href: '/admin/reportes', icon: BarChart3, allowedPlans: ['professional', 'enterprise'] },
        { label: 'Suscripción', href: '/admin/suscripcion', icon: CreditCard },
        { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
    ],
    professional: [
        { label: 'Mi Agenda', href: '/profesional', icon: LayoutDashboard },
        { label: 'Calendario', href: '/profesional/calendario', icon: Calendar },
        { label: 'Mis Clientes', href: '/profesional/clientes', icon: Users },
        { label: 'Perfil', href: '/profesional/perfil', icon: UserCircle },
    ],
    client: [
        { label: 'Inicio', href: '/cliente', icon: LayoutDashboard },
        { label: 'Reservar', href: '/cliente/reservar', icon: Search },
        { label: 'Mis Citas', href: '/cliente/mis-citas', icon: Calendar },
        { label: 'Historial', href: '/cliente/historial', icon: Clock },
        { label: 'Perfil', href: '/cliente/perfil', icon: UserCircle },
    ],
};

interface SidebarProps {
    user: {
        name: string;
        email: string;
        role: UserRole;
        image?: string | null;
        subscriptionPlan?: SubscriptionPlan;
    };
}

/**
 * Contenido interno del sidebar — reutilizado entre desktop y mobile (Sheet).
 */
function SidebarContent({
    user,
    onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
    const pathname = usePathname();
    const navItems = NAV_CONFIG[user.role].filter((item) => {
        if (!item.allowedPlans || user.role !== 'admin') return true;
        return user.subscriptionPlan ? item.allowedPlans.includes(user.subscriptionPlan) : true;
    });

    const isActive = (href: string) => {
        if (href === '/admin' || href === '/profesional' || href === '/cliente') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                    T
                </div>
                <span className="text-lg font-bold">TurnoPro</span>
            </div>

            {/* Navegación */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                                        ? 'bg-sidebar-accent text-sidebar-primary'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                                    }`}
                            >
                                <Icon className="h-4.5 w-4.5" />
                                {item.label}
                                {active && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary animate-pulse-dot" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator className="bg-sidebar-border" />

            {/* Perfil de usuario */}
            <div className="p-4">
                <div className="flex items-center gap-3 rounded-lg p-2">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-sm font-medium">
                            {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-sidebar-foreground/50 truncate">
                            {user.email}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        onClick={() => signOut({ callbackUrl: '/' })}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Sidebar responsiva.
 * Desktop: sidebar fija lateral de 260px.
 * Mobile: Sheet deslizable desde la izquierda.
 */
export default function Sidebar({ user }: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-[260px] border-r border-sidebar-border shrink-0 h-screen sticky top-0">
                <SidebarContent user={user} />
            </aside>

            {/* Mobile trigger + sheet */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-background/80 backdrop-blur-xl px-4">
                <div className="flex items-center gap-2">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Abrir menú">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0">
                            <SidebarContent user={user} onNavigate={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                            T
                        </div>
                        <span className="font-semibold text-sm">TurnoPro</span>
                    </div>
                </div>
                <UserDropdownMenu user={user} />
            </div>
        </>
    );
}
