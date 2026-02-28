/**
 * @fileoverview Singleton de conexión a MongoDB usando Mongoose.
 * Reutiliza la conexión en desarrollo (hot-reload) y en producción.
 *
 * Patrón: Cachear la promesa de conexión en `globalThis` para evitar
 * múltiples conexiones durante hot-reload en desarrollo.
 */

import mongoose from 'mongoose';

/** URI de conexión desde variables de entorno */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Por favor define la variable MONGODB_URI en .env.local'
    );
}

/**
 * Cache global para la conexión de Mongoose.
 * Necesario para mantener una sola conexión durante hot-reload en dev.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Extender globalThis para cachear la conexión
declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
    conn: null,
    promise: null,
};

globalThis.mongooseCache = cached;

/**
 * Conectar a MongoDB. Reutiliza la conexión existente si hay una.
 *
 * @returns Instancia de mongoose conectada
 * @throws Error si falla la conexión después de reintentos
 */
export async function connectDB(): Promise<typeof mongoose> {
    // Retornar conexión cacheada si existe
    if (cached.conn) {
        return cached.conn;
    }

    // Crear nueva promesa de conexión si no hay una pendiente
    if (!cached.promise) {
        const opts: mongoose.ConnectOptions = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose
            .connect(MONGODB_URI!, opts)
            .then((mongooseInstance) => {
                console.log('✅ Conectado a MongoDB');
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error('❌ Error conectando a MongoDB:', error);
        throw error;
    }

    return cached.conn;
}
