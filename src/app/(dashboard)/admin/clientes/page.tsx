/**
 * @fileoverview Página de gestión de clientes del admin.
 * Lista de clientes con búsqueda, métricas y detalle en diálogo.
 * Diseño refinado con gradientes, acentos y animaciones.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Search,
    UserPlus,
    Users,
    Calendar,
    Phone,
    Mail,
    Crown,
} from 'lucide-react';

/** Datos de ejemplo (se reemplazarán con datos de DB) */
const SAMPLE_CLIENTS = [
    {
        id: '1',
        name: 'María García',
        email: 'maria@email.com',
        phone: '+56 9 1234 5678',
        totalVisits: 12,
        lastVisit: '2024-01-15',
        tags: ['VIP', 'Frecuente'],
    },
    {
        id: '2',
        name: 'Carlos López',
        email: 'carlos@email.com',
        phone: '+56 9 8765 4321',
        totalVisits: 5,
        lastVisit: '2024-01-10',
        tags: ['Nuevo'],
    },
    {
        id: '3',
        name: 'Ana Martínez',
        email: 'ana@email.com',
        phone: '+56 9 5555 6666',
        totalVisits: 28,
        lastVisit: '2024-01-20',
        tags: ['VIP'],
    },
];

export default function ClientsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredClients = SAMPLE_CLIENTS.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalVisits = SAMPLE_CLIENTS.reduce((sum, c) => sum + c.totalVisits, 0);
    const vipCount = SAMPLE_CLIENTS.filter((c) => c.tags.includes('VIP')).length;

    return (
        <div className="space-y-8">
            {/* ── Header con banner gradiente ── */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-accent/6 border border-border/50 p-6"
                style={{ animation: 'fadeIn 0.4s ease-out' }}
            >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/8 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-primary/6 blur-3xl" />

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                            <Users className="h-7 w-7 text-accent" />
                            Clientes
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tu base de clientes y su historial
                        </p>
                    </div>
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 shrink-0">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Nuevo cliente
                    </Button>
                </div>
            </div>

            {/* ── Stats rápidas ── */}
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
                        <p className="text-3xl font-bold tracking-tight tabular-nums">{SAMPLE_CLIENTS.length}</p>
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

            {/* ── Búsqueda ── */}
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

            {/* ── Tabla de clientes ── */}
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">No se encontraron clientes</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">Intenta con otros términos de búsqueda</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClients.map((client) => (
                                    <TableRow key={client.id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-shadow">
                                                    <AvatarFallback className="bg-gradient-to-br from-primary/15 to-accent/15 text-primary text-xs font-semibold">
                                                        {client.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium group-hover:text-primary transition-colors">{client.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    {client.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3 shrink-0" />
                                                    {client.phone}
                                                </div>
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
                                        <TableCell className="text-sm text-muted-foreground tabular-nums">{client.lastVisit}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1.5">
                                                {client.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        className={`text-[10px] border-0 ${
                                                            tag === 'VIP'
                                                                ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30'
                                                                : tag === 'Frecuente'
                                                                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-500/30'
                                                                    : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30'
                                                        }`}
                                                    >
                                                        {tag === 'VIP' && <Crown className="h-2.5 w-2.5 mr-1" />}
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
