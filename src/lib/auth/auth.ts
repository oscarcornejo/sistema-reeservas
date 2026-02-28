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

                await connectDB();

                // Buscar usuario con password (que normalmente esta excluido)
                const user = await User.findOne({
                    email: (credentials.email as string).toLowerCase(),
                    isActive: true,
                }).select('+password');

                if (!user) {
                    throw new Error('Credenciales invalidas');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error('Credenciales invalidas');
                }

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
