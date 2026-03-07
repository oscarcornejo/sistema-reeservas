'use client';

import { useEffect } from 'react';

/**
 * Inyecta CSS custom properties en el elemento padre más cercano con
 * clase `negocio-page`. Se ejecuta tras la hidratación del cliente,
 * garantizando que los colores del tema se apliquen incluso si el
 * streaming de Suspense tiene problemas.
 */
export default function ThemeInjector({ vars }: { vars: Record<string, string> }) {
    useEffect(() => {
        const el = document.querySelector('.negocio-page') as HTMLElement | null;
        if (!el) return;

        for (const [key, val] of Object.entries(vars)) {
            el.style.setProperty(key, val);
        }

        return () => {
            for (const key of Object.keys(vars)) {
                el.style.removeProperty(key);
            }
        };
    }, [vars]);

    return null;
}
