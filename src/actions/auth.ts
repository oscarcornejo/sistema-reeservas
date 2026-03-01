/**
 * @fileoverview Server Actions de autenticación.
 * Registro e inicio de sesión con validación Zod.
 */

"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/user";
import { signIn } from "@/lib/auth/auth";
import { loginSchema, registerSchema } from "@/lib/validators/schemas";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
} from "@/lib/security/rate-limiter";
import { authLogger } from "@/lib/logger";
import { auditLog } from "@/lib/logger/audit";
import type { ActionResult, UserRole } from "@/types";

/** Mapa de redirección por rol después del login */
const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: "/admin",
  professional: "/profesional",
  client: "/cliente",
};

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
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: formData.get("role") as string,
    phone: formData.get("phone") as string | undefined,
  };

  // Validación con Zod
  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  // Rate limit por IP
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const rateCheck = checkRateLimit(`register-ip:${ip}`, RATE_LIMITS.register);
  if (!rateCheck.allowed) {
    auditLog("rate_limit.exceeded", {
      ip,
      metadata: { key: `register-ip:${ip}` },
    });
    return {
      success: false,
      error: "Demasiados intentos de registro. Intenta de nuevo más tarde",
    };
  }

  try {
    await connectDB();

    // Verificar si el email ya existe
    const existingUser = await User.findOne({
      email: parsed.data.email.toLowerCase(),
    });
    if (existingUser) {
      auditLog("register.failure", {
        email: parsed.data.email,
        ip,
        reason: "Email duplicado",
      });
      return { success: false, error: "Este email ya está registrado" };
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

    auditLog("register.success", { email: parsed.data.email, ip });
    return { success: true };
  } catch (error) {
    authLogger.error("Error en registro", error);
    return { success: false, error: "Error interno del servidor" };
  }
}

/**
 * Iniciar sesión con email y contraseña.
 * Delega a Auth.js CredentialsProvider.
 *
 * @param formData - Datos del formulario de login
 * @returns Resultado con éxito o error
 */
export async function loginUser(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  // Rate limit por IP
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const rateCheck = checkRateLimit(`login-ip:${ip}`, RATE_LIMITS.authByIp);
  if (!rateCheck.allowed) {
    auditLog("rate_limit.exceeded", {
      ip,
      email: parsed.data.email,
      metadata: { key: `login-ip:${ip}` },
    });
    return {
      success: false,
      error:
        "Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    // Obtener rol del usuario para redirigir al dashboard correcto
    // No usamos auth() aquí porque las cookies recién seteadas por signIn
    // no son legibles en el mismo request en Next.js 16
    await connectDB();
    const dbUser = await User.findOne({
      email: parsed.data.email.toLowerCase(),
    })
      .select("role")
      .lean();
    const role = (dbUser?.role ?? "client") as UserRole;

    return { success: true, data: { redirectTo: ROLE_REDIRECT[role] } };
  } catch (error) {
    // Auth.js v5 lanza AuthError subclasses — detectar por type/name, no por message
    const isAuthError = error instanceof Error && "type" in error;
    const errorType = isAuthError
      ? (error as Error & { type: string }).type
      : "";

    if (
      errorType === "CredentialsSignin" ||
      errorType === "CallbackRouteError"
    ) {
      auditLog("login.failure", {
        email: parsed.data.email,
        ip,
        reason: errorType,
      });
      return { success: false, error: "Email o contraseña incorrectos" };
    }
    // Re-lanzar si es un redirect (comportamiento esperado de Auth.js)
    throw error;
  }
}
