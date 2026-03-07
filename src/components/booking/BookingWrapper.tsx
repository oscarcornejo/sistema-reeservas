/**
 * @fileoverview Wrapper client para la reserva online en la página pública.
 * Layout estilo marketplace (Airbnb-like):
 *   1. Header — badges + nombre + meta line (rating, ubicación, verificado)
 *   2. Galería bento grid
 *   3. Dos columnas — info (izq) + booking card sticky (der)
 *   4. CTA final + booking dialog
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    Phone,
    Clock,
    ArrowLeft,
    Star,
    ChevronRight,
    CalendarCheck,
    BadgeCheck,
    Shield,
} from 'lucide-react';
import BookingDialog from './BookingDialog';
import BusinessGallery from '@/components/gallery/BusinessGallery';
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
    galleryImages: string[];
}

// =============================================================================
// Helpers
// =============================================================================

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
    galleryImages,
}: BookingWrapperProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();

    const openBooking = (serviceId?: string) => {
        setPreselectedServiceId(serviceId);
        setDialogOpen(true);
    };

    const hasGallery = galleryImages.length > 0;
    const minPrice = services.length
        ? Math.min(...services.map((s) => s.price))
        : 0;
    const todayHour = business.workingHours?.find(
        (h) => h.dayOfWeek === new Date().getDay(),
    );
    const isOpenNow = todayHour?.isOpen ?? false;

    return (
        <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ── 1. Header ── */}
                <BusinessHeader
                    business={business}
                    emoji={categoryEmoji}
                />

                {/* ── 2. Galería bento ── */}
                {hasGallery && (
                    <div className="mb-8 lg:mb-10">
                        <BusinessGallery
                            images={galleryImages}
                            businessName={business.name}
                        />
                    </div>
                )}

                {/* ── 3. Dos columnas: info + booking card ── */}
                <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-14 pb-12 lg:pb-16">
                    {/* Columna izquierda — contenido */}
                    <div className="min-w-0">
                        <HighlightsSection />

                        <Separator className="my-8" />

                        <AboutSection business={business} />

                        <Separator className="my-8" />

                        <ServicesListSection
                            services={services}
                            currency={currency}
                            onBookService={(id) => openBooking(id)}
                        />

                        {professionals.length > 0 && (
                            <>
                                <Separator className="my-8" />
                                <TeamSection professionals={professionals} />
                            </>
                        )}
                    </div>

                    {/* Columna derecha — booking card sticky */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <BookingCard
                                services={services}
                                minPrice={minPrice}
                                currency={currency}
                                serviceCount={services.length}
                                isOpenNow={isOpenNow}
                                todayHour={todayHour}
                                onBooking={() => openBooking()}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Barra fija mobile ── */}
            <MobileBookingBar
                minPrice={minPrice}
                currency={currency}
                isOpenNow={isOpenNow}
                onBooking={() => openBooking()}
            />

            {/* ── Dialog de reserva ── */}
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
// Header — badges + nombre + meta line
// =============================================================================

function BusinessHeader({
    business,
    emoji,
}: {
    business: IBusiness;
    emoji: string;
}) {
    return (
        <div className="pt-6 pb-5">
            {/* Breadcrumb */}
            <Link
                href="/buscar"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Volver a búsqueda
            </Link>

            {/* Badges encima del título */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {emoji} {business.category}
                </span>
                {business.isPublished && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="h-3 w-3" />
                        Verificado
                    </span>
                )}
            </div>

            {/* Nombre */}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
                {business.name}
            </h1>

            {/* Meta line */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 underline underline-offset-2 decoration-border hover:text-foreground transition-colors">
                    <MapPin className="h-3.5 w-3.5" />
                    {business.address}, {business.city}
                </span>
                {business.phone && (
                    <>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {business.phone}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// Highlights — 2 cards en grid con icono + título + descripción
// =============================================================================

const HIGHLIGHTS = [
    {
        icon: CalendarCheck,
        title: 'Confirmación instantánea',
        description:
            'Tu reserva se confirma inmediatamente después de agendarla. Sin esperar aprobación manual.',
    },
    {
        icon: Clock,
        title: 'Cancelación flexible',
        description:
            'Cancela o reprograma sin costo hasta 24 horas antes de la hora de inicio de tu cita.',
    },
] as const;

function HighlightsSection() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 py-1">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
                <div
                    key={title}
                    className="rounded-xl border border-border/50 p-5"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 mb-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// About — descripción con "Leer descripción completa"
// =============================================================================

function AboutSection({ business }: { business: IBusiness }) {
    const [expanded, setExpanded] = useState(false);
    const desc = business.description || '';
    const isLong = desc.length > 200;

    return (
        <div>
            <h2 className="text-lg font-semibold mb-3">Acerca del negocio</h2>
            <div
                className={`text-sm text-muted-foreground leading-relaxed space-y-3 ${
                    !expanded && isLong ? 'line-clamp-5' : ''
                }`}
            >
                <p>{desc || 'Sin descripción disponible.'}</p>
            </div>
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="mt-3 text-sm font-semibold underline underline-offset-2 hover:text-primary transition-colors inline-flex items-center gap-0.5"
                >
                    {expanded ? 'Mostrar menos' : 'Leer descripción completa'}
                    {!expanded && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
            )}
        </div>
    );
}

// =============================================================================
// Servicios — cards con borde (nombre + precio, descripción, duración, reservar)
// =============================================================================

function ServicesListSection({
    services,
    currency,
    onBookService,
}: {
    services: IService[];
    currency: SupportedCurrency;
    onBookService: (serviceId: string) => void;
}) {
    if (!services.length) return null;

    return (
        <div id="servicios">
            <h2 className="text-lg font-semibold mb-4">Nuestros servicios</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                    <button
                        key={String(service._id)}
                        type="button"
                        className="group flex flex-col text-left rounded-xl border border-border/50 p-4 hover:border-primary/30 hover:shadow-md transition-[box-shadow,border-color] duration-200 cursor-pointer"
                        onClick={() => onBookService(String(service._id))}
                    >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                {service.name}
                            </h3>
                            <span className="text-sm font-bold text-primary whitespace-nowrap tabular-nums shrink-0">
                                {formatCurrency(service.price, service.currency || currency)}
                            </span>
                        </div>
                        {service.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {service.description}
                            </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {service.duration} min
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors font-medium">
                                Reservar
                                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// =============================================================================
// Equipo
// =============================================================================

function TeamSection({ professionals }: { professionals: IProfessional[] }) {
    return (
        <div id="equipo">
            <h2 className="text-lg font-semibold mb-4">Nuestro equipo</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {professionals.map((pro) => {
                    const initials = pro.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                    return (
                        <div
                            key={String(pro._id)}
                            className="flex items-center gap-3.5 rounded-xl border border-border/50 p-4"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                    {pro.displayName}
                                </p>
                                {pro.rating > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        <span className="tabular-nums">
                                            {pro.rating.toFixed(1)}
                                        </span>
                                        {pro.totalReviews > 0 && (
                                            <span>({pro.totalReviews})</span>
                                        )}
                                    </div>
                                )}
                                {pro.specialties?.length > 0 && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {pro.specialties.join(' · ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================================================
// Booking Card — sticky sidebar estilo marketplace
// =============================================================================

function BookingCard({
    services,
    minPrice,
    currency,
    serviceCount,
    isOpenNow,
    todayHour,
    onBooking,
}: {
    services: IService[];
    minPrice: number;
    currency: SupportedCurrency;
    serviceCount: number;
    isOpenNow: boolean;
    todayHour: WorkingHour | undefined;
    onBooking: () => void;
}) {
    const avgDuration = services.length
        ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length)
        : 0;

    return (
        <Card className="border-border/60 shadow-lg shadow-black/5">
            <CardContent className="p-6">
                {/* Precio + estado */}
                <div className="flex items-baseline justify-between mb-5">
                    <div>
                        <span className="text-2xl font-bold tabular-nums">
                            {formatCurrency(minPrice, currency)}
                        </span>
                        {serviceCount > 1 && (
                            <span className="text-sm text-muted-foreground ml-1">
                                desde
                            </span>
                        )}
                    </div>
                    {isOpenNow && (
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>Abierto</span>
                        </div>
                    )}
                </div>

                {/* Campos estilo formulario */}
                <div className="rounded-lg border border-border/60 overflow-hidden mb-4">
                    <div className="grid grid-cols-2 divide-x divide-border/60">
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Servicios
                            </p>
                            <p className="text-sm font-medium tabular-nums">
                                {serviceCount} disponibles
                            </p>
                        </div>
                        <div className="p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                                Duración
                            </p>
                            <p className="text-sm font-medium tabular-nums">
                                ~{avgDuration} min
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-border/60 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                            Horario hoy
                        </p>
                        <p className="text-sm font-medium tabular-nums">
                            {todayHour?.isOpen
                                ? `${todayHour.openTime} – ${todayHour.closeTime}`
                                : 'Cerrado hoy'}
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={onBooking}
                >
                    Reservar ahora
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3">
                    No se realizará ningún cobro hoy
                </p>

                {/* Desglose de precio */}
                <Separator className="my-4" />
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground underline underline-offset-2 decoration-dashed decoration-border">
                            {formatCurrency(minPrice, currency)} × 1 sesión
                        </span>
                        <span className="tabular-nums">
                            {formatCurrency(minPrice, currency)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/40">
                        <span>Total</span>
                        <span className="tabular-nums">
                            {formatCurrency(minPrice, currency)}
                        </span>
                    </div>
                </div>

                {/* Badge de protección */}
                <div className="mt-5 flex items-start gap-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <Shield className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Reserva protegida
                        </p>
                        <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed">
                            Tu pago está seguro hasta que el servicio se complete.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// =============================================================================
// Mobile booking bar — fija abajo
// =============================================================================

function MobileBookingBar({
    minPrice,
    currency,
    isOpenNow,
    onBooking,
}: {
    minPrice: number;
    currency: SupportedCurrency;
    isOpenNow: boolean;
    onBooking: () => void;
}) {
    return (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg px-4 py-3 safe-bottom">
            <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
                <div>
                    <span className="text-base font-bold tabular-nums">
                        {formatCurrency(minPrice, currency)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">desde</span>
                    {isOpenNow && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                            Abierto ahora
                        </div>
                    )}
                </div>
                <Button
                    size="default"
                    className="h-10 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={onBooking}
                >
                    Reservar
                </Button>
            </div>
        </div>
    );
}

