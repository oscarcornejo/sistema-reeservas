/**
 * @fileoverview Diálogo de reserva online paso a paso — diseño premium.
 * 5 pasos: Servicio → Profesional → Fecha/Hora → Datos → Confirmación.
 * Funciona para usuarios logueados e invitados.
 */

'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Clock,
    User,
    CalendarDays,
    FileText,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Star,
    Loader2,
    Mail,
    Phone,
    UserCircle,
    MessageSquare,
    Sparkles,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { es } from 'date-fns/locale';
import { format, isBefore, startOfToday } from 'date-fns';
import { getAvailableSlots } from '@/actions/appointments';
import { createPublicBooking } from '@/actions/public-booking';
import { formatCurrency } from '@/lib/utils/format';
import type { IService, IProfessional, SupportedCurrency } from '@/types';

// =============================================================================
// Tipos
// =============================================================================

interface BookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    businessId: string;
    services: IService[];
    professionals: IProfessional[];
    currency: SupportedCurrency;
    preselectedServiceId?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_CONFIG = [
    { label: 'Servicio', icon: FileText },
    { label: 'Profesional', icon: User },
    { label: 'Fecha y hora', icon: CalendarDays },
    { label: 'Tus datos', icon: UserCircle },
    { label: 'Confirmar', icon: CheckCircle2 },
] as const;

// =============================================================================
// Componente principal
// =============================================================================

export default function BookingDialog({
    open,
    onOpenChange,
    businessId,
    services,
    professionals,
    currency,
    preselectedServiceId,
}: BookingDialogProps) {
    const [step, setStep] = useState<Step>(preselectedServiceId ? 2 : 1);
    const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientNotes, setClientNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [isPending, startTransition] = useTransition();

    const selectedService = services.find((s) => String(s._id) === selectedServiceId);
    const selectedProfessional = professionals.find((p) => String(p._id) === selectedProfessionalId);

    // Resetear al cerrar
    useEffect(() => {
        if (!open) {
            setStep(preselectedServiceId ? 2 : 1);
            setSelectedServiceId(preselectedServiceId || '');
            setSelectedProfessionalId('');
            setSelectedDate(undefined);
            setSelectedTime('');
            setClientName('');
            setClientEmail('');
            setClientPhone('');
            setClientNotes('');
            setAvailableSlots([]);
        }
    }, [open, preselectedServiceId]);

    // Fetch slots cuando cambia profesional o fecha
    const fetchSlots = useCallback(async (profId: string, date: Date, serviceId: string) => {
        setLoadingSlots(true);
        setSelectedTime('');
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const result = await getAvailableSlots(profId, dateStr, serviceId);
            if (result.success && result.data) {
                setAvailableSlots(result.data);
            } else {
                setAvailableSlots([]);
            }
        } catch {
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    useEffect(() => {
        if (selectedProfessionalId && selectedDate && selectedServiceId) {
            fetchSlots(selectedProfessionalId, selectedDate, selectedServiceId);
        }
    }, [selectedProfessionalId, selectedDate, selectedServiceId, fetchSlots]);

    const canAdvance = (): boolean => {
        switch (step) {
            case 1: return !!selectedServiceId;
            case 2: return !!selectedProfessionalId;
            case 3: return !!selectedDate && !!selectedTime;
            case 4: return clientName.length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) && clientPhone.length >= 8;
            case 5: return true;
            default: return false;
        }
    };

    const handleNext = () => {
        if (step < 5 && canAdvance()) {
            setStep((s) => (s + 1) as Step);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep((s) => (s - 1) as Step);
        }
    };

    const handleConfirm = () => {
        if (!selectedDate) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.set('businessId', businessId);
            formData.set('professionalId', selectedProfessionalId);
            formData.set('serviceId', selectedServiceId);
            formData.set('date', format(selectedDate, 'yyyy-MM-dd'));
            formData.set('startTime', selectedTime);
            formData.set('clientName', clientName);
            formData.set('clientEmail', clientEmail);
            formData.set('clientPhone', clientPhone);
            if (clientNotes) formData.set('clientNotes', clientNotes);

            const result = await createPublicBooking(formData);

            if (result.success) {
                toast.success('Reserva confirmada', {
                    description: 'Tu cita ha sido agendada exitosamente. Te contactaremos para confirmar.',
                });
                onOpenChange(false);
            } else {
                toast.error('Error al reservar', {
                    description: result.error || 'Intenta nuevamente',
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[580px] max-h-[85dvh] flex flex-col gap-0 p-0 overflow-hidden border-border/50">
                {/* ── Header con stepper premium ── */}
                <div className="shrink-0 relative overflow-hidden border-b border-border/40 px-6 pt-6 pb-5">
                    {/* Fondo sutil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
                    <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />

                    <div className="relative">
                        <DialogHeader className="mb-5">
                            <DialogTitle className="text-lg font-semibold">Reservar cita</DialogTitle>
                            <DialogDescription className="text-sm">
                                {STEP_CONFIG[step - 1].label} — Paso {step} de 5
                            </DialogDescription>
                        </DialogHeader>

                        {/* Stepper visual */}
                        <div className="flex items-center gap-1">
                            {STEP_CONFIG.map((config, i) => {
                                const stepNum = (i + 1) as Step;
                                const Icon = config.icon;
                                const isActive = step === stepNum;
                                const isComplete = step > stepNum;

                                return (
                                    <div key={config.label} className="flex items-center flex-1 last:flex-none">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-medium transition-[transform,background-color,color] duration-300 ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110'
                                                        : isComplete
                                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                            : 'bg-muted text-muted-foreground/50'
                                                }`}
                                            >
                                                {isComplete ? (
                                                    <Check className="h-4 w-4" strokeWidth={2.5} />
                                                ) : (
                                                    <Icon className="h-4 w-4" />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-medium hidden sm:block transition-colors ${
                                                isActive
                                                    ? 'text-foreground'
                                                    : isComplete
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-muted-foreground/60'
                                            }`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        {i < 4 && (
                                            <div className="flex-1 mx-1.5 h-[2px] rounded-full overflow-hidden bg-border/50">
                                                <div
                                                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                                                        step > stepNum
                                                            ? 'w-full bg-emerald-500/40'
                                                            : 'w-0 bg-primary'
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Contenido del paso (scrollable) ── */}
                <div className="min-h-0 overflow-y-auto">
                    <div className="p-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {step === 1 && (
                            <StepService
                                services={services}
                                currency={currency}
                                selectedId={selectedServiceId}
                                onSelect={(id) => setSelectedServiceId(id)}
                            />
                        )}
                        {step === 2 && (
                            <StepProfessional
                                professionals={professionals}
                                selectedId={selectedProfessionalId}
                                onSelect={(id) => setSelectedProfessionalId(id)}
                            />
                        )}
                        {step === 3 && (
                            <StepDateTime
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                                selectedTime={selectedTime}
                                onTimeSelect={setSelectedTime}
                                availableSlots={availableSlots}
                                loading={loadingSlots}
                                hasProfessional={!!selectedProfessionalId}
                            />
                        )}
                        {step === 4 && (
                            <StepClientData
                                name={clientName}
                                email={clientEmail}
                                phone={clientPhone}
                                notes={clientNotes}
                                onNameChange={setClientName}
                                onEmailChange={setClientEmail}
                                onPhoneChange={setClientPhone}
                                onNotesChange={setClientNotes}
                            />
                        )}
                        {step === 5 && selectedService && selectedProfessional && selectedDate && (
                            <StepConfirmation
                                service={selectedService}
                                professional={selectedProfessional}
                                date={selectedDate}
                                time={selectedTime}
                                clientName={clientName}
                                clientEmail={clientEmail}
                                clientPhone={clientPhone}
                                clientNotes={clientNotes}
                                currency={currency}
                            />
                        )}
                    </div>
                </div>

                {/* ── Footer con navegación ── */}
                <div className="shrink-0 border-t border-border/40 px-6 py-4 flex items-center justify-between gap-3 bg-muted/[0.03]">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === 1 || isPending}
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Atrás
                    </Button>

                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                                    i + 1 === step
                                        ? 'w-6 bg-primary'
                                        : i + 1 < step
                                            ? 'w-1.5 bg-emerald-500/40'
                                            : 'w-1.5 bg-border'
                                }`}
                            />
                        ))}
                    </div>

                    {step < 5 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!canAdvance()}
                            className="gap-1.5 bg-primary hover:bg-primary/90 shadow-md shadow-primary/15"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="gap-2 bg-primary hover:bg-primary/90 shadow-md shadow-primary/15"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Reservando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirmar reserva
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// Paso 1: Selección de servicio
// =============================================================================

function StepService({
    services,
    currency,
    selectedId,
    onSelect,
}: {
    services: IService[];
    currency: SupportedCurrency;
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="space-y-2.5">
            <p className="text-sm text-muted-foreground mb-4">
                Selecciona el servicio que deseas reservar
            </p>
            {services.map((service, i) => {
                const id = String(service._id);
                const isSelected = selectedId === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group ${
                            isSelected
                                ? 'border-primary bg-primary/[0.04] shadow-sm'
                                : 'border-border/40 hover:border-border hover:bg-muted/30'
                        }`}
                        style={{ animation: `fadeIn 0.3s ease-out ${i * 0.04}s both` }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className={`font-semibold transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-foreground'}`}>
                                        {service.name}
                                    </p>
                                    {isSelected && (
                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                {service.description && (
                                    <p className="text-sm text-muted-foreground/70 line-clamp-1 mt-0.5">
                                        {service.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Clock className="h-3 w-3 text-muted-foreground/50" />
                                    <span className="text-xs text-muted-foreground">
                                        {service.duration} min
                                    </span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className={`text-lg font-bold tabular-nums transition-colors ${
                                    isSelected ? 'text-primary' : 'text-foreground'
                                }`}>
                                    {formatCurrency(service.price, service.currency || currency)}
                                </span>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// Paso 2: Selección de profesional
// =============================================================================

function StepProfessional({
    professionals,
    selectedId,
    onSelect,
}: {
    professionals: IProfessional[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="space-y-2.5">
            <p className="text-sm text-muted-foreground mb-4">
                Elige al profesional que te atenderá
            </p>
            {professionals.map((pro, i) => {
                const id = String(pro._id);
                const isSelected = selectedId === id;
                const initials = pro.displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onSelect(id)}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group ${
                            isSelected
                                ? 'border-primary bg-primary/[0.04] shadow-sm'
                                : 'border-border/40 hover:border-border hover:bg-muted/30'
                        }`}
                        style={{ animation: `fadeIn 0.3s ease-out ${i * 0.04}s both` }}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-[background-color,color,box-shadow] ${
                                isSelected
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                            }`}>
                                {initials}
                                {isSelected && (
                                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`font-semibold transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-foreground'}`}>
                                    {pro.displayName}
                                </p>
                                {pro.specialties?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {pro.specialties.slice(0, 3).map((spec) => (
                                            <span
                                                key={spec}
                                                className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                            >
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {pro.rating > 0 && (
                                <div className="flex items-center gap-1 text-sm shrink-0">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 dark:fill-amber-300 dark:text-amber-300" />
                                    <span className="font-semibold tabular-nums">{pro.rating.toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// =============================================================================
// Paso 3: Fecha y hora
// =============================================================================

function StepDateTime({
    selectedDate,
    onDateSelect,
    selectedTime,
    onTimeSelect,
    availableSlots,
    loading,
    hasProfessional,
}: {
    selectedDate: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    selectedTime: string;
    onTimeSelect: (time: string) => void;
    availableSlots: string[];
    loading: boolean;
    hasProfessional: boolean;
}) {
    const today = startOfToday();

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-medium mb-3">Selecciona una fecha</p>
                <div className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={onDateSelect}
                        locale={es}
                        disabled={(date) => isBefore(date, today)}
                        className="rounded-xl border border-border/40"
                    />
                </div>
            </div>

            {selectedDate && hasProfessional && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <p className="text-sm font-medium">Horarios disponibles</p>
                        <Badge variant="outline" className="text-[10px] py-0 border-border/40 text-muted-foreground">
                            {format(selectedDate, "EEE d MMM", { locale: es })}
                        </Badge>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
                            <span className="text-sm">Buscando horarios...</span>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-muted/50 mb-3">
                                <Clock className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm text-muted-foreground">No hay horarios disponibles</p>
                            <p className="text-xs text-muted-foreground/50 mt-0.5">Prueba con otro día</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.map((slot, i) => (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onTimeSelect(slot)}
                                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium tabular-nums transition-[border-color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                        selectedTime === slot
                                            ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                            : 'border-border/40 text-foreground hover:border-primary/30 hover:bg-primary/[0.03]'
                                    }`}
                                    style={{ animation: `fadeIn 0.2s ease-out ${i * 0.02}s both` }}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// Paso 4: Datos del cliente
// =============================================================================

function StepClientData({
    name,
    email,
    phone,
    notes,
    onNameChange,
    onEmailChange,
    onPhoneChange,
    onNotesChange,
}: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    onNameChange: (v: string) => void;
    onEmailChange: (v: string) => void;
    onPhoneChange: (v: string) => void;
    onNotesChange: (v: string) => void;
}) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">
                Ingresa tus datos para confirmar la reserva
            </p>

            <div className="space-y-1.5">
                <Label htmlFor="booking-name" className="text-sm font-medium">
                    Nombre completo
                </Label>
                <div className="relative">
                    <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                        id="booking-name"
                        placeholder="Tu nombre completo"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        maxLength={100}
                        className="pl-10 h-11"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="booking-email" className="text-sm font-medium">
                    Email
                </Label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                        id="booking-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="booking-phone" className="text-sm font-medium">
                    Teléfono
                </Label>
                <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                        id="booking-phone"
                        type="tel"
                        placeholder="+56 9 1234 5678"
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="booking-notes" className="text-sm font-medium">
                    Notas <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                </Label>
                <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/60" />
                    <Textarea
                        id="booking-notes"
                        placeholder="Alguna indicación especial..."
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="pl-10 resize-none"
                    />
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Paso 5: Confirmación
// =============================================================================

function StepConfirmation({
    service,
    professional,
    date,
    time,
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
    currency,
}: {
    service: IService;
    professional: IProfessional;
    date: Date;
    time: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientNotes: string;
    currency: SupportedCurrency;
}) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm font-medium">
                    Revisa los detalles de tu reserva
                </p>
            </div>

            <div className="rounded-xl border-2 border-border/40 overflow-hidden">
                {/* Servicio — header destacado */}
                <div className="bg-gradient-to-r from-primary/[0.04] to-accent/[0.03] px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest">Servicio</p>
                            <p className="font-semibold mt-0.5">{service.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration} minutos
                            </p>
                        </div>
                        <div className="rounded-lg bg-primary/10 px-3 py-1.5">
                            <span className="text-sm font-bold text-primary tabular-nums">
                                {formatCurrency(service.price, service.currency || currency)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-3.5 space-y-3.5">
                    {/* Profesional */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground font-bold text-xs">
                            {professional.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest">Profesional</p>
                            <p className="font-medium text-sm">{professional.displayName}</p>
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Fecha y hora */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest">Fecha y hora</p>
                            <p className="font-medium text-sm capitalize">
                                {format(date, "EEEE d 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-xs text-primary font-semibold">{time} hrs</p>
                        </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Datos del cliente */}
                    <div>
                        <p className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-widest mb-2">Tus datos</p>
                        <div className="grid gap-1.5 text-sm">
                            <div className="flex items-center gap-2">
                                <UserCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                <span>{clientName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
                                <span className="text-muted-foreground">{clientEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground/40" />
                                <span className="text-muted-foreground">{clientPhone}</span>
                            </div>
                            {clientNotes && (
                                <div className="flex items-start gap-2 mt-1">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5" />
                                    <span className="text-muted-foreground text-xs">{clientNotes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
