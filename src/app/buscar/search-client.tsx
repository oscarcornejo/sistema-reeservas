/**
 * @fileoverview Componente cliente para busqueda y filtrado de negocios.
 * Recibe los datos de negocios desde el server component padre.
 */

"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS_CATEGORIES } from "@/lib/utils/format";

/** Hook seguro para obtener el dia actual sin romper PPR */
const subscribe = () => () => {};
const getSnapshot = () => new Date().getDay();
const getServerSnapshot = (): null => null;

function useCurrentDay(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Mapa de emojis por categoria */
const CATEGORY_EMOJI: Record<string, string> = {
  Barberia: "\u{1F488}",
  Spa: "\u{1F9D6}",
  "Consultorio Dental": "\u{1F9B7}",
  Peluqueria: "\u2702\uFE0F",
  "Centro de Estetica": "\u{1F485}",
  Clinica: "\u{1F3E5}",
  "Centro de Masajes": "\u{1F486}",
  "Salon de Belleza": "\u{1F487}",
};

/** Mapa de gradientes por categoria */
const CATEGORY_GRADIENT: Record<string, string> = {
  Barberia: "from-amber-500/15 via-orange-500/10 to-red-500/5",
  Spa: "from-emerald-500/15 via-teal-500/10 to-cyan-500/5",
  "Consultorio Dental": "from-blue-500/15 via-indigo-500/10 to-violet-500/5",
  Peluqueria: "from-pink-500/15 via-rose-500/10 to-fuchsia-500/5",
  "Centro de Estetica": "from-violet-500/15 via-purple-500/10 to-fuchsia-500/5",
  Clinica: "from-cyan-500/15 via-blue-500/10 to-indigo-500/5",
  "Centro de Masajes": "from-teal-500/15 via-emerald-500/10 to-green-500/5",
  "Salon de Belleza": "from-rose-500/15 via-pink-500/10 to-fuchsia-500/5",
};

/** Normaliza texto removiendo acentos para busqueda */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface BusinessResult {
  _id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  gallery?: string[];
  workingHours?: { dayOfWeek: number; isOpen: boolean }[];
  services: string[];
  rating: number;
  reviewCount: number;
  [key: string]: unknown;
}

function isOpenNow(
  workingHours: { dayOfWeek: number; isOpen: boolean }[] | undefined,
  dayOfWeek: number | null,
): boolean {
  if (!workingHours?.length || dayOfWeek === null) return false;
  const todayHours = workingHours.find((h) => h.dayOfWeek === dayOfWeek);
  return todayHours?.isOpen ?? false;
}

export function SearchClient({ businesses }: { businesses: BusinessResult[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const currentDay = useCurrentDay();

  const filteredResults = useMemo(() => {
    const normalizedQuery = normalize(query);
    return businesses.filter((r) => {
      const matchesQuery =
        !normalizedQuery ||
        normalize(r.name).includes(normalizedQuery) ||
        normalize(r.category).includes(normalizedQuery) ||
        r.services.some((s) => normalize(s).includes(normalizedQuery));
      const matchesCategory =
        category === "all" || normalize(r.category) === normalize(category);
      return matchesQuery && matchesCategory;
    });
  }, [businesses, query, category]);

  return (
    <div className="min-h-screen bg-background">
      {/* -- Hero de busqueda -- */}
      <section className="relative overflow-hidden border-b border-border/40">
        {/* Decoracion de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/4 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:py-16 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary mb-5"
            style={{ animation: "fadeIn 0.4s ease-out" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Descubre los mejores profesionales cerca de ti
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
            style={{ animation: "fadeIn 0.4s ease-out 0.05s both" }}
          >
            Encuentra tu{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              profesional ideal
            </span>
          </h1>
          <p
            className="text-muted-foreground text-base sm:text-lg mb-8"
            style={{ animation: "fadeIn 0.4s ease-out 0.1s both" }}
          >
            Busca por nombre, categoria o servicio
          </p>

          {/* Barra de busqueda */}
          <div
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
            style={{ animation: "fadeIn 0.4s ease-out 0.15s both" }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar negocio o servicio..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar negocio o servicio"
                className="pl-11 h-12 bg-background/80 backdrop-blur-sm border-border/60 shadow-sm text-base"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[220px] data-[size=default]:h-12 bg-background/80 backdrop-blur-sm border-border/60 shadow-sm">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* -- Resultados -- */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Contador de resultados */}
          <div
            className="flex items-center justify-between mb-6"
            style={{ animation: "fadeIn 0.4s ease-out 0.2s both" }}
          >
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {filteredResults.length} resultado
                {filteredResults.length !== 1 ? "s" : ""} encontrado
                {filteredResults.length !== 1 ? "s" : ""}
              </p>
              {category !== "all" && (
                <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
                  {category}
                  <button
                    onClick={() => setCategory("all")}
                    className="ml-1.5 hover:text-primary/80"
                  >
                    x
                  </button>
                </Badge>
              )}
            </div>
          </div>

          {/* Grid de tarjetas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredResults.map((result, i) => {
              const openNow = isOpenNow(result.workingHours, currentDay);
              const coverImage = result.gallery?.[0] ?? null;
              const normalizedCategory = normalize(result.category);
              const emojiKey = Object.keys(CATEGORY_EMOJI).find(
                (k) => normalize(k) === normalizedCategory,
              );
              const gradientKey = Object.keys(CATEGORY_GRADIENT).find(
                (k) => normalize(k) === normalizedCategory,
              );

              return (
                <Card
                  key={result._id}
                  className="group relative overflow-hidden border-border/50 py-0 gap-0 hover:shadow-xl hover:shadow-primary/5 transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1"
                  style={{
                    animation: `fadeIn 0.4s ease-out ${0.25 + i * 0.05}s both`,
                  }}
                >
                  {/* Barra de acento superior */}
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Imagen de galeria o fallback con gradiente */}
                  <div
                    className={`relative h-44 bg-gradient-to-br ${(gradientKey && CATEGORY_GRADIENT[gradientKey]) || "from-primary/10 to-accent/10"} flex items-center justify-center overflow-hidden`}
                  >
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={result.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent)]" />
                        <span className="text-6xl opacity-40 group-hover:scale-110 transition-transform duration-500">
                          {(emojiKey && CATEGORY_EMOJI[emojiKey]) || "\u{1F3E2}"}
                        </span>
                      </>
                    )}
                    {/* Overlay oscuro sutil sobre imagen para legibilidad de badges */}
                    {coverImage && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                    )}

                    {/* Badge de estado */}
                    <div className="absolute top-3 right-3">
                      {openNow ? (
                        <Badge className="text-[10px] border-0 bg-emerald-500/90 dark:bg-emerald-500/80 text-white backdrop-blur-sm shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse mr-1.5" />
                          Abierto ahora
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] border-0 bg-muted/90 text-muted-foreground backdrop-blur-sm shadow-sm">
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          Cerrado
                        </Badge>
                      )}
                    </div>

                    {/* Rating overlay */}
                    {result.rating > 0 && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-background/90 backdrop-blur-sm px-2.5 py-1.5 shadow-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300" />
                        <span className="text-sm font-bold tabular-nums">
                          {result.rating}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({result.reviewCount})
                        </span>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    {/* Nombre y categoria */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors leading-tight">
                        {result.name}
                      </h3>
                      <Badge className="mt-1.5 text-[10px] border-0 bg-primary/8 text-primary/80">
                        {result.category}
                      </Badge>
                    </div>

                    {/* Direccion */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                      <span className="truncate">
                        {result.address}, {result.city}
                      </span>
                    </div>

                    {/* Servicios */}
                    {result.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {result.services.map((service) => (
                          <Badge
                            key={service}
                            variant="outline"
                            className="text-[11px] border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-10 px-3 -mx-1 text-primary hover:bg-primary/5 hover:text-primary group/btn"
                      asChild
                    >
                      <Link href={`/negocio/${result.slug}`}>
                        <span className="text-sm font-medium">
                          Ver y reservar
                        </span>
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Estado vacio */}
          {filteredResults.length === 0 && (
            <div
              className="text-center py-20"
              style={{ animation: "fadeIn 0.4s ease-out" }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-5">
                <Search className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No se encontraron resultados
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta con otros terminos de busqueda o categoria
              </p>
              {category !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-border/60"
                  onClick={() => setCategory("all")}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
