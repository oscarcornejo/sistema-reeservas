/**
 * @fileoverview TopNavbar con enlace a búsqueda, theme toggle y dropdown de usuario.
 * Desktop: barra sticky con glass morphism encima del contenido.
 * Mobile: UserDropdownMenu se reutiliza en el header del Sidebar.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, Menu, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './ThemeToggle';
import NotificationBell from './NotificationBell';
import type { UserRole, SubscriptionPlan } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    professional: 'Profesional',
    client: 'Cliente',
};

interface UserDropdownProps {
    user: {
        name: string;
        email: string;
        role: UserRole;
        image?: string | null;
        subscriptionPlan?: SubscriptionPlan;
    };
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Dropdown de usuario reutilizable.
 * Trigger tipo "pill" con icono hamburguesa + avatar.
 */
export function UserDropdownMenu({ user }: UserDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-2.5 rounded-full border border-border/60 bg-background px-2.5 py-1.5 shadow-sm transition-colors duration-150 hover:border-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label="Menú de usuario"
                >
                    <Menu className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Avatar className="h-7 w-7">
                        {user.image ? (
                            <AvatarImage src={user.image} alt={user.name} asChild>
                                <Image
                                    src={user.image}
                                    alt={user.name}
                                    width={28}
                                    height={28}
                                    className="object-cover"
                                />
                            </AvatarImage>
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground leading-none">
                            {ROLE_LABELS[user.role]}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/perfil" className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                        Mi Perfil
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * TopNavbar para desktop — glass morphism con theme toggle.
 */
export default function TopNavbar({ user }: UserDropdownProps) {
    return (
        <nav className="hidden lg:flex sticky top-0 z-30 h-14 items-center border-b border-border/40 bg-background/60 backdrop-blur-xl px-6">
            <div className="flex-1" />
            <Link
                href="/buscar"
                className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
                Buscar Negocios
            </Link>
            <div className="flex-1 flex justify-end items-center gap-2">
                <ThemeToggle />
                {user.subscriptionPlan === 'enterprise' && <NotificationBell />}
                <UserDropdownMenu user={user} />
            </div>
        </nav>
    );
}
