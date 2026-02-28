'use client';

/**
 * @fileoverview Error boundary global — captura errores en el root layout.
 * Debe incluir <html> y <body> ya que reemplaza todo el documento.
 * No puede importar shadcn/ui ya que los estilos podrían no estar disponibles.
 */

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body
                style={{
                    display: 'flex',
                    minHeight: '100vh',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#fafafa',
                    color: '#18181b',
                }}
            >
                <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
                    <div
                        style={{
                            width: '4rem',
                            height: '4rem',
                            margin: '0 auto 1.5rem',
                            borderRadius: '1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'rgb(239, 68, 68)',
                        }}
                    >
                        !
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Error inesperado
                    </h2>
                    <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Ocurrió un error al cargar la aplicación.
                    </p>
                    {error.digest && (
                        <p style={{ color: '#a1a1aa', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1rem' }}>
                            Código: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.625rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #e4e4e7',
                            backgroundColor: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </body>
        </html>
    );
}
