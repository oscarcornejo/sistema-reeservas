/**
 * @fileoverview Navbar para páginas públicas (landing, búsqueda, negocio).
 * Muestra el dropdown de usuario si hay sesión, o "Iniciar sesión" si no.
 * Incluye toggle de tema (light/dark).
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserDropdownMenu } from './TopNavbar';
import { ThemeToggle } from './ThemeToggle';
import type { UserRole } from '@/types';

interface PublicNavbarProps {
    user: {
        name: string;
        email: string;
        role: UserRole;
        image?: string | null;
    } | null;
    children?: React.ReactNode;
    showRegister?: boolean;
}

export default function PublicNavbar({
    user,
    children,
    showRegister,
}: PublicNavbarProps) {
    return (
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                        T
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        TurnoPro
                    </span>
                </Link>

                {children}

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {user ? (
                        <UserDropdownMenu user={user} />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Iniciar sesión
                                </Button>
                            </Link>
                            {showRegister && (
                                <Link href="/registro">
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                                    >
                                        Registrarse
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
