/**
 * @fileoverview Middleware de Next.js — delega a Auth.js para proteccion de rutas.
 * Importa desde auth.config.ts (edge-compatible) para evitar dependencias Node.js.
 */

import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    /**
     * Matcher: proteger todas las rutas excepto estaticos y API internas.
     * Ref: https://nextjs.org/docs/app/building-your-application/routing/middleware
     */
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
