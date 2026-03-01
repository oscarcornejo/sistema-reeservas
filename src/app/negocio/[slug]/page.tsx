/**
 * @fileoverview Perfil público de negocio.
 * Server Component con datos cacheados (PPR), SEO metadata dinámico,
 * y fetching paralelo sin waterfalls.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    Phone,
    Mail,
    Globe,
    Clock,
} from 'lucide-react';
import BookingWrapper from '@/components/booking/BookingWrapper';
import {
    getCachedPublicBusiness,
    getCachedPublicServices,
    getCachedPublicProfessionals,
} from '@/lib/data/queries';
import { auth } from '@/lib/auth/auth';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { DAYS_OF_WEEK } from '@/lib/utils/format';
import type { IBusiness, IService, IProfessional, UserRole } from '@/types';

// =============================================================================
// Tipos
// =============================================================================

type Props = {
    params: Promise<{ slug: string }>;
};

/** Mapa de iconos por categoría de negocio */
const CATEGORY_EMOJI: Record<string, string> = {
    'Barbería': '💈',
    'Spa': '🧖',
    'Centro de Estética': '✨',
    'Consultorio Dental': '🦷',
    'Consultorio Médico': '🩺',
    'Salón de Belleza': '💇',
    'Clínica de Fisioterapia': '🦴',
    'Centro de Masajes': '💆',
    'Peluquería': '✂️',
    'Uñas y Manicure': '💅',
};

/** Gradientes por categoría */
const CATEGORY_GRADIENT: Record<string, string> = {
    'Barbería': 'from-amber-500/10 via-orange-500/5 to-transparent',
    'Spa': 'from-emerald-500/10 via-teal-500/5 to-transparent',
    'Centro de Estética': 'from-violet-500/10 via-purple-500/5 to-transparent',
    'Consultorio Dental': 'from-blue-500/10 via-indigo-500/5 to-transparent',
    'Consultorio Médico': 'from-cyan-500/10 via-blue-500/5 to-transparent',
    'Salón de Belleza': 'from-pink-500/10 via-rose-500/5 to-transparent',
    'Clínica de Fisioterapia': 'from-teal-500/10 via-emerald-500/5 to-transparent',
    'Centro de Masajes': 'from-indigo-500/10 via-violet-500/5 to-transparent',
    'Peluquería': 'from-rose-500/10 via-pink-500/5 to-transparent',
    'Uñas y Manicure': 'from-fuchsia-500/10 via-pink-500/5 to-transparent',
};

// =============================================================================
// SEO Metadata
// =============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const business = await getCachedPublicBusiness(slug) as IBusiness | null;

    if (!business) {
        return { title: 'Negocio no encontrado' };
    }

    const description =
        business.description ||
        `Reserva tu cita en ${business.name}. ${business.category} en ${business.city}, ${business.country === 'CL' ? 'Chile' : 'México'}.`;

    return {
        title: business.name,
        description,
        openGraph: {
            title: business.name,
            description,
            type: 'website',
            locale: business.country === 'CL' ? 'es_CL' : 'es_MX',
            ...(business.coverImage && { images: [{ url: business.coverImage }] }),
        },
    };
}

// =============================================================================
// Página principal — PPR: shell estático + contenido dinámico en Suspense
// =============================================================================

/** Navbar con verificación de sesión */
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
        <PublicNavbar user={user}>
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

export default function NegocioPage({ params }: Props) {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<NavbarSkeleton />}>
                <AuthNavbar />
            </Suspense>

            <Suspense fallback={<PageSkeleton />}>
                <NegocioContent params={params} />
            </Suspense>

            <PublicFooter />
        </div>
    );
}

/** Skeleton del navbar mientras se resuelve la sesión */
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

/** Contenido dinámico que depende de params y datos cacheados */
async function NegocioContent({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetching paralelo — sin waterfalls (async-parallel)
    const [business, services, professionals] = await Promise.all([
        getCachedPublicBusiness(slug) as Promise<IBusiness | null>,
        getCachedPublicServices(slug) as Promise<IService[]>,
        getCachedPublicProfessionals(slug) as Promise<IProfessional[]>,
    ]);

    if (!business) notFound();

    const categoryEmoji = CATEGORY_EMOJI[business.category] || '🏢';
    const categoryGradient = CATEGORY_GRADIENT[business.category] || 'from-primary/10 via-primary/5 to-transparent';
    const businessId = String(business._id);

    return (
        <main>
            {/* Secciones interactivas con booking — client component */}
            <BookingWrapper
                businessId={businessId}
                business={business}
                services={services}
                professionals={professionals}
                currency={business.currency}
                categoryEmoji={categoryEmoji}
                categoryGradient={categoryGradient}
            />

            {/* Secciones estáticas — server components */}
            <InfoSection business={business} />
        </main>
    );
}

/** Skeleton de carga mientras se resuelven los datos */
function PageSkeleton() {
    return (
        <main className="animate-pulse">
            {/* Hero skeleton */}
            <section className="py-12 lg:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="h-4 w-32 bg-muted rounded-lg mb-8" />
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="h-7 w-28 bg-muted rounded-full" />
                            <div className="h-12 w-80 bg-muted rounded-lg" />
                            <div className="h-4 w-52 bg-muted rounded-lg" />
                            <div className="h-20 w-full max-w-lg bg-muted rounded-lg" />
                            <div className="flex gap-3">
                                <div className="h-12 w-52 bg-muted rounded-lg" />
                                <div className="h-12 w-32 bg-muted rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-3 lg:w-[280px]">
                            <div className="h-56 bg-muted rounded-2xl" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Services skeleton */}
            <section className="py-16 bg-muted/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="h-8 w-56 bg-muted rounded-lg mb-3" />
                    <div className="h-4 w-72 bg-muted rounded-lg mb-10" />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-muted rounded-2xl" />
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}


// =============================================================================
// Horarios y Contacto
// =============================================================================

function InfoSection({ business }: { business: IBusiness }) {
    const sortedHours = [...(business.workingHours || [])].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek
    );
    const today = new Date().getDay();

    return (
        <section
            id="info"
            className="relative py-16 lg:py-20 overflow-hidden"
        >
            <div className="absolute inset-0 -z-10 bg-muted/20" />
            <div className="absolute -top-12 left-1/3 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:gap-10 lg:grid-cols-2">
                    {/* Horarios */}
                    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/8 dark:bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 mb-3">
                            <Clock className="h-3 w-3" />
                            Horarios
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                            Horarios de atención
                        </h2>
                        <Card className="relative border-border/50 overflow-hidden">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border/50">
                                    {sortedHours.map((hour) => {
                                        const isToday = hour.dayOfWeek === today;
                                        return (
                                            <li
                                                key={hour.dayOfWeek}
                                                className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                                                    isToday ? 'bg-primary/3' : ''
                                                }`}
                                            >
                                                <span className={`text-sm ${
                                                    isToday ? 'font-bold text-primary' : 'font-medium'
                                                }`}>
                                                    {DAYS_OF_WEEK[hour.dayOfWeek]}
                                                    {isToday && (
                                                        <Badge className="ml-2 text-[10px] border-0 bg-primary/10 text-primary py-0">
                                                            Hoy
                                                        </Badge>
                                                    )}
                                                </span>
                                                {hour.isOpen ? (
                                                    <span className={`text-sm tabular-nums ${
                                                        isToday ? 'font-semibold' : ''
                                                    }`}>
                                                        {hour.openTime} – {hour.closeTime}
                                                    </span>
                                                ) : (
                                                    <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">
                                                        Cerrado
                                                    </Badge>
                                                )}
                                            </li>
                                        );
                                    })}
                                    {sortedHours.length === 0 && (
                                        <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                                            Horarios no disponibles
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contacto */}
                    <div style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary mb-3">
                            <Phone className="h-3 w-3" />
                            Contacto
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
                            Contacto
                        </h2>
                        <Card className="relative border-border/50 overflow-hidden">
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
                            <CardContent className="p-6 space-y-5">
                                <ContactRow
                                    icon={<MapPin className="h-5 w-5 text-primary" />}
                                    iconBg="bg-primary/10"
                                    label="Dirección"
                                    value={`${business.address}, ${business.city}, ${business.state}`}
                                />

                                <Separator className="bg-border/50" />

                                <ContactRow
                                    icon={<Phone className="h-5 w-5 text-blue-500 dark:text-blue-400" />}
                                    iconBg="bg-blue-500/10 dark:bg-blue-500/20"
                                    label="Teléfono"
                                    value={business.phone}
                                    href={`tel:${business.phone}`}
                                />

                                <Separator className="bg-border/50" />

                                <ContactRow
                                    icon={<Mail className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />}
                                    iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
                                    label="Email"
                                    value={business.email}
                                    href={`mailto:${business.email}`}
                                />

                                {business.website && (
                                    <>
                                        <Separator className="bg-border/50" />
                                        <ContactRow
                                            icon={<Globe className="h-5 w-5 text-amber-500 dark:text-amber-400" />}
                                            iconBg="bg-amber-500/10 dark:bg-amber-500/20"
                                            label="Sitio web"
                                            value={business.website.replace(/^https?:\/\//, '')}
                                            href={business.website}
                                            external
                                        />
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Fila de información de contacto reutilizable */
function ContactRow({
    icon,
    iconBg,
    label,
    value,
    href,
    external,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
}) {
    const content = (
        <div className="flex items-start gap-4 group/contact">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-colors`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium truncate mt-0.5 group-hover/contact:text-primary transition-colors">{value}</p>
            </div>
        </div>
    );

    if (href) {
        return (
            <a
                href={href}
                className="block"
                {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
            >
                {content}
            </a>
        );
    }

    return content;
}


// =============================================================================
// Footer
// =============================================================================

function PublicFooter() {
    return (
        <footer className="border-t border-border/50 py-8 bg-muted/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow">
                            T
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            TurnoPro
                        </span>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                        Gestión de citas profesional
                    </p>
                </div>
            </div>
        </footer>
    );
}
