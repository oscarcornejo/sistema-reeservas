/**
 * @fileoverview Layout para páginas de autenticación (login, registro).
 * Diseño a dos columnas con panel de branding refinado y formulario.
 */

import { Suspense } from 'react';
import { CopyrightYear } from '@/components/ui/copyright-year';
import { Calendar, CheckCircle2, Shield, Zap } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            {/* ── Panel izquierdo — Branding ── */}
            <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent p-12 text-white">
                {/* Decoración de fondo */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/3 blur-3xl" />
                    {/* Patrón de puntos sutil */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                </div>

                {/* Logo */}
                <div className="relative flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm font-bold text-xl shadow-lg shadow-black/10">
                        T
                    </div>
                    <span className="text-2xl font-bold tracking-tight">TurnoPro</span>
                </div>

                {/* Contenido principal */}
                <div className="relative space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
                            Gestiona tu negocio
                            <br />
                            <span className="text-white/80">como un profesional</span>
                        </h2>
                        <p className="text-white/60 text-lg max-w-md leading-relaxed">
                            Citas, clientes, pagos y reportes en una sola plataforma.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        {[
                            { icon: Calendar, text: 'Agenda inteligente con reservas online' },
                            { icon: Zap, text: 'Recordatorios automáticos para reducir inasistencias' },
                            { icon: Shield, text: 'Reportes detallados de facturación y ocupación' },
                            { icon: CheckCircle2, text: 'Gestión completa de clientes y profesionales' },
                        ].map((feature) => (
                            <div key={feature.text} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                                    <feature.icon className="h-4 w-4 text-white/80" />
                                </div>
                                <span className="text-sm text-white/70">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 pt-2">
                        {[
                            { value: '40%', label: 'Menos inasistencias' },
                            { value: '3x', label: 'Más reservas online' },
                            { value: '2h', label: 'Ahorro diario' },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                                <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="relative text-sm text-white/30">
                    © <Suspense fallback="2026"><CopyrightYear /></Suspense> TurnoPro — Gestión de citas profesional
                </p>
            </div>

            {/* ── Panel derecho — Formulario ── */}
            <div className="relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">
                {/* Decoración sutil del panel derecho */}
                <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-accent/5 blur-3xl" />

                <div className="relative w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
