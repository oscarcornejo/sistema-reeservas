/**
 * @fileoverview Galería bento-grid del negocio (estilo Airbnb).
 * Desktop: 1 imagen grande (izq, row-span-2) + hasta 4 miniaturas (der, 2x2).
 * Mobile: imagen única con botón "Ver N fotos".
 * Lightbox Dialog con scroll vertical de todas las imágenes.
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Images } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BusinessGalleryProps {
    images: string[];
    businessName: string;
}

export default function BusinessGallery({
    images,
    businessName,
}: BusinessGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const openLightbox = useCallback(() => {
        setLightboxOpen(true);
    }, []);

    if (!images.length) return null;

    const display = images.slice(0, 5);
    const count = display.length;

    return (
        <>
            {/* ── Desktop bento grid ── */}
            <div
                className={cn(
                    'hidden sm:grid gap-1 rounded-xl overflow-hidden',
                    'h-[300px] md:h-[360px] lg:h-[420px]',
                    count === 1 && 'grid-cols-1',
                    count === 2 && 'grid-cols-2',
                    count === 3 && 'grid-cols-[2fr_1fr] grid-rows-2',
                    count >= 4 && 'grid-cols-[2fr_1fr_1fr] grid-rows-2',
                )}
                role="region"
                aria-label={`Galería de ${businessName}`}
            >
                {/* Imagen principal — siempre row-span-2 si hay más de 2 */}
                <button
                    type="button"
                    className={cn(
                        'relative overflow-hidden group cursor-pointer',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                        count >= 3 && 'row-span-2',
                    )}
                    onClick={openLightbox}
                    aria-label={`${businessName} — foto 1 de ${images.length}`}
                >
                    <Image
                        src={display[0]}
                        alt={`${businessName} — foto 1 de ${images.length}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        priority
                    />
                </button>

                {/* Imágenes secundarias */}
                {display.slice(1).map((src, i) => {
                    const isLastSlot = i === count - 2;
                    return (
                        <button
                            key={src}
                            type="button"
                            className="relative overflow-hidden group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                            onClick={openLightbox}
                            aria-label={`${businessName} — foto ${i + 2} de ${images.length}`}
                        >
                            <Image
                                src={src}
                                alt={`${businessName} — foto ${i + 2} de ${images.length}`}
                                fill
                                sizes="(max-width: 1280px) 25vw, 320px"
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                            {/* Botón "Ver todas" sobre la última celda */}
                            {isLastSlot && (
                                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-background px-3 py-1.5 text-xs font-medium border border-border/60 shadow-sm">
                                    <Images className="h-3.5 w-3.5" />
                                    Ver todas las fotos
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Celdas vacías si hay < 5 imágenes y >= 4 columnas */}
                {count === 4 && <div className="bg-muted/40" />}
            </div>

            {/* ── Mobile: imagen única + botón ── */}
            <button
                type="button"
                className="sm:hidden relative w-full rounded-xl overflow-hidden aspect-[4/3]"
                onClick={openLightbox}
                aria-label={`Galería de ${businessName}`}
            >
                <Image
                    src={images[0]}
                    alt={`${businessName} — foto 1 de ${images.length}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                />
                {images.length > 1 && (
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium border border-border/50 shadow-sm">
                        <Images className="h-3.5 w-3.5" />
                        {images.length} fotos
                    </span>
                )}
            </button>

            {/* ── Lightbox Dialog ── */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Galería de {businessName}</DialogTitle>
                        <DialogDescription>
                            {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="columns-1 sm:columns-2 gap-3 space-y-3 mt-2">
                        {images.map((src, i) => (
                            <div
                                key={src}
                                className="break-inside-avoid rounded-lg overflow-hidden"
                            >
                                <Image
                                    src={src}
                                    alt={`${businessName} — foto ${i + 1} de ${images.length}`}
                                    width={800}
                                    height={600}
                                    sizes="(max-width: 896px) 100vw, 448px"
                                    className="w-full h-auto object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
