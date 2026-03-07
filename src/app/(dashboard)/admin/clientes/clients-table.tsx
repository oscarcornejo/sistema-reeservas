/**
 * @fileoverview Componente cliente para la tabla de clientes del admin.
 * Recibe datos desde el server component y maneja búsqueda client-side.
 * Incluye acciones: ver/editar y eliminar.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Search,
    Users,
    Calendar,
    Phone,
    Mail,
    Crown,
    MoreHorizontal,
    Eye,
    Trash2,
} from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils/format';
import { ClientDetailDialog } from '@/components/clients/ClientDetailDialog';
import type { ClientData } from '@/components/clients/ClientDetailDialog';
import { DeleteClientDialog } from '@/components/clients/DeleteClientDialog';
import { RescheduleDialog } from '@/components/booking/RescheduleDialog';
import { CancelDialog } from '@/components/booking/CancelDialog';

interface ClientRow {
    _id: string;
    name: string;
    email: string;
    phone: string;
    tags: string[];
    totalVisits: number;
    lastVisit: string | null;
    source: string;
}

function normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2);
}

function getTagStyle(tag: string): string {
    const t = tag.toLowerCase();
    if (t === 'vip') return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
    if (t === 'frecuente') return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
    if (t === 'nuevo') return 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
    return 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400';
}

export function AdminClientsTable({ clients }: { clients: ClientRow[] }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Estado de diálogos
    const [detailClientId, setDetailClientId] = useState<string | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [deleteClient, setDeleteClient] = useState<ClientRow | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Estado para diálogos de citas (reagendar/cancelar)
    const [rescheduleApt, setRescheduleApt] = useState<any>(null);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [cancelApt, setCancelApt] = useState<any>(null);
    const [cancelOpen, setCancelOpen] = useState(false);

    const filteredClients = useMemo(() => {
        if (!searchQuery) return clients;
        const q = normalize(searchQuery);
        return clients.filter(
            (c) => normalize(c.name).includes(q) || normalize(c.email).includes(q),
        );
    }, [clients, searchQuery]);

    const totalVisits = clients.reduce((sum, c) => sum + c.totalVisits, 0);
    const vipCount = clients.filter((c) => c.tags.includes('VIP')).length;

    const handleViewDetail = (client: ClientRow) => {
        setDetailClientId(client._id);
        setDetailOpen(true);
    };

    const handleDelete = (client: ClientRow | ClientData) => {
        const target = clients.find((c) => c._id === client._id) ?? client;
        setDeleteClient(target as ClientRow);
        setDeleteOpen(true);
        setDetailOpen(false);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <div className="space-y-8">
            {/* -- Header -- */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                        <Users className="h-7 w-7 text-accent" />
                        Clientes
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona tu base de clientes y su historial
                    </p>
                </div>
            </div>

            {/* -- Metricas -- */}
            <div className="grid gap-4 sm:grid-cols-3" style={{ animation: 'fadeIn 0.4s ease-out 0.05s both' }}>
                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-[box-shadow] duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Total clientes</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                <Users className="h-4.5 w-4.5 text-primary" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight tabular-nums">{clients.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">registrados</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 transition-[box-shadow] duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Visitas totales</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 group-hover:bg-blue-500/15 transition-colors">
                                <Calendar className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight tabular-nums">{totalVisits}</p>
                        <p className="text-xs text-muted-foreground mt-1">citas completadas</p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-border/50 hover:shadow-lg hover:shadow-amber-500/5 dark:hover:shadow-amber-500/10 transition-[box-shadow] duration-300">
                    <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-amber-400/40" />
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-muted-foreground">Clientes VIP</span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-500/20 group-hover:bg-amber-500/15 transition-colors">
                                <Crown className="h-4.5 w-4.5 text-amber-500 dark:text-amber-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold tracking-tight tabular-nums">{vipCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">clientes destacados</p>
                    </CardContent>
                </Card>
            </div>

            {/* -- Busqueda -- */}
            <div
                className="relative max-w-md"
                style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
            >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar cliente por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Buscar cliente"
                    className="pl-10 border-border/60"
                />
            </div>

            {/* -- Tabla -- */}
            <Card
                className="relative border-border/50 overflow-hidden"
                style={{ animation: 'fadeIn 0.4s ease-out 0.15s both' }}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-primary/40" />
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Cliente</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead className="text-right">Visitas</TableHead>
                                <TableHead>Última visita</TableHead>
                                <TableHead>Etiquetas</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16">
                                        <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">
                                            {searchQuery ? 'No se encontraron clientes' : 'Aún no tienes clientes registrados'}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">
                                            {searchQuery
                                                ? 'Intenta con otros términos de búsqueda'
                                                : 'Los clientes aparecerán aquí cuando agenden citas'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client._id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-shadow">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/15 text-primary text-xs font-semibold">
                                                        {getInitials(client.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium group-hover:text-primary transition-colors">
                                                    {client.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    {client.email}
                                                </div>
                                                {client.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3 shrink-0" />
                                                        {client.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                                                        style={{ width: `${Math.min((client.totalVisits / 30) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold tabular-nums">{client.totalVisits}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                                            {client.lastVisit ? formatRelativeDate(client.lastVisit) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1.5">
                                                {client.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        className={`text-[10px] border-0 ${getTagStyle(tag)}`}
                                                    >
                                                        {tag === 'VIP' && <Crown className="h-2.5 w-2.5 mr-1" />}
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Acciones</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDetail(client)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Ver / Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onClick={() => handleDelete(client)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* -- Diálogos -- */}
            <ClientDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                clientId={detailClientId}
                userRole="admin"
                onDelete={handleDelete}
                onReschedule={(apt) => {
                    setRescheduleApt(apt);
                    setRescheduleOpen(true);
                }}
                onCancel={(apt) => {
                    setCancelApt(apt);
                    setCancelOpen(true);
                }}
            />

            <DeleteClientDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                client={deleteClient}
                onSuccess={handleSuccess}
            />

            <RescheduleDialog
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
                appointment={rescheduleApt}
                onSuccess={handleSuccess}
            />

            <CancelDialog
                open={cancelOpen}
                onOpenChange={setCancelOpen}
                appointment={cancelApt}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
