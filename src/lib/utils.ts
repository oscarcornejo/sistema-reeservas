/**
 * @fileoverview Utilidades compartidas de shadcn/ui.
 * Función `cn` para merge de clases con tailwind-merge y clsx.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases CSS con soporte para condiciones y resolución de conflictos Tailwind.
 * @param inputs - Clases a combinar (strings, arrays, objetos condicionales)
 * @returns String de clases CSS combinadas sin conflictos
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Serializa datos de Mongoose a objetos planos compatibles con RSC.
 * Convierte ObjectId → string, Date → ISO string, elimina metodos toJSON.
 * Necesario porque .lean() no es suficiente para la serializacion de Next.js 16.
 */
export function serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
}
