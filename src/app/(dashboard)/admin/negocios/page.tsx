/**
 * @fileoverview Página de gestión de negocios del admin.
 * Listado con stats, tabla interactiva y eliminación con confirmación cascade.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Globe,
  FileEdit,
  ExternalLink,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { getAdminBusinesses, deleteBusiness } from "@/actions/businesses";
import { getCurrentSubscription } from "@/actions/subscriptions";
import { canAccess } from "@/lib/utils/plan-limits";
import { formatDate } from "@/lib/utils/format";
import { UpgradeBanner } from "@/components/ui/upgrade-banner";
import { toast } from "sonner";
import type { IBusiness, SubscriptionPlan } from "@/types";

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadBusinesses = () => {
    startTransition(async () => {
      const result = await getAdminBusinesses();
      if (result.success && result.data) {
        setBusinesses(result.data);
      } else {
        toast.error(result.error || "Error al cargar negocios");
      }
    });
  };

  useEffect(() => {
    getCurrentSubscription().then((result) => {
      if (result.success && result.data) {
        setPlan(result.data.businessPlan as SubscriptionPlan);
      }
    });
    loadBusinesses();
  }, []);

  const handleDelete = (businessId: string) => {
    startTransition(async () => {
      const result = await deleteBusiness(businessId);
      if (result.success) {
        toast.success("Negocio eliminado correctamente");
        loadBusinesses();
      } else {
        toast.error(result.error);
      }
    });
  };

  const published = businesses.filter((b) => b.isPublished);
  const drafts = businesses.filter((b) => !b.isPublished);

  return (
    <div className="space-y-8">
      {/* ── Header con banner gradiente ── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/8 via-background to-primary/6 border border-border/50 p-6"
        style={{ animation: "fadeIn 0.4s ease-out" }}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/8 dark:bg-accent/15 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

        <div className="relative space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-7 w-7 text-accent dark:text-accent" />
            Negocios
          </h1>
          <p className="text-muted-foreground">
            Gestiona los negocios vinculados a tu cuenta
          </p>
        </div>
      </div>

      {plan && !canAccess(plan, "multiBusiness") ? (
        <UpgradeBanner
          requiredPlan="enterprise"
          feature="Gestión multi-negocio"
        />
      ) : (
        <>
          {/* ── Stats ── */}
          <div
            className="grid gap-4 sm:grid-cols-3"
            style={{ animation: "fadeIn 0.4s ease-out 0.05s both" }}
          >
            <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-[box-shadow] duration-300">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total negocios
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Building2 className="h-4.5 w-4.5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {businesses.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  registrados
                </p>
              </CardContent>
            </Card>
            <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-[box-shadow] duration-300">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Publicados
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 group-hover:bg-emerald-500/15 dark:group-hover:bg-emerald-500/25 transition-colors">
                    <Globe className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {published.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  visibles al público
                </p>
              </CardContent>
            </Card>
            <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-amber-500/5 transition-[box-shadow] duration-300">
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Borradores
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/15 dark:group-hover:bg-amber-500/25 transition-colors">
                    <FileEdit className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {drafts.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  sin publicar
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabla de negocios ── */}
          <Card
            className="relative overflow-hidden border-border/50"
            style={{ animation: "fadeIn 0.4s ease-out 0.1s both" }}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
            <CardContent className="p-0">
              {isPending && businesses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                  <p className="text-sm text-muted-foreground">
                    Cargando negocios...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Negocio</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Ciudad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-16">
                            <Building2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">
                              No hay negocios registrados
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                              Los negocios aparecerán aquí
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        businesses.map((business) => (
                          <TableRow
                            key={business._id.toString()}
                            className="group"
                          >
                            <TableCell className="w-[320px] max-w-[420px] whitespace-normal">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-transparent group-hover:ring-accent/20 transition-shadow">
                                  <AvatarFallback className="bg-gradient-to-br from-accent/15 to-primary/15 dark:from-accent/25 dark:to-primary/25 text-accent dark:text-accent text-xs font-semibold">
                                    {business.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                                    {business.name}
                                  </p>
                                  {business.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {business.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="text-[10px] border-0 bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent hover:bg-accent/20 dark:hover:bg-accent/30">
                                {business.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {business.city}
                            </TableCell>
                            <TableCell>
                              {business.isPublished ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <Badge className="text-[10px] border-0 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30">
                                    Publicado
                                  </Badge>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                                  <Badge className="text-[10px] border-0 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30">
                                    Borrador
                                  </Badge>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                              {formatDate(business.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {business.isPublished && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                    asChild
                                  >
                                    <Link
                                      href={`/negocio/${business.slug}`}
                                      target="_blank"
                                      title="Ver página pública"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Link>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 hover:text-blue-500 dark:hover:text-blue-400"
                                  asChild
                                >
                                  <Link
                                    href="/admin/configuracion"
                                    title="Editar negocio"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Eliminar &ldquo;{business.name}&rdquo;
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción es irreversible. Se
                                        eliminarán permanentemente todos los
                                        datos asociados: servicios,
                                        profesionales, clientes, citas y
                                        suscripciones de este negocio.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancelar
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() =>
                                          handleDelete(business._id.toString())
                                        }
                                        disabled={isPending}
                                      >
                                        {isPending
                                          ? "Eliminando..."
                                          : "Eliminar negocio"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
