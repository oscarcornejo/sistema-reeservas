'use client';

/**
 * @fileoverview Componente cliente para mostrar el año actual.
 * Necesario porque new Date() no es determinístico en Server Components con PPR.
 */

export function CopyrightYear() {
  return <>{new Date().getFullYear()}</>;
}
