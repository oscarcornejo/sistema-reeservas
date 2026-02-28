'use client';

/**
 * @fileoverview Componente cliente para mostrar saludo según hora del día.
 * Necesario porque new Date() no es determinístico en Server Components con PPR.
 */

export function Greeting() {
    const hour = new Date().getHours();
    let greeting = 'Buenas noches';
    if (hour < 12) greeting = 'Buenos días';
    else if (hour < 19) greeting = 'Buenas tardes';
    return <>{greeting}</>;
}
