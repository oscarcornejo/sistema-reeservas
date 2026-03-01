/**
 * @fileoverview Configuracion completa de Auth.js con CredentialsProvider.
 * Extiende auth.config.ts (edge-compatible) con providers que requieren Node.js.
 * Este archivo solo se usa en Server Components/Actions (runtime Node.js).
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/user';
import { authConfig } from './auth.config';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';
import { authLogger } from '@/lib/logger';
import { auditLog } from '@/lib/logger/audit';
import type { UserRole } from '@/types';

// Extender tipos de Auth.js para incluir role y userId
declare module 'next-auth' {
    interface User {
        role: UserRole;
    }
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            image?: string | null;
        };
    }
}

declare module 'next-auth' {
    interface JWT {
        role: UserRole;
        userId: string;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'Credenciales',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Contrasena', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email y contrasena son requeridos');
                }

                const email = (credentials.email as string).toLowerCase();

                // Rate limit por email
                const rateCheck = checkRateLimit(`auth:${email}`, RATE_LIMITS.auth);
                if (!rateCheck.allowed) {
                    auditLog('rate_limit.exceeded', { email, metadata: { key: `auth:${email}` } });
                    throw new Error('Demasiados intentos. Intenta de nuevo en unos minutos');
                }

                await connectDB();

                // Buscar usuario con password (que normalmente esta excluido)
                const user = await User.findOne({
                    email,
                    isActive: true,
                }).select('+password');

                if (!user) {
                    auditLog('login.failure', { email, reason: 'Usuario no encontrado' });
                    throw new Error('Credenciales invalidas');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    auditLog('login.failure', { email, userId: user._id.toString(), reason: 'Contraseña incorrecta' });
                    throw new Error('Credenciales invalidas');
                }

                auditLog('login.success', { email, userId: user._id.toString() });
                authLogger.info('Login exitoso', { email, userId: user._id.toString() });

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.avatar,
                };
            },
        }),
    ],
});
