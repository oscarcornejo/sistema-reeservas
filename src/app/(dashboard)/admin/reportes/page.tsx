/**
 * @fileoverview Página de reportes del admin.
 * Reportes de facturación y ocupación con exportación CSV.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    BarChart3,
    DollarSign,
    Loader2,
    FileSpreadsheet,
    TrendingUp,
    CalendarRange,
} from 'lucide-react';
import { getRevenueReport, getOccupancyReport, exportToCSV } from '@/actions/reports';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() =>
        new Date().toISOString().split('T')[0]
    );
    const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
    const [occupancyData, setOccupancyData] = useState<Record<string, unknown>[]>([]);
    const [isPending, startTransition] = useTransition();

    const loadReports = () => {
        startTransition(async () => {
            const [revenueResult, occupancyResult] = await Promise.all([
                getRevenueReport(startDate, endDate),
                getOccupancyReport(startDate, endDate),
            ]);

            if (revenueResult.success && revenueResult.data) {
                setRevenueData(revenueResult.data as unknown as Record<string, unknown>[]);
            } else {
                toast.error(revenueResult.error || 'Error al cargar reporte de facturación');
            }

            if (occupancyResult.success && occupancyResult.data) {
                setOccupancyData(occupancyResult.data as unknown as Record<string, unknown>[]);
            } else {
                toast.error(occupancyResult.error || 'Error al cargar reporte de ocupación');
            }
        });
    };

    const handleExport = (data: Record<string, unknown>[], filename: string) => {
        startTransition(async () => {
            const result = await exportToCSV(data, filename);
            if (result.success && result.data) {
                const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${filename}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Archivo CSV descargado');
            } else {
                toast.error(result.error || 'Error al exportar');
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/8 via-background to-emerald-500/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-500/6 blur-3xl" />

                <div className="relative space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BarChart3 className="h-7 w-7 text-amber-500" />
                        Reportes
                    </h1>
                    <p className="text-muted-foreground">
                        Analiza el rendimiento de tu negocio con datos detallados
                    </p>
                </div>
            </div>

            {/* ── Filtros de fecha ── */}
            <Card
                className="relative overflow-hidden border-border/50"
                style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
                <CardContent className="p-5">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CalendarRange className="h-3 w-3" />
                                Desde
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-[180px] border-border/60"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <CalendarRange className="h-3 w-3" />
                                Hasta
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-[180px] border-border/60"
                            />
                        </div>
                        <Button
                            onClick={loadReports}
                            disabled={isPending}
                            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Generar reportes
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Tabs de reportes ── */}
            <Tabs
                defaultValue="revenue"
                className="space-y-4"
                style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
            >
                <TabsList className="bg-muted/50 border border-border/50">
                    <TabsTrigger value="revenue" className="gap-2 data-[state=active]:shadow-sm">
                        <DollarSign className="h-4 w-4" />
                        Facturación
                    </TabsTrigger>
                    <TabsTrigger value="occupancy" className="gap-2 data-[state=active]:shadow-sm">
                        <BarChart3 className="h-4 w-4" />
                        Ocupación
                    </TabsTrigger>
                </TabsList>

                {/* Reporte de facturación */}
                <TabsContent value="revenue">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-emerald-400/40" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                    Reporte de Facturación
                                </CardTitle>
                                <CardDescription>Detalle de ingresos por cita completada</CardDescription>
                            </div>
                            {revenueData.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border/60"
                                    onClick={() => handleExport(revenueData, 'facturacion')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Profesional</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {revenueData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16">
                                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                                <p className="text-muted-foreground text-sm">Genera un reporte seleccionando las fechas</p>
                                                <p className="text-xs text-muted-foreground/60 mt-1">Los datos aparecerán aquí</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        revenueData.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-sm text-muted-foreground tabular-nums">{String(row.date)}</TableCell>
                                                <TableCell className="font-medium">{String(row.serviceName)}</TableCell>
                                                <TableCell className="text-sm">{String(row.professionalName)}</TableCell>
                                                <TableCell className="text-sm">{String(row.clientName)}</TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold tabular-nums">
                                                        {formatCurrency(row.amount as number)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                                            row.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`} />
                                                        <Badge
                                                            className={`text-[10px] border-0 ${
                                                                row.paymentStatus === 'paid'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : 'bg-amber-500/10 text-amber-600'
                                                            }`}
                                                        >
                                                            {row.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                                                        </Badge>
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reporte de ocupación */}
                <TabsContent value="occupancy">
                    <Card className="relative overflow-hidden border-border/50">
                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Reporte de Ocupación
                                </CardTitle>
                                <CardDescription>Rendimiento por profesional en el período</CardDescription>
                            </div>
                            {occupancyData.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border/60"
                                    onClick={() => handleExport(occupancyData, 'ocupacion')}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar CSV
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Profesional</TableHead>
                                        <TableHead className="text-right">Citas total</TableHead>
                                        <TableHead className="text-right">Completadas</TableHead>
                                        <TableHead className="text-right">Ocupación</TableHead>
                                        <TableHead className="text-right">Ingresos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {occupancyData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-16">
                                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                                <p className="text-muted-foreground text-sm">Genera un reporte seleccionando las fechas</p>
                                                <p className="text-xs text-muted-foreground/60 mt-1">Los datos aparecerán aquí</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        occupancyData.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{String(row.professionalName)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-sm">{String(row.totalSlots)}</TableCell>
                                                <TableCell className="text-right tabular-nums text-sm">{String(row.usedSlots)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="inline-flex items-center gap-2.5">
                                                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    (row.occupancyRate as number) >= 80
                                                                        ? 'bg-emerald-500'
                                                                        : (row.occupancyRate as number) >= 50
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(row.occupancyRate as number, 100)}%` }}
                                                            />
                                                        </div>
                                                        <Badge
                                                            className={`text-[10px] border-0 tabular-nums ${
                                                                (row.occupancyRate as number) >= 80
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : (row.occupancyRate as number) >= 50
                                                                        ? 'bg-amber-500/10 text-amber-600'
                                                                        : 'bg-red-500/10 text-red-600'
                                                            }`}
                                                        >
                                                            {String(row.occupancyRate)}%
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold tabular-nums">
                                                        {formatCurrency(row.revenue as number)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
