/**
 * @fileoverview Página de reportes del profesional.
 * Server Component que carga métricas y citas del profesional
 * autenticado para un rango de fechas configurable.
 */

import { Suspense } from 'react';
import { getUserProfessionalProfile } from '@/lib/auth/dal';
import { getCachedProfessionalReport } from '@/lib/data/queries';
import { redirect } from 'next/navigation';
import { ProfessionalReportsClient } from './reports-client';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
    searchParams: Promise<{ desde?: string; hasta?: string }>;
}

async function ReportsContent({ searchParams }: Props) {
    const professional = await getUserProfessionalProfile();
    if (!professional) redirect('/profesional');

    const params = await searchParams;

    // Rango por defecto: primer día del mes actual → hoy
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const defaultEnd = today.toISOString().split('T')[0];

    const startDate = params.desde || defaultStart;
    const endDate = params.hasta || defaultEnd;

    const data = await getCachedProfessionalReport(
        String(professional._id),
        startDate,
        endDate,
    );

    return (
        <ProfessionalReportsClient
            metrics={data.metrics}
            appointments={data.appointments}
            startDate={startDate}
            endDate={endDate}
        />
    );
}

function ReportsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header */}
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-4 w-64 bg-muted rounded" />
                </div>
            </div>
            {/* Métricas */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-9 w-9 bg-muted rounded-lg" />
                            </div>
                            <div className="h-10 w-16 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Filtro */}
            <div className="h-16 bg-muted/30 rounded-xl border border-border/50" />
            {/* Tabla */}
            <Card className="border-border/50">
                <CardContent className="p-0">
                    <div className="space-y-4 p-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProfessionalReportsPage(props: Props) {
    return (
        <Suspense fallback={<ReportsSkeleton />}>
            <ReportsContent searchParams={props.searchParams} />
        </Suspense>
    );
}
