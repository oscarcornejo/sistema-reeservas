/**
 * @fileoverview Landing page pública de TurnoPro.
 * Server Component con Suspense para autenticación (PPR).
 * Diseño coherente con /negocio/ y /buscar/ — gradientes, animaciones, acentos.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    CalendarCheck,
    CheckCircle2,
    CalendarDays,
    Users,
    TrendingUp,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { auth } from '@/lib/auth/auth';
import PublicNavbar from '@/components/layout/PublicNavbar';
import type { UserRole } from '@/types';

// =============================================================================
// Navbar con sesión (async, envuelto en Suspense)
// =============================================================================

async function AuthNavbar() {
    const session = await auth();
    const user = session?.user
        ? {
              name: session.user.name || 'Usuario',
              email: session.user.email || '',
              role: session.user.role as UserRole,
              image: session.user.image,
          }
        : null;

    return (
        <PublicNavbar user={user} showRegister>
            <div className="hidden md:flex items-center">
                <Link
                    href="/buscar"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    Buscar negocios
                </Link>
            </div>
        </PublicNavbar>
    );
}

function NavbarSkeleton() {
    return (
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                        T
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        TurnoPro
                    </span>
                </div>
            </div>
        </nav>
    );
}

// =============================================================================
// Datos estáticos
// =============================================================================

const STEPS = [
    {
        num: '1',
        icon: Search,
        title: 'Busca',
        description: 'Encuentra negocios y profesionales cerca de ti por categoría o ubicación.',
    },
    {
        num: '2',
        icon: CalendarDays,
        title: 'Elige horario',
        description: 'Selecciona el servicio, profesional y horario que mejor te acomode.',
    },
    {
        num: '3',
        icon: CheckCircle2,
        title: 'Confirma',
        description: 'Reserva en segundos y recibe la confirmación en tu correo.',
    },
];

const CATEGORIES = [
    { emoji: '💈', label: 'Barbería' },
    { emoji: '🧖', label: 'Spa' },
    { emoji: '🦷', label: 'Consultorio Dental' },
    { emoji: '✂️', label: 'Peluquería' },
    { emoji: '💅', label: 'Centro de Estética' },
    { emoji: '🏥', label: 'Clínica' },
    { emoji: '💆', label: 'Centro de Masajes' },
    { emoji: '💇', label: 'Salón de Belleza' },
];

const BENEFITS = [
    {
        icon: CalendarCheck,
        title: 'Gestiona tu agenda',
        description: 'Organiza citas, horarios y profesionales desde un solo lugar. Sin hojas de cálculo.',
        gradient: 'from-primary to-primary/40',
    },
    {
        icon: Users,
        title: 'Clientes satisfechos',
        description: 'Tus clientes reservan en línea 24/7 y reciben recordatorios automáticos.',
        gradient: 'from-accent to-accent/40',
    },
    {
        icon: TrendingUp,
        title: 'Crece tu negocio',
        description: 'Reportes, métricas y visibilidad en nuestra plataforma para atraer más clientes.',
        gradient: 'from-emerald-500 to-emerald-500/40',
    },
];

// =============================================================================
// Página principal
// =============================================================================

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<NavbarSkeleton />}>
                <AuthNavbar />
            </Suspense>

            <HeroSection />
            <HowItWorksSection />
            <CategoriesSection />
            <BenefitsSection />
            <BookingCtaSection />
            <CtaSection />
            <PublicFooter />
        </div>
    );
}

// =============================================================================
// Hero
// =============================================================================

function HeroSection() {
    return (
        <section className="relative overflow-hidden border-b border-border/40">
            {/* Blobs decorativos */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/4 blur-3xl" />
            {/* Dot grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
                <div className="max-w-3xl mx-auto text-center">
                    <div
                        className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-6"
                        style={{ animation: 'fadeIn 0.4s ease-out' }}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Plataforma de reservas para negocios de servicio
                    </div>

                    <h1
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance mb-5"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                    >
                        Agenda tus citas de forma{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            simple y rápida
                        </span>
                    </h1>

                    <p
                        className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-8"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                    >
                        Encuentra barberías, spas, clínicas y más. Reserva en segundos, sin llamadas ni esperas.
                    </p>

                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
                    >
                        <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity h-12 px-8 text-base" asChild>
                            <Link href="/buscar">
                                <Search className="h-4.5 w-4.5 mr-2" />
                                Explorar negocios
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-border/60 h-12 px-8 text-base" asChild>
                            <Link href="/registro">
                                Registrar mi negocio
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Cómo funciona
// =============================================================================

function HowItWorksSection() {
    return (
        <section className="py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 lg:mb-16">
                    <div
                        className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-4"
                        style={{ animation: 'fadeIn 0.4s ease-out' }}
                    >
                        Cómo funciona
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-3"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                    >
                        Reserva en{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            3 simples pasos
                        </span>
                    </h2>
                    <p
                        className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                    >
                        Sin complicaciones. Encuentra, elige y confirma tu cita.
                    </p>
                </div>

                <div className="grid gap-8 sm:grid-cols-3">
                    {STEPS.map((step, i) => (
                        <div
                            key={step.num}
                            className="relative text-center group"
                            style={{ animation: `fadeIn 0.4s ease-out ${0.15 + i * 0.05}s both` }}
                        >
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 mb-5 group-hover:bg-primary/12 transition-colors">
                                <step.icon className="h-7 w-7 text-primary" />
                            </div>
                            <Badge className="text-[10px] border-0 bg-primary/10 text-primary mb-3">
                                Paso {step.num}
                            </Badge>
                            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Categorías
// =============================================================================

function CategoriesSection() {
    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-muted/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 lg:mb-16">
                    <div
                        className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-4"
                        style={{ animation: 'fadeIn 0.4s ease-out' }}
                    >
                        Categorías
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-3"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                    >
                        Explora por{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            tipo de negocio
                        </span>
                    </h2>
                    <p
                        className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                    >
                        Desde barberías hasta clínicas, encuentra el servicio que necesitas.
                    </p>
                </div>

                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                    {CATEGORIES.map((cat, i) => (
                        <Link
                            key={cat.label}
                            href="/buscar"
                            className="group"
                            style={{ animation: `fadeIn 0.4s ease-out ${0.15 + i * 0.03}s both` }}
                        >
                            <Card className="relative overflow-hidden border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1">
                                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="flex flex-col items-center py-8 px-4">
                                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                        {cat.emoji}
                                    </span>
                                    <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                                        {cat.label}
                                    </span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Beneficios para negocios
// =============================================================================

function BenefitsSection() {
    return (
        <section className="py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 lg:mb-16">
                    <div
                        className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-4"
                        style={{ animation: 'fadeIn 0.4s ease-out' }}
                    >
                        Para negocios
                    </div>
                    <h2
                        className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-3"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
                    >
                        Todo lo que necesitas para{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            gestionar tu negocio
                        </span>
                    </h2>
                    <p
                        className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                    >
                        Automatiza tus reservas y enfócate en lo que mejor haces.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                    {BENEFITS.map((benefit, i) => (
                        <Card
                            key={benefit.title}
                            className="group relative overflow-hidden border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1"
                            style={{ animation: `fadeIn 0.4s ease-out ${0.15 + i * 0.05}s both` }}
                        >
                            <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${benefit.gradient}`} />
                            <CardContent className="p-6 sm:p-8">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 mb-5 group-hover:bg-primary/12 transition-colors">
                                    <benefit.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                                    {benefit.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {benefit.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// CTA — Reserva tu cita
// =============================================================================

function BookingCtaSection() {
    return (
        <section className="border-t border-border/50 py-12 lg:py-16">
            <div className="mx-auto max-w-2xl px-4 text-center">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
                    ¿Listo para tu próxima cita?
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Encuentra el profesional ideal y reserva en segundos, sin llamadas ni esperas.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                        size="lg"
                        className="h-11 px-8 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                        asChild
                    >
                        <Link href="/buscar">
                            <Search className="mr-2 h-4 w-4" />
                            Explorar negocios
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// CTA — Registro de negocios
// =============================================================================

function CtaSection() {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-accent/8" />
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
                <div
                    className="max-w-2xl mx-auto text-center"
                    style={{ animation: 'fadeIn 0.4s ease-out' }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance mb-4">
                        Empieza hoy con{' '}
                        <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TurnoPro
                        </span>
                    </h2>
                    <p className="text-muted-foreground text-base sm:text-lg mb-8">
                        Únete a los negocios que ya gestionan sus citas de forma profesional.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity h-12 px-8 text-base" asChild>
                            <Link href="/buscar">
                                <Search className="h-4.5 w-4.5 mr-2" />
                                Explorar negocios
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="border-border/60 bg-background/60 backdrop-blur-sm h-12 px-8 text-base" asChild>
                            <Link href="/registro">
                                Registrar mi negocio
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Footer
// =============================================================================

function PublicFooter() {
    return (
        <footer className="border-t border-border/40 py-10 bg-muted/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow">
                            T
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TurnoPro
                        </span>
                    </Link>
                    <p className="text-xs text-muted-foreground/60">
                        Gestión de citas profesional para Latinoamérica
                    </p>
                </div>
            </div>
        </footer>
    );
}
