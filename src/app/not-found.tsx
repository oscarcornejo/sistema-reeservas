/**
 * @fileoverview Página 404 personalizada con diseño premium.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative text-center space-y-6 max-w-md">
                {/* Decoración sutil */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative">
                    <div className="text-[120px] sm:text-[160px] font-bold leading-none bg-gradient-to-b from-primary/20 to-primary/5 bg-clip-text text-transparent select-none">
                        404
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold -mt-4">
                        Página no encontrada
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        La página que buscas no existe o fue movida.
                    </p>
                </div>

                <Button variant="outline" className="border-border/60" asChild>
                    <Link href="/">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al inicio
                    </Link>
                </Button>
            </div>
        </div>
    );
}
