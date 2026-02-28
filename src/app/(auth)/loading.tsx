/**
 * @fileoverview Loading skeleton para páginas de autenticación.
 * Coincide con la estructura visual del formulario.
 */

export default function AuthLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Logo mobile */}
            <div className="flex items-center gap-2.5 lg:hidden mb-2">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="h-5 w-24 rounded-lg bg-muted" />
            </div>

            {/* Header */}
            <div className="space-y-2.5">
                <div className="h-8 w-52 bg-muted rounded-lg" />
                <div className="h-4 w-72 bg-muted rounded-lg" />
            </div>

            {/* Campos */}
            <div className="space-y-4 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-16 bg-muted rounded-md" />
                        <div className="h-11 w-full bg-muted rounded-lg" />
                    </div>
                ))}
                <div className="h-11 w-full bg-muted rounded-lg" />
            </div>

            {/* Separador */}
            <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-muted" />
                <div className="h-3 w-28 bg-muted rounded-md" />
                <div className="h-px flex-1 bg-muted" />
            </div>

            {/* Botón secundario */}
            <div className="h-11 w-full bg-muted rounded-lg" />
        </div>
    );
}
