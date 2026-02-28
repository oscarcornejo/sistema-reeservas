/**
 * @fileoverview Configuración edge-compatible de Auth.js.
 * Solo contiene pages, session y callbacks (sin dependencias Node.js).
 * Se usa desde el middleware (Edge Runtime) y desde auth.ts (Node.js).
 */

import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/types';

export const authConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 dias
    },
    providers: [], // Se agregan en auth.ts (Node.js)
    callbacks: {
        /**
         * Incluir role y userId en el JWT.
         */
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role: UserRole }).role;
                token.userId = user.id!;
            }
            return token;
        },
        /**
         * Exponer datos del token en la sesion del cliente.
         */
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                session.user.role = token.role as UserRole;
            }
            return session;
        },
        /**
         * Controlar acceso a rutas protegidas basado en el rol.
         */
        async authorized({ auth: session, request: { nextUrl } }) {
            const isLoggedIn = !!session?.user;
            const pathname = nextUrl.pathname;

            // Rutas protegidas por rol
            const adminRoutes = pathname.startsWith('/admin');
            const professionalRoutes = pathname.startsWith('/profesional');
            const clientRoutes = pathname.startsWith('/cliente');

            if (adminRoutes) {
                return isLoggedIn && session.user.role === 'admin';
            }
            if (professionalRoutes) {
                return isLoggedIn && session.user.role === 'professional';
            }
            if (clientRoutes) {
                return isLoggedIn && session.user.role === 'client';
            }

            // Rutas de auth: redirigir si ya esta logueado
            if (isLoggedIn && (pathname === '/login' || pathname === '/registro')) {
                const redirectMap: Record<UserRole, string> = {
                    admin: '/admin',
                    professional: '/profesional',
                    client: '/cliente',
                };
                return Response.redirect(
                    new URL(redirectMap[session.user.role], nextUrl.origin)
                );
            }

            return true;
        },
    },
} satisfies NextAuthConfig;
