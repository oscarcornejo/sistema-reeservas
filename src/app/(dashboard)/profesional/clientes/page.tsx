/**
 * @fileoverview Página de clientes del profesional.
 * Server Component que carga los clientes atendidos por el profesional
 * autenticado y delega la tabla interactiva al componente cliente.
 */

import { Suspense } from 'react';
import { getUserProfessionalProfile } from '@/lib/auth/dal';
import { getCachedProfessionalClients } from '@/lib/data/queries';
import { redirect } from 'next/navigation';
import { ClientsTable } from './clients-table';
import { Card, CardContent } from '@/components/ui/card';

async function ClientsContent() {
    const professional = await getUserProfessionalProfile();
    if (!professional) redirect('/profesional');

    const todayISO = new Date().toISOString();
    const data = await getCachedProfessionalClients(
        String(professional._id),
        todayISO,
    );

    return (
        <ClientsTable
            clients={data.clients}
            metrics={data.metrics}
        />
    );
}

function ClientsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-4 w-64 bg-muted rounded" />
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-border/50">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-9 w-9 bg-muted rounded-lg" />
                            </div>
                            <div className="h-10 w-16 bg-muted rounded" />
                            <div className="h-3 w-20 bg-muted rounded mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="h-10 w-80 bg-muted rounded" />
            <Card className="border-border/50">
                <CardContent className="p-0">
                    <div className="space-y-4 p-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="h-9 w-9 bg-muted rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded" />
                                    <div className="h-3 w-48 bg-muted rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProfessionalClientsPage() {
    return (
        <Suspense fallback={<ClientsSkeleton />}>
            <ClientsContent />
        </Suspense>
    );
}
