/**
 * @fileoverview Server Actions de autenticación.
 * Registro e inicio de sesión con validación Zod.
 */

'use server';

import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/user';
import { signIn } from '@/lib/auth/auth';
import { loginSchema, registerSchema } from '@/lib/validators/schemas';
import type { ActionResult } from '@/types';

/** Rounds de bcrypt para hashing de contraseña */
const SALT_ROUNDS = 12;

/**
 * Registrar un nuevo usuario.
 * Valida datos, hashea password y crea el usuario en BD.
 *
 * @param formData - Datos del formulario de registro
 * @returns Resultado con éxito o error
 */
export async function registerUser(formData: FormData): Promise<ActionResult> {
    const rawData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        confirmPassword: formData.get('confirmPassword') as string,
        role: formData.get('role') as string,
        phone: formData.get('phone') as string | undefined,
    };

    // Validación con Zod
    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0].message,
        };
    }

    try {
        await connectDB();

        // Verificar si el email ya existe
        const existingUser = await User.findOne({
            email: parsed.data.email.toLowerCase(),
        });
        if (existingUser) {
            return { success: false, error: 'Este email ya está registrado' };
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);

        // Crear usuario
        await User.create({
            name: parsed.data.name,
            email: parsed.data.email.toLowerCase(),
            password: hashedPassword,
            role: parsed.data.role,
            phone: parsed.data.phone,
        });

        return { success: true };
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: 'Error interno del servidor' };
    }
}

/**
 * Iniciar sesión con email y contraseña.
 * Delega a Auth.js CredentialsProvider.
 *
 * @param formData - Datos del formulario de login
 * @returns Resultado con éxito o error
 */
export async function loginUser(formData: FormData): Promise<ActionResult> {
    const rawData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0].message,
        };
    }

    try {
        await signIn('credentials', {
            email: parsed.data.email,
            password: parsed.data.password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        // Auth.js lanza CredentialsSignin para credenciales inválidas
        if (
            error instanceof Error &&
            error.message.includes('CredentialsSignin')
        ) {
            return { success: false, error: 'Email o contraseña incorrectos' };
        }
        // Re-lanzar si es un redirect (comportamiento esperado de Auth.js)
        throw error;
    }
}
