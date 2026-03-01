'use client';

/**
 * @fileoverview Error boundary de la app con diseño refinado.
 */

import { Button } from '@/components/ui/button';
import { RotateCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="relative text-center space-y-5 max-w-md">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-destructive/6 blur-3xl" />

                <div className="relative">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
                        <span className="text-2xl font-bold">!</span>
                    </div>
                    <h2 className="text-xl font-bold text-balance">Algo salió mal</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Ocurrió un error inesperado. Por favor, intenta nuevamente.
                    </p>
                    {error.digest && (
                        <p className="text-[11px] text-muted-foreground/50 font-mono mt-2">
                            Código: {error.digest}
                        </p>
                    )}
                </div>

                <Button onClick={reset} variant="outline" className="border-border/60">
                    <RotateCw className="h-4 w-4 mr-2" />
                    Reintentar
                </Button>
            </div>
        </div>
    );
}
