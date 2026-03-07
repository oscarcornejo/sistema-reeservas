/**
 * @fileoverview Dashboard del profesional.
 * Saludo personalizado, métricas con personalidad visual,
 * agenda del día y accesos rápidos — mismo nivel que el admin dashboard.
 */

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Users,
  Star,
  ArrowRight,
  Sparkles,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { Greeting } from "@/components/ui/greeting";

// =============================================================================
// Contenido del dashboard
// =============================================================================

function DashboardContent() {
  return (
    <div className="space-y-8">
      {/* ── Saludo personalizado ── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6 sm:p-8"
        style={{ animation: "fadeIn 0.4s ease-out" }}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <Suspense fallback="Hola">
                <Greeting />
              </Suspense>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Tu agenda profesional
            </p>
          </div>
          <Link
            href="/profesional/calendario"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 shrink-0"
          >
            <Calendar className="h-4 w-4" />
            Ver calendario
          </Link>
        </div>
      </div>

      {/* ── Métricas principales ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-[box-shadow] duration-300"
          style={{ animation: "fadeIn 0.4s ease-out 0.05s both" }}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Citas hoy
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <Calendar className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              citas programadas
            </p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-blue-500/5 transition-[box-shadow] duration-300"
          style={{ animation: "fadeIn 0.4s ease-out 0.1s both" }}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Esta semana
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 group-hover:bg-blue-500/15 transition-colors">
                <Clock className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">0</p>
            <p className="text-xs text-muted-foreground mt-1">
              citas por venir
            </p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-[box-shadow] duration-300"
          style={{ animation: "fadeIn 0.4s ease-out 0.15s both" }}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Clientes atendidos
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors">
                <Users className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">0</p>
            <p className="text-xs text-muted-foreground mt-1">este mes</p>
          </CardContent>
        </Card>

        <Card
          className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-amber-500/5 transition-[box-shadow] duration-300"
          style={{ animation: "fadeIn 0.4s ease-out 0.2s both" }}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                Calificación
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/15 transition-colors">
                <Star className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              5.0
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              promedio general
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Panel inferior: Citas de hoy + Accesos rápidos ── */}
      <div
        className="grid gap-6 lg:grid-cols-5"
        style={{ animation: "fadeIn 0.4s ease-out 0.25s both" }}
      >
        {/* Citas de hoy */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Citas de hoy</CardTitle>
              <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
                0 programadas
              </Badge>
            </div>
            <CardDescription>Tu agenda para el día de hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                <Calendar className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                No hay citas programadas para hoy
              </p>
              <p className="text-xs text-muted-foreground/60">
                Las citas aparecerán aquí cuando sean agendadas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Accesos rápidos */}
        <div className="lg:col-span-2 grid gap-3 content-start">
          <Link href="/profesional/calendario" className="group">
            <Card className="border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-[box-shadow,border-color] duration-300">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                    Calendario
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ver agenda completa
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-[color,transform] shrink-0 mt-0.5" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/clientes" className="group">
            <Card className="border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-[box-shadow,border-color] duration-300">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-accent transition-colors">
                    Mis Clientes
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Historial y contacto
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-[color,transform] shrink-0 mt-0.5" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/perfil" className="group">
            <Card className="border-border/50 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-[box-shadow,border-color] duration-300">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors">
                  <UserCircle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Mi Perfil
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Datos y preferencias
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-[color,transform] shrink-0 mt-0.5" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Skeleton de carga
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-36 bg-muted rounded" />
          </div>
          <div className="h-10 w-40 bg-muted rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-9 w-9 bg-muted rounded-lg" />
              </div>
              <div className="h-10 w-16 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Página principal
// =============================================================================

export default function ProfessionalDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
