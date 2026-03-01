/**
 * @fileoverview Wrapper client para la reserva online en la página pública.
 * Renderiza las secciones interactivas (Hero, Servicios, Equipo, CTA)
 * y gestiona el estado del diálogo de reserva.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    Phone,
    Globe,
    Clock,
    ArrowLeft,
    Star,
    Users,
    Calendar,
    ChevronRight,
    Sparkles,
    Shield,
    CalendarPlus,
} from 'lucide-react';
import BookingDialog from './BookingDialog';
import { formatCurrency } from '@/lib/utils/format';
import type { IBusiness, IService, IProfessional, WorkingHour, SupportedCurrency } from '@/types';

// =============================================================================
// Tipos
// =============================================================================

interface BookingWrapperProps {
    businessId: string;
    business: IBusiness;
    services: IService[];
    professionals: IProfessional[];
    currency: SupportedCurrency;
    categoryEmoji: string;
    categoryGradient: string;
}

// =============================================================================
// Wrapper principal
// =============================================================================

export default function BookingWrapper({
    businessId,
    business,
    services,
    professionals,
    currency,
    categoryEmoji,
    categoryGradient,
}: BookingWrapperProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();

    const openBooking = (serviceId?: string) => {
        setPreselectedServiceId(serviceId);
        setDialogOpen(true);
    };

    return (
        <>
            <HeroSection
                business={business}
                emoji={categoryEmoji}
                gradient={categoryGradient}
                serviceCount={services.length}
                professionalCount={professionals.length}
                onBooking={() => openBooking()}
            />

            {services.length > 0 && (
                <ServicesSection
                    services={services}
                    currency={currency}
                    onBookService={(serviceId) => openBooking(serviceId)}
                />
            )}

            {professionals.length > 0 && (
                <TeamSection professionals={professionals} />
            )}

            <CTASection
                businessName={business.name}
                phone={business.phone}
                onBooking={() => openBooking()}
            />

            <BookingDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                businessId={businessId}
                services={services}
                professionals={professionals}
                currency={currency}
                preselectedServiceId={preselectedServiceId}
            />

        </>
    );
}

// =============================================================================
// Hero
// =============================================================================

function HeroSection({
    business,
    emoji,
    gradient,
    serviceCount,
    professionalCount,
    onBooking,
}: {
    business: IBusiness;
    emoji: string;
    gradient: string;
    serviceCount: number;
    professionalCount: number;
    onBooking: () => void;
}) {
    return (
        <section className="relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute bottom-10 right-1/6 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                <Link
                    href="/buscar"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                    style={{ animation: 'fadeIn 0.4s ease-out' }}
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    Volver a búsqueda
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-12">
                    <div className="flex-1 max-w-2xl" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-4xl" role="img" aria-label={business.category}>
                                {emoji}
                            </span>
                            <Badge className="text-xs px-3 py-1 border-0 bg-primary/10 text-primary font-medium">
                                {business.category}
                            </Badge>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                            {business.name}
                        </h1>

                        <p className="flex items-center gap-2 text-muted-foreground mb-5">
                            <MapPin className="h-4 w-4 shrink-0 text-primary/60" />
                            {business.address}, {business.city}
                        </p>

                        {business.description && (
                            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                                {business.description}
                            </p>
                        )}

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 h-12 px-6"
                                onClick={onBooking}
                            >
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Reservar online
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 px-6 border-border/60" asChild>
                                <a href={`tel:${business.phone}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Llamar
                                </a>
                            </Button>
                            {business.website && (
                                <Button size="lg" variant="outline" className="h-12 px-6 border-border/60" asChild>
                                    <a href={business.website} target="_blank" rel="noopener noreferrer">
                                        <Globe className="mr-2 h-4 w-4" />
                                        Sitio web
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stats rápidas */}
                    <Card
                        className="relative lg:min-w-[280px] border-border/50 shadow-xl shadow-primary/5 overflow-hidden"
                        style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
                    >
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/60" />
                        <CardContent className="p-6 space-y-5">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tracking-tight">{serviceCount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {serviceCount === 1 ? 'Servicio disponible' : 'Servicios disponibles'}
                                    </p>
                                </div>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
                                    <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold tracking-tight">{professionalCount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {professionalCount === 1 ? 'Profesional' : 'Profesionales'}
                                    </p>
                                </div>
                            </div>
                            <Separator className="bg-border/50" />
                            <TodayHours hours={business.workingHours} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

/** Muestra el horario del día actual en el card de stats */
function TodayHours({ hours }: { hours: WorkingHour[] }) {
    const today = new Date().getDay();
    const todayHour = hours?.find((h) => h.dayOfWeek === today);

    return (
        <div className="flex items-center gap-3.5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                todayHour?.isOpen ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-muted'
            }`}>
                <Clock className={`h-5 w-5 ${todayHour?.isOpen ? 'text-emerald-500 dark:text-emerald-400' : 'text-muted-foreground'}`} />
            </div>
            <div>
                {todayHour?.isOpen ? (
                    <>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold tabular-nums">
                                {todayHour.openTime} – {todayHour.closeTime}
                            </p>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Abierto hoy</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium text-muted-foreground">Cerrado hoy</p>
                        <p className="text-xs text-muted-foreground/60">Horario de hoy</p>
                    </>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// Servicios
// =============================================================================

function ServicesSection({
    services,
    currency,
    onBookService,
}: {
    services: IService[];
    currency: SupportedCurrency;
    onBookService: (serviceId: string) => void;
}) {
    return (
        <section id="servicios" className="relative py-16 lg:py-20 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-muted/20" />
            <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/8 dark:bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-3">
                        <Sparkles className="h-3 w-3" />
                        Catálogo de servicios
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Nuestros Servicios
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Elige el servicio que necesitas y reserva tu cita
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service, i) => (
                        <Card
                            key={String(service._id)}
                            role="button"
                            tabIndex={0}
                            className="group relative border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-[box-shadow,border-color] duration-300 overflow-hidden cursor-pointer"
                            style={{ animation: `fadeIn 0.4s ease-out ${0.05 + i * 0.05}s both` }}
                            onClick={() => onBookService(String(service._id))}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onBookService(String(service._id)); } }}
                        >
                            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-3 gap-3">
                                    <h3 className="font-semibold text-lg leading-snug group-hover:text-primary transition-colors">
                                        {service.name}
                                    </h3>
                                    <span className="text-xl font-bold text-primary whitespace-nowrap tabular-nums shrink-0">
                                        {formatCurrency(service.price, service.currency || currency)}
                                    </span>
                                </div>

                                {service.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {service.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/8 dark:bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                                        <Clock className="h-3 w-3" />
                                        {service.duration} min
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors font-medium">
                                        Reservar
                                        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// Equipo
// =============================================================================

function TeamSection({ professionals }: { professionals: IProfessional[] }) {
    return (
        <section id="equipo" className="relative py-16 lg:py-20 overflow-hidden">
            <div className="absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-10" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/8 dark:bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 mb-3">
                        <Shield className="h-3 w-3" />
                        Equipo profesional
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Nuestro Equipo
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Profesionales calificados listos para atenderte
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {professionals.map((pro, i) => {
                        const initials = pro.displayName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();

                        return (
                            <Card
                                key={String(pro._id)}
                                className="group relative border-border/50 hover:shadow-xl hover:shadow-blue-500/5 transition-[box-shadow,border-color] duration-300 overflow-hidden"
                                style={{ animation: `fadeIn 0.4s ease-out ${0.05 + i * 0.05}s both` }}
                            >
                                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40 dark:from-blue-400 dark:to-blue-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/15 to-primary/15 dark:from-blue-500/25 dark:to-primary/25 text-blue-600 dark:text-blue-400 font-bold text-lg ring-2 ring-transparent group-hover:ring-blue-500/20 transition-shadow transition-colors">
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                {pro.displayName}
                                            </h3>
                                            {pro.rating > 0 && (
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300" />
                                                    <span className="font-semibold tabular-nums">
                                                        {pro.rating.toFixed(1)}
                                                    </span>
                                                    {pro.totalReviews > 0 && (
                                                        <span className="text-muted-foreground text-xs">
                                                            ({pro.totalReviews} reseñas)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {pro.specialties?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {pro.specialties.map((spec) => (
                                                <Badge
                                                    key={spec}
                                                    variant="outline"
                                                    className="text-[11px] border-border/60 text-muted-foreground hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    {spec}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {pro.bio && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {pro.bio}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// =============================================================================
// CTA Final
// =============================================================================

function CTASection({
    businessName,
    phone,
    onBooking,
}: {
    businessName: string;
    phone: string;
    onBooking: () => void;
}) {
    return (
        <section className="relative overflow-hidden py-16 lg:py-20">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-accent/8" />
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="mx-auto max-w-2xl px-4 text-center relative" style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-5">
                    <Calendar className="h-3.5 w-3.5" />
                    Reserva ahora
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                    ¿Listo para tu próxima cita?
                </h2>
                <p className="text-muted-foreground mb-8 text-base">
                    Reserva tu cita en <span className="font-semibold text-foreground">{businessName}</span> de
                    forma rápida y sencilla
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                        size="lg"
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-base px-8 h-12"
                        onClick={onBooking}
                    >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Reservar ahora
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-6 h-12" asChild>
                        <a href={`tel:${phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            Llamar
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
