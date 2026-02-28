'use client';

/**
 * @fileoverview Error boundary del dashboard con diseño refinado.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCw } from 'lucide-react';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card className="max-w-md w-full border-border/50">
                <CardContent className="p-8 text-center space-y-5">
                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                        <span className="text-2xl font-bold">!</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Error en el dashboard</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            No se pudo cargar esta sección. Verifica tu conexión e intenta nuevamente.
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
                </CardContent>
            </Card>
        </div>
    );
}
