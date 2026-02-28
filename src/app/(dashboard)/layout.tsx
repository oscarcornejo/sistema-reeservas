/**
 * @fileoverview Layout compartido para dashboards (admin/profesional/cliente).
 * Shell estatico con PPR — el auth check, sidebar y top navbar son dinamicos dentro de Suspense.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import Sidebar from '@/components/layout/Sidebar';
import TopNavbar from '@/components/layout/TopNavbar';
import type { UserRole } from '@/types';

/** Construir objeto user a partir de la sesión de auth */
function buildUserFromSession(session: { user: { name?: string | null; email?: string | null; role?: string; image?: string | null } }) {
    return {
        name: session.user.name || 'Usuario',
        email: session.user.email || '',
        role: session.user.role as UserRole,
        image: session.user.image,
    };
}

/** Sidebar con auth — componente async dentro de Suspense */
async function AuthSidebar() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return <Sidebar user={buildUserFromSession(session)} />;
}

/** TopNavbar con auth — componente async dentro de Suspense */
async function AuthTopNavbar() {
    const session = await auth();
    if (!session?.user) return null;

    return <TopNavbar user={buildUserFromSession(session)} />;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <Suspense fallback={<div className="hidden lg:block w-[260px] border-r shrink-0 h-screen" />}>
                <AuthSidebar />
            </Suspense>
            <main className="flex-1 lg:pl-0 pt-14 lg:pt-0">
                <Suspense fallback={null}>
                    <AuthTopNavbar />
                </Suspense>
                <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
