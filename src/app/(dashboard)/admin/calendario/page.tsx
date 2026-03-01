/**
 * @fileoverview Página de calendario del admin.
 * Vistas: línea de tiempo (hoy), semanal y mensual.
 */

"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
  useRef,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  ChevronsUpDown,
  Check,
  Plus,
} from "lucide-react";
import {
  getBusinessAppointments,
  getBusinessProfessionals,
} from "@/actions/appointments";
import { getScheduleBlocks } from "@/actions/schedule-blocks";
import { getBusinessSettings } from "@/actions/business";
import { getBusinessServices } from "@/actions/services";
import { createPublicBooking } from "@/actions/public-booking";
import { AppointmentDetailDialog } from "@/components/booking/AppointmentDetailDialog";
import { RescheduleDialog } from "@/components/booking/RescheduleDialog";
import { CancelDialog } from "@/components/booking/CancelDialog";
import { ScheduleBlockDialog } from "@/components/booking/ScheduleBlockDialog";
import { UnblockDialog } from "@/components/booking/UnblockDialog";
import {
  formatRelativeDate,
  APPOINTMENT_STATUS_CONFIG,
} from "@/lib/utils/format";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  addWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type {
  IAppointment,
  IAppointmentPopulated,
  IScheduleBlockSerialized,
  AppointmentStatus,
  IService,
} from "@/types";

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Colores asignados a cada profesional (ciclo de 8) */
const PROFESSIONAL_COLORS = [
  {
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  {
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    text: "text-rose-700 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    text: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
  {
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  {
    bg: "bg-pink-500/15",
    border: "border-pink-500/30",
    text: "text-pink-700 dark:text-pink-400",
    dot: "bg-pink-500",
  },
] as const;

/** Horas de trabajo (8:00 - 23:30) */
const WORK_HOURS = Array.from({ length: 16 }, (_, i) => i + 8);

/** Ancho fijo en px por hora en el timeline (150 = 30min→75px legible) */
const HOUR_WIDTH_PX = 150;

/** 8:00 en minutos desde medianoche */
const DAY_START_MINUTES = 480;

/** Ancho de la columna de nombres */
const NAME_COL_WIDTH = 180;

/** Todos los slots de 30 min: ["08:00","08:30",...,"23:00","23:30"] — 32 slots = 16h × 2 */
const HALF_HOUR_SLOTS: string[] = [];
for (const hour of WORK_HOURS) {
  const hh = String(hour).padStart(2, "0");
  HALF_HOUR_SLOTS.push(`${hh}:00`, `${hh}:30`);
}

/** Ancho en px de un slot de 30 min */
const SLOT_WIDTH_PX = HOUR_WIDTH_PX / 2;

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TimeRange = "today" | "week" | "month";

interface ProfessionalInfo {
  id: string;
  displayName: string;
  avatar?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Iniciales del nombre para fallback del avatar */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Extraer el ID del profesional de una cita (puede estar populated) */
function getProfIdFromAppointment(apt: IAppointment): string {
  if (typeof apt.professionalId === "object" && apt.professionalId !== null) {
    return (apt.professionalId as unknown as { _id: string })._id;
  }
  return String(apt.professionalId);
}

/** Color por índice global del profesional */
function getProfessionalColor(index: number) {
  return PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];
}

/** Convierte "HH:mm" a minutos desde medianoche */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Offset en px desde las 8:00 */
function minutesToPx(minutes: number): number {
  return ((minutes - DAY_START_MINUTES) / 60) * HOUR_WIDTH_PX;
}

/** Ancho en px para una duración en minutos */
function durationToPx(duration: number): number {
  return (duration / 60) * HOUR_WIDTH_PX;
}

/** Verifica si una fecha está bloqueada para un profesional */
function isDateBlocked(
  date: Date,
  profId: string,
  blocks: IScheduleBlockSerialized[],
): IScheduleBlockSerialized | null {
  for (const block of blocks) {
    if (block.professionalId !== profId) continue;
    const blockStart = new Date(block.startDate);
    if (block.endDate === null) {
      // Bloqueo 'full': desde startDate en adelante
      if (date >= blockStart) return block;
    } else {
      const blockEnd = new Date(block.endDate);
      if (date >= blockStart && date <= blockEnd) return block;
    }
  }
  return null;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function CalendarPage() {
  // Estado core
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalInfo[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);

  // Estado de vista
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedProfessionals, setSelectedProfessionals] = useState<
    Set<string>
  >(new Set());
  // Quick booking
  const [businessId, setBusinessId] = useState("");
  const [services, setServices] = useState<IService[]>([]);
  const [quickBookOpen, setQuickBookOpen] = useState(false);
  const [quickBookPrefill, setQuickBookPrefill] = useState<{
    professionalId: string;
    professionalName: string;
    startTime: string;
  } | null>(null);

  // Appointment detail / reschedule / cancel
  const [selectedAppointment, setSelectedAppointment] =
    useState<IAppointmentPopulated | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Schedule blocks
  const [scheduleBlocks, setScheduleBlocks] = useState<IScheduleBlockSerialized[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<IScheduleBlockSerialized | null>(null);

  // ─── Carga de datos ──────────────────────────────────────────────────────

  useEffect(() => {
    async function loadInitialData() {
      const [profResult, bizResult, svcResult] = await Promise.all([
        getBusinessProfessionals(),
        getBusinessSettings(),
        getBusinessServices(),
      ]);
      if (profResult.success && profResult.data) {
        setProfessionals(profResult.data);
        setSelectedProfessionals(new Set(profResult.data.map((p) => p.id)));
      } else {
        toast.error(profResult.error || "Error al cargar profesionales");
      }
      if (bizResult.success && bizResult.data) {
        // serialize() convierte _id ObjectId a string
        setBusinessId(String(bizResult.data._id || ""));
      }
      if (svcResult.success && svcResult.data) {
        setServices(svcResult.data.filter((s) => s.isActive));
      }
      setIsLoadingProfessionals(false);
    }
    loadInitialData();
  }, []);

  const loadAppointments = useCallback(() => {
    let start: string;
    let end: string;

    if (timeRange === "month") {
      start = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      end = format(endOfMonth(selectedDate), "yyyy-MM-dd");
    } else if (timeRange === "week") {
      start = format(
        startOfWeek(selectedDate, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      end = format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    } else {
      const dayStr = format(selectedDate, "yyyy-MM-dd");
      start = dayStr;
      end = dayStr;
    }

    startTransition(async () => {
      const [aptsResult, blocksResult] = await Promise.all([
        getBusinessAppointments(start, end),
        getScheduleBlocks(undefined, start, end),
      ]);
      if (aptsResult.success && aptsResult.data) {
        setAppointments(aptsResult.data);
      } else {
        toast.error(aptsResult.error || "Error al cargar citas");
      }
      if (blocksResult.success && blocksResult.data) {
        setScheduleBlocks(blocksResult.data);
      }
    });
  }, [selectedDate, timeRange]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // ─── Datos derivados ─────────────────────────────────────────────────────

  const visibleProfessionals = useMemo(
    () => professionals.filter((p) => selectedProfessionals.has(p.id)),
    [professionals, selectedProfessionals],
  );

  const dayAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return (
          aptDate.getFullYear() === selectedDate.getFullYear() &&
          aptDate.getMonth() === selectedDate.getMonth() &&
          aptDate.getDate() === selectedDate.getDate()
        );
      }),
    [appointments, selectedDate],
  );

  // Citas según el rango temporal activo
  const contextAppointments = useMemo(() => {
    const baseAppointments =
      timeRange === "today" ? dayAppointments : appointments;
    return baseAppointments.filter((apt) =>
      selectedProfessionals.has(getProfIdFromAppointment(apt)),
    );
  }, [dayAppointments, appointments, timeRange, selectedProfessionals]);

  const confirmedCount = contextAppointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCount = contextAppointments.filter(
    (a) => a.status === "pending",
  ).length;

  // Conteo de citas por profesional (para pills y sidebar)
  const appointmentCountByProf = useMemo(() => {
    const map = new Map<string, number>();
    for (const apt of dayAppointments) {
      const profId = getProfIdFromAppointment(apt);
      map.set(profId, (map.get(profId) ?? 0) + 1);
    }
    return map;
  }, [dayAppointments]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const toggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedProfessionals.size === professionals.length) {
      setSelectedProfessionals(new Set());
    } else {
      setSelectedProfessionals(new Set(professionals.map((p) => p.id)));
    }
  };

  // ─── Quick book handler ─────────────────────────────────────────────────

  const handleTrackClick = useCallback(
    (professionalId: string, professionalName: string, startTime: string) => {
      setQuickBookPrefill({ professionalId, professionalName, startTime });
      setQuickBookOpen(true);
    },
    [],
  );

  // ─── Appointment interaction handlers ─────────────────────────────────

  const handleAppointmentClick = useCallback(
    (apt: IAppointmentPopulated) => {
      setSelectedAppointment(apt);
      setDetailOpen(true);
    },
    [],
  );

  const handleReschedule = useCallback((apt: IAppointmentPopulated) => {
    setDetailOpen(false);
    setSelectedAppointment(apt);
    setRescheduleOpen(true);
  }, []);

  const handleCancel = useCallback((apt: IAppointmentPopulated) => {
    setDetailOpen(false);
    setSelectedAppointment(apt);
    setCancelOpen(true);
  }, []);

  const handleActionSuccess = useCallback(() => {
    setDetailOpen(false);
    setRescheduleOpen(false);
    setCancelOpen(false);
    setSelectedAppointment(null);
    loadAppointments();
  }, [loadAppointments]);

  // ─── Render ──────────────────────────────────────────────────────────────

  const isLoading = isPending || isLoadingProfessionals;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-background to-blue-500/6 border border-border/50 p-6"
        style={{ animation: "fadeIn 0.4s ease-out" }}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/6 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                <CalendarDays className="h-7 w-7 text-primary" />
                Calendario
              </h1>
              <p className="text-muted-foreground">
                {timeRange === "today" ? (
                  <>
                    {formatRelativeDate(selectedDate)} —{" "}
                    <span className="capitalize">
                      {format(selectedDate, "EEEE dd 'de' MMMM", {
                        locale: es,
                      })}
                    </span>
                  </>
                ) : timeRange === "week" ? (
                  (() => {
                    const wStart = startOfWeek(selectedDate, {
                      weekStartsOn: 1,
                    });
                    const wEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
                    return (
                      <span className="capitalize">
                        Semana del {format(wStart, "d", { locale: es })} al{" "}
                        {format(wEnd, "d 'de' MMMM", { locale: es })}
                      </span>
                    );
                  })()
                ) : (
                  <span className="capitalize">
                    {format(selectedDate, "MMMM yyyy", { locale: es })}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/60 text-destructive hover:text-destructive"
                onClick={() => setBlockDialogOpen(true)}
              >
                <Ban className="h-4 w-4" />
                <span className="hidden sm:inline">Bloquear agenda</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-border/60"
                onClick={() =>
                  setSelectedDate((d) =>
                    timeRange === "month"
                      ? addMonths(d, -1)
                      : timeRange === "week"
                        ? addWeeks(d, -1)
                        : addDays(d, -1),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  isToday(selectedDate) && timeRange === "today"
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={
                  isToday(selectedDate) && timeRange === "today"
                    ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    : "border-border/60"
                }
                onClick={() => {
                  setSelectedDate(new Date());
                  setTimeRange("today");
                }}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-border/60"
                onClick={() =>
                  setSelectedDate((d) =>
                    timeRange === "month"
                      ? addMonths(d, 1)
                      : timeRange === "week"
                        ? addWeeks(d, 1)
                        : addDays(d, 1),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs de rango temporal (solo desktop) */}
          <div className="hidden lg:block">
            <Tabs
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as TimeRange)}
            >
              <TabsList variant="line">
                <TabsTrigger value="today">Hoy</TabsTrigger>
                <TabsTrigger value="week">Semana</TabsTrigger>
                <TabsTrigger value="month">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ── Sidebar (oculta en mobile por grid) ── */}
        <div
          className="hidden lg:flex flex-col gap-4"
          style={{ animation: "fadeIn 0.4s ease-out 0.05s both" }}
        >
          {/* Selector de profesionales (multi-select compacto) */}
          <Card className="relative overflow-hidden border-border/50">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500 to-blue-500/40" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                Profesionales
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {isLoadingProfessionals ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : professionals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  No hay profesionales activos
                </p>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto min-h-9 px-3 py-2 border-border/60"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {selectedProfessionals.size === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            Seleccionar...
                          </span>
                        ) : selectedProfessionals.size ===
                          professionals.length ? (
                          <>
                            <div className="flex items-center -space-x-0.5">
                              {professionals.slice(0, 5).map((p, i) => (
                                <div
                                  key={p.id}
                                  className={`h-2.5 w-2.5 rounded-full ${getProfessionalColor(i).dot} ring-1 ring-background`}
                                />
                              ))}
                            </div>
                            <span className="text-sm">
                              Todos ({professionals.length})
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center -space-x-0.5">
                              {professionals
                                .filter((p) => selectedProfessionals.has(p.id))
                                .slice(0, 5)
                                .map((p) => {
                                  const idx = professionals.indexOf(p);
                                  return (
                                    <div
                                      key={p.id}
                                      className={`h-2.5 w-2.5 rounded-full ${getProfessionalColor(idx).dot} ring-1 ring-background`}
                                    />
                                  );
                                })}
                            </div>
                            <span className="text-sm">
                              {selectedProfessionals.size} seleccionados
                            </span>
                          </>
                        )}
                      </div>
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-[var(--radix-popover-trigger-width)]"
                    align="start"
                  >
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {/* Toggle todos */}
                          <CommandItem
                            onSelect={toggleAll}
                            className="text-xs font-medium text-muted-foreground"
                          >
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                selectedProfessionals.size ===
                                professionals.length
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-input"
                              }`}
                            >
                              {selectedProfessionals.size ===
                                professionals.length && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            {selectedProfessionals.size === professionals.length
                              ? "Deseleccionar todos"
                              : "Seleccionar todos"}
                          </CommandItem>
                          {/* Profesionales */}
                          {professionals.map((prof, index) => {
                            const color = getProfessionalColor(index);
                            const isSelected = selectedProfessionals.has(
                              prof.id,
                            );
                            const count =
                              appointmentCountByProf.get(prof.id) ?? 0;
                            return (
                              <CommandItem
                                key={prof.id}
                                onSelect={() => toggleProfessional(prof.id)}
                              >
                                <div
                                  className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                    isSelected
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-input"
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                <div
                                  className={`h-2 w-2 rounded-full ${color.dot}`}
                                />
                                <span className="flex-1 truncate">
                                  {prof.displayName}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {count}
                                </span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <CalendarWidget
                locale={es}
                mode="single"
                selected={selectedDate}
                month={selectedDate}
                onMonthChange={setSelectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          {/* Resumen del día */}
          <Card className="relative overflow-hidden border-border/50">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent/40" />
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {timeRange === "week"
                  ? "Resumen de la semana"
                  : timeRange === "month"
                    ? "Resumen del mes"
                    : "Resumen del día"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Total citas
                </span>
                <span className="text-lg font-bold">
                  {contextAppointments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Confirmadas
                </span>
                <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0">
                  {confirmedCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Pendientes
                </span>
                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0">
                  {pendingCount}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Timeline ── */}
        <Card
          className="border-border/50 overflow-hidden pb-0 gap-0"
          style={{ animation: "fadeIn 0.4s ease-out 0.1s both" }}
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400/40" />

          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                <p className="text-sm text-muted-foreground">
                  Cargando citas...
                </p>
              </div>
            ) : professionals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Users className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">
                  No hay profesionales activos en tu negocio
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Agrega profesionales desde la sección de equipo
                </p>
              </div>
            ) : timeRange === "week" ? (
              <WeekView
                appointments={appointments}
                selectedDate={selectedDate}
                professionals={professionals}
                scheduleBlocks={scheduleBlocks}
                onDayClick={(day) => {
                  setTimeRange("today");
                  setSelectedDate(day);
                }}
                onAppointmentClick={handleAppointmentClick}
              />
            ) : timeRange === "month" ? (
              <MonthView
                appointments={appointments}
                selectedDate={selectedDate}
                professionals={professionals}
                scheduleBlocks={scheduleBlocks}
                onDayClick={(day) => {
                  setTimeRange("today");
                  setSelectedDate(day);
                }}
                onAppointmentClick={handleAppointmentClick}
              />
            ) : visibleProfessionals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Users className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground text-sm">
                  Ningún profesional seleccionado
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Activa al menos un profesional en el panel lateral
                </p>
              </div>
            ) : (
              <ResourceTimelineView
                professionals={professionals}
                visibleProfessionals={visibleProfessionals}
                dayAppointments={dayAppointments}
                selectedDate={selectedDate}
                scheduleBlocks={scheduleBlocks}
                onTrackClick={handleTrackClick}
                onAppointmentClick={handleAppointmentClick}
                onBlockClick={(block) => {
                  setSelectedBlock(block);
                  setUnblockDialogOpen(true);
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick booking dialog */}
      <QuickBookDialog
        open={quickBookOpen}
        onOpenChange={setQuickBookOpen}
        businessId={businessId}
        services={services}
        professionals={professionals}
        prefill={quickBookPrefill}
        selectedDate={selectedDate}
        onSuccess={() => {
          setQuickBookOpen(false);
          loadAppointments();
        }}
      />

      {/* Appointment detail / reschedule / cancel dialogs */}
      <AppointmentDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        appointment={selectedAppointment}
        userRole="admin"
        onReschedule={handleReschedule}
        onCancel={handleCancel}
      />
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={selectedAppointment}
        onSuccess={handleActionSuccess}
      />
      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={selectedAppointment}
        onSuccess={handleActionSuccess}
      />
      <ScheduleBlockDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        professionals={professionals}
        selectedDate={selectedDate}
        userRole="admin"
        onSuccess={() => {
          setBlockDialogOpen(false);
          loadAppointments();
        }}
      />
      <UnblockDialog
        open={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        block={selectedBlock}
        onSuccess={() => {
          setUnblockDialogOpen(false);
          setSelectedBlock(null);
          loadAppointments();
        }}
      />
    </div>
  );
}

// ─── Vista semanal (7 columnas lunes-domingo) ───────────────────────────────

function WeekView({
  appointments,
  selectedDate,
  professionals,
  scheduleBlocks,
  onDayClick,
  onAppointmentClick,
}: {
  appointments: IAppointment[];
  selectedDate: Date;
  professionals: ProfessionalInfo[];
  scheduleBlocks: IScheduleBlockSerialized[];
  onDayClick: (day: Date) => void;
  onAppointmentClick?: (apt: IAppointmentPopulated) => void;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="p-2 sm:p-4" style={{ animation: "fadeIn 0.25s ease-out" }}>
      <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/40">
        {days.map((day) => {
          const dayApts = appointments.filter((apt) =>
            isSameDay(new Date(apt.date), day),
          );
          const today = isToday(day);
          const hasBlocked = professionals.some(
            (p) => isDateBlocked(day, p.id, scheduleBlocks) !== null,
          );

          return (
            <div
              key={day.toISOString()}
              className={`bg-card flex flex-col cursor-pointer hover:bg-muted/40 transition-colors ${hasBlocked ? "bg-red-500/[0.03]" : ""}`}
              onClick={() => onDayClick(day)}
            >
              {/* Header del día */}
              <div
                className={`sticky top-0 bg-card border-b border-border/40 px-2 py-2.5 text-center ${today ? "bg-primary/5" : ""}`}
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {format(day, "EEE", { locale: es })}
                </span>
                <span
                  className={`block text-lg font-bold mt-0.5 ${today ? "text-primary" : "text-foreground"}`}
                >
                  {format(day, "d")}
                </span>
                {dayApts.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {dayApts.length} {dayApts.length === 1 ? "cita" : "citas"}
                  </span>
                )}
                {hasBlocked && (
                  <span className="flex items-center justify-center gap-0.5 text-[10px] text-red-500">
                    <Ban className="h-2.5 w-2.5" />
                    Bloqueado
                  </span>
                )}
              </div>
              {/* Citas del día */}
              <div className="p-1.5 space-y-1 min-h-[120px] flex-1">
                {dayApts.map((apt) => {
                  const profId = getProfIdFromAppointment(apt);
                  const profIdx = professionals.findIndex(
                    (p) => p.id === profId,
                  );
                  const color = getProfessionalColor(
                    profIdx >= 0 ? profIdx : 0,
                  );
                  const statusConfig =
                    APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];
                  const clientName =
                    (apt.clientId as unknown as { name: string })?.name ||
                    "Cliente";

                  return (
                    <div
                      key={apt._id.toString()}
                      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md ${color.bg} ${color.border} border text-[11px] leading-tight cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt as unknown as IAppointmentPopulated);
                      }}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusConfig.dot}`}
                      />
                      <span
                        className={`font-semibold tabular-nums ${color.text}`}
                      >
                        {apt.startTime}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {clientName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vista mensual (grilla de calendario) ────────────────────────────────────

function MonthView({
  appointments,
  selectedDate,
  professionals,
  scheduleBlocks,
  onDayClick,
  onAppointmentClick,
}: {
  appointments: IAppointment[];
  selectedDate: Date;
  professionals: ProfessionalInfo[];
  scheduleBlocks: IScheduleBlockSerialized[];
  onDayClick: (day: Date) => void;
  onAppointmentClick?: (apt: IAppointmentPopulated) => void;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="p-2 sm:p-4" style={{ animation: "fadeIn 0.25s ease-out" }}>
      <div className="grid grid-cols-7 gap-px bg-border/20 rounded-lg overflow-hidden border border-border/40">
        {/* Header: días de la semana */}
        {DAY_LABELS.map((d, i) => (
          <div
            key={i}
            className="bg-card text-center py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40"
          >
            {d}
          </div>
        ))}
        {/* Celdas de día */}
        {days.map((day) => {
          const dayApts = appointments.filter((apt) =>
            isSameDay(new Date(apt.date), day),
          );
          const inMonth = isSameMonth(day, selectedDate);
          const today = isToday(day);
          const hasBlocked = professionals.some(
            (p) => isDateBlocked(day, p.id, scheduleBlocks) !== null,
          );

          return (
            <div
              key={day.toISOString()}
              className={`bg-card min-h-[100px] p-1.5 cursor-pointer hover:bg-muted/40 transition-colors ${!inMonth ? "opacity-40" : ""} ${hasBlocked && inMonth ? "bg-red-500/[0.03]" : ""}`}
              onClick={() => onDayClick(day)}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`inline-flex items-center justify-center text-sm font-medium h-6 min-w-6 ${today ? "bg-primary text-primary-foreground rounded-full px-1.5" : ""}`}
                >
                  {format(day, "d")}
                </span>
                {hasBlocked && inMonth && <Ban className="h-3 w-3 text-red-500/60" />}
              </div>
              {/* Indicadores de citas */}
              {dayApts.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayApts.slice(0, 3).map((apt) => {
                    const profId = getProfIdFromAppointment(apt);
                    const profIdx = professionals.findIndex(
                      (p) => p.id === profId,
                    );
                    const color = getProfessionalColor(
                      profIdx >= 0 ? profIdx : 0,
                    );
                    const clientName =
                      (apt.clientId as unknown as { name: string })?.name ||
                      "Cliente";

                    return (
                      <div
                        key={apt._id.toString()}
                        className="flex items-center gap-1 text-[10px] leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(apt as unknown as IAppointmentPopulated);
                        }}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full shrink-0 ${color.dot}`}
                        />
                        <span className="truncate text-muted-foreground">
                          {apt.startTime} {clientName}
                        </span>
                      </div>
                    );
                  })}
                  {dayApts.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/70 pl-3">
                      +{dayApts.length - 3} más
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Resource Timeline (filas horizontales por profesional) ──────────────────

/** Altura de cada fila de profesional */
const ROW_HEIGHT = 80;

function ResourceTimelineView({
  professionals,
  visibleProfessionals,
  dayAppointments,
  selectedDate,
  scheduleBlocks,
  onTrackClick,
  onAppointmentClick,
  onBlockClick,
}: {
  professionals: ProfessionalInfo[];
  visibleProfessionals: ProfessionalInfo[];
  dayAppointments: IAppointment[];
  selectedDate: Date;
  scheduleBlocks: IScheduleBlockSerialized[];
  onTrackClick?: (
    professionalId: string,
    professionalName: string,
    startTime: string,
  ) => void;
  onAppointmentClick?: (apt: IAppointmentPopulated) => void;
  onBlockClick?: (block: IScheduleBlockSerialized) => void;
}) {
  const totalWidth = WORK_HOURS.length * HOUR_WIDTH_PX;
  const isTodaySelected = isToday(selectedDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Minuto actual para la línea "ahora"
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    if (!isTodaySelected) return;
    const interval = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, [isTodaySelected]);

  const nowInRange =
    isTodaySelected &&
    nowMinutes >= DAY_START_MINUTES &&
    nowMinutes <= DAY_START_MINUTES + WORK_HOURS.length * 60;
  const nowPx = nowInRange ? minutesToPx(nowMinutes) : 0;

  // Auto-scroll para centrar la línea "ahora"
  useEffect(() => {
    if (!nowInRange || !scrollRef.current) return;
    const container = scrollRef.current;
    const scrollTarget = nowPx + NAME_COL_WIDTH - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, scrollTarget);
  }, [nowInRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowTimeLabel = `${String(Math.floor(nowMinutes / 60)).padStart(2, '0')}:${String(nowMinutes % 60).padStart(2, '0')}`;

  // Click handler directo por slot — recibe el tiempo exacto del slot
  const handleSlotClick = useCallback(
    (prof: ProfessionalInfo, slotTime: string) => {
      onTrackClick?.(prof.id, prof.displayName, slotTime);
    },
    [onTrackClick],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={scrollRef}
        className="overflow-auto flex-1"
        style={{ animation: "fadeIn 0.25s ease-out" }}
      >
        {/* ── Header: etiquetas de hora ── */}
        <div
          className="flex sticky top-0 z-20 bg-card border-b border-border/40"
          style={{ minWidth: NAME_COL_WIDTH + totalWidth }}
        >
          {/* Spacer para columna de nombres */}
          <div
            className="shrink-0 sticky left-0 z-30 bg-card border-r border-border/40"
            style={{ width: NAME_COL_WIDTH }}
          />
          {/* Etiquetas de hora con bordes por slot */}
          <div className="relative" style={{ width: totalWidth, height: 40 }}>
            {/* Slot divs con bordes alineados al track */}
            {HALF_HOUR_SLOTS.map((slotTime, slotIdx) => (
              <div
                key={slotTime}
                className={`absolute top-0 bottom-0 ${
                  slotIdx % 2 === 0
                    ? "border-l border-border/40"
                    : "border-l border-border/15"
                }`}
                style={{
                  left: slotIdx * SLOT_WIDTH_PX,
                  width: SLOT_WIDTH_PX,
                }}
              />
            ))}
            {/* Etiquetas de texto */}
            {WORK_HOURS.map((hour, i) => (
              <div
                key={hour}
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ left: i * HOUR_WIDTH_PX, width: HOUR_WIDTH_PX }}
              >
                {/* Etiqueta :00 */}
                <div className="absolute top-0 bottom-0 flex items-end pb-1.5 left-0">
                  <span
                    className={`text-[11px] tabular-nums pl-2 select-none ${
                      hour === 12
                        ? "font-bold text-foreground"
                        : hour % 2 === 0
                          ? "font-semibold text-muted-foreground"
                          : "font-medium text-muted-foreground/60"
                    }`}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </div>
                {/* Etiqueta :30 */}
                <div
                  className="absolute top-0 bottom-0 flex items-end pb-1.5"
                  style={{ left: SLOT_WIDTH_PX }}
                >
                  <span className="text-[10px] tabular-nums pl-1 select-none text-muted-foreground/40">
                    {String(hour).padStart(2, "0")}:30
                  </span>
                </div>
              </div>
            ))}
            {/* Línea "ahora" en header */}
            {nowInRange && (
              <>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                  style={{ left: nowPx - 0.5 }}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute top-0 z-10 h-3 w-3 rounded-full bg-primary -translate-x-1/2 shadow-sm shadow-primary/30 cursor-help"
                      style={{ left: nowPx }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-semibold">{nowTimeLabel} — Hora actual</p>
                    <p className="text-muted-foreground">Indicador de la hora en tiempo real</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* ── Filas de profesionales ── */}
        {visibleProfessionals.map((prof, rowIdx) => {
          const globalIdx = professionals.findIndex((p) => p.id === prof.id);
          const color = getProfessionalColor(globalIdx);
          const profAppointments = dayAppointments.filter(
            (apt) => getProfIdFromAppointment(apt) === prof.id,
          );
          const blockedBlock = isDateBlocked(selectedDate, prof.id, scheduleBlocks);

          return (
            <div
              key={prof.id}
              className={`flex border-b border-border/30 group/row ${rowIdx % 2 === 1 ? "bg-muted/[0.025]" : ""}`}
              style={{ minWidth: NAME_COL_WIDTH + totalWidth }}
            >
              {/* Label: nombre fijado a la izquierda con identity stripe */}
              <div
                className="shrink-0 sticky left-0 z-10 bg-card border-r border-border/40 flex items-center gap-2.5 px-3 group-hover/row:bg-muted/40 transition-colors relative"
                style={{ width: NAME_COL_WIDTH, height: ROW_HEIGHT }}
              >
                {/* Identity stripe */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full ${color.dot}`}
                />
                <Avatar size="sm">
                  {prof.avatar && (
                    <AvatarImage src={prof.avatar} alt={prof.displayName} />
                  )}
                  <AvatarFallback
                    className={`text-[10px] ${color.bg} ${color.text}`}
                  >
                    {getInitials(prof.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {prof.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {profAppointments.length}{" "}
                    {profAppointments.length === 1 ? "cita" : "citas"}
                  </p>
                </div>
              </div>

              {/* Track: slots de 30 min individuales + bloques de citas */}
              <div
                className="relative"
                style={{ width: totalWidth, height: ROW_HEIGHT }}
              >
                {/* Slots clickeables de 30 min */}
                {HALF_HOUR_SLOTS.map((slotTime, slotIdx) => (
                  <div
                    key={slotTime}
                    className={`absolute top-0 bottom-0 cursor-pointer transition-colors hover:bg-primary/[0.06] active:bg-primary/[0.10] ${
                      slotIdx % 2 === 0
                        ? "border-l border-border/40"
                        : "border-l border-border/15"
                    }`}
                    style={{
                      left: slotIdx * SLOT_WIDTH_PX,
                      width: SLOT_WIDTH_PX,
                    }}
                    onClick={() => handleSlotClick(prof, slotTime)}
                  />
                ))}

                {/* Bloques de citas (encima de los slots) */}
                {profAppointments.map((apt) => (
                  <AppointmentBlock
                    key={apt._id.toString()}
                    appointment={apt as unknown as IAppointmentPopulated}
                    color={color}
                    onClick={onAppointmentClick}
                  />
                ))}

                {/* Overlay de bloqueo */}
                {blockedBlock && (
                  <div
                    className="absolute inset-0 z-[5] flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background:
                        "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.08) 4px, rgba(239,68,68,0.08) 8px)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlockClick?.(blockedBlock);
                    }}
                  >
                    <Ban className="h-4 w-4 text-red-500/60" />
                    <span className="text-xs font-medium text-red-500/70">
                      Bloqueado
                    </span>
                  </div>
                )}

                {/* Línea "ahora" */}
                {nowInRange && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                    style={{ left: nowPx - 0.5 }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Empty state dentro del timeline */}
        {visibleProfessionals.length > 0 && dayAppointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CalendarDays className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">
              Sin citas para este día
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Bloque de cita posicionado absolutamente ────────────────────────────────

/** Umbral en px para mostrar contenido medio (hora + servicio) */
const BLOCK_EXPANDED_THRESHOLD = 70;

/** Umbral en px para mostrar contenido completo (hora + servicio + cliente) */
const WIDE_BLOCK_THRESHOLD = 120;

function AppointmentBlock({
  appointment: apt,
  color,
  onClick,
}: {
  appointment: IAppointmentPopulated;
  color: (typeof PROFESSIONAL_COLORS)[number];
  onClick?: (apt: IAppointmentPopulated) => void;
}) {
  const startMin = timeToMinutes(apt.startTime);
  const left = minutesToPx(startMin);
  const width = durationToPx(apt.duration);
  const statusConfig =
    APPOINTMENT_STATUS_CONFIG[apt.status as AppointmentStatus];

  const clientName = apt.clientId?.name || "Cliente";
  const serviceName = apt.serviceId?.name || "Servicio";
  const servicePrice = apt.serviceId?.price;
  const effectiveWidth = Math.max(width, 28);
  const isExpanded = effectiveWidth >= BLOCK_EXPANDED_THRESHOLD;
  const isWide = effectiveWidth >= WIDE_BLOCK_THRESHOLD;

  const isReduced =
    apt.status === "completed" ||
    apt.status === "cancelled" ||
    apt.status === "no-show";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`absolute top-1.5 bottom-1.5 rounded-lg overflow-hidden cursor-pointer transition-all
                        bg-card border ${color.border}
                        ${apt.status === "pending" ? "border-dashed" : ""}
                        ${apt.status === "in-progress" ? "ring-2 ring-primary/25" : ""}
                        ${isReduced ? "opacity-60" : ""}
                        shadow-sm hover:shadow-md hover:z-20 hover:scale-[1.02]`}
          style={{ left, width: effectiveWidth }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(apt);
          }}
        >
          {/* Color tint overlay — makes block identifiable by professional */}
          <div className={`absolute inset-0 ${color.bg} pointer-events-none`} />

          {/* Status bar left edge */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.dot}`}
          />

          {isWide ? (
            <div className="relative pl-3 pr-2 py-1 h-full flex flex-col justify-center min-w-0">
              <p
                className={`text-[11px] font-bold tabular-nums leading-tight flex items-center gap-1.5 ${color.text}`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`}
                />
                {apt.startTime} – {apt.endTime}
              </p>
              <p className="text-[10px] font-semibold text-foreground/90 truncate leading-tight mt-0.5">
                {serviceName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                {clientName}
              </p>
            </div>
          ) : isExpanded ? (
            <div className="relative pl-3 pr-1.5 py-1.5 h-full flex flex-col justify-center min-w-0">
              <p
                className={`text-[11px] font-bold tabular-nums leading-tight flex items-center gap-1 ${color.text}`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dot} shrink-0`}
                />
                {apt.startTime}
              </p>
              <p className="text-[10px] font-medium text-foreground/80 truncate leading-tight mt-0.5">
                {serviceName}
              </p>
            </div>
          ) : (
            <div className="relative pl-3 pr-1 h-full flex items-center min-w-0">
              <p
                className={`text-[10px] font-bold tabular-nums leading-none ${color.text}`}
              >
                {apt.startTime}
              </p>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[260px] bg-popover text-popover-foreground border border-border shadow-lg p-3"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-xs tabular-nums">
              {apt.startTime} – {apt.endTime}
            </span>
            <Badge
              className={`text-[9px] px-1.5 py-0 h-4 border-0 ${statusConfig.color}`}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <div className="h-px bg-border/50" />
          <div className="space-y-1 text-[11px]">
            <p className="flex items-center gap-1.5">
              <Scissors className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="font-medium">{serviceName}</span>
              {servicePrice != null && (
                <span className="ml-auto text-muted-foreground tabular-nums">
                  ${servicePrice.toLocaleString()}
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
              {clientName}
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
              {apt.duration} min
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Diálogo de reserva rápida ──────────────────────────────────────────────

/** Calcula hora fin sumando duración a HH:mm */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + durationMinutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function QuickBookDialog({
  open,
  onOpenChange,
  businessId,
  services,
  professionals,
  prefill,
  selectedDate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  services: IService[];
  professionals: ProfessionalInfo[];
  prefill: {
    professionalId: string;
    professionalName: string;
    startTime: string;
  } | null;
  selectedDate: Date;
  onSuccess: () => void;
}) {
  const [professionalId, setProfessionalId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar con valores pre-filled al abrir
  useEffect(() => {
    if (open && prefill) {
      setProfessionalId(prefill.professionalId);
      setBookingDate(format(selectedDate, "yyyy-MM-dd"));
      setStartTime(prefill.startTime);
      setServiceId("");
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientNotes("");
    }
  }, [open, prefill, selectedDate]);

  const selectedService = services.find((s) => String(s._id) === serviceId);
  const endTimeStr =
    selectedService && startTime
      ? calculateEndTime(startTime, selectedService.duration)
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !professionalId ||
      !bookingDate ||
      !startTime ||
      !serviceId ||
      !clientName ||
      !clientEmail ||
      !clientPhone
    )
      return;

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("businessId", businessId);
      fd.set("professionalId", professionalId);
      fd.set("serviceId", serviceId);
      fd.set("date", bookingDate);
      fd.set("startTime", startTime);
      fd.set("clientName", clientName);
      fd.set("clientEmail", clientEmail);
      fd.set("clientPhone", clientPhone);
      if (clientNotes) fd.set("clientNotes", clientNotes);

      const result = await createPublicBooking(fd);
      if (result.success) {
        toast.success("Cita creada exitosamente");
        onSuccess();
      } else {
        toast.error(result.error || "Error al crear la cita");
      }
    } catch {
      toast.error("Error inesperado al crear la cita");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!prefill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nueva cita
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profesional */}
          <div className="space-y-1.5">
            <Label htmlFor="qb-prof">Profesional *</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger id="qb-prof">
                <SelectValue placeholder="Seleccionar profesional..." />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="qb-date">Fecha *</Label>
              <Input
                id="qb-date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qb-time">Hora de inicio *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="qb-time">
                  <SelectValue placeholder="Seleccionar hora..." />
                </SelectTrigger>
                <SelectContent>
                  {HALF_HOUR_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Servicio */}
          <div className="space-y-1.5">
            <Label htmlFor="qb-service">Servicio *</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="qb-service">
                <SelectValue placeholder="Seleccionar servicio..." />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => {
                  const sid = String(svc._id);
                  return (
                    <SelectItem key={sid} value={sid}>
                      {svc.name} — {svc.duration} min · $
                      {svc.price.toLocaleString()}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {endTimeStr && (
              <p className="text-xs text-muted-foreground">
                Horario: {startTime} – {endTimeStr} ({selectedService?.duration}{" "}
                min)
              </p>
            )}
          </div>

          {/* Datos del cliente */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="qb-name">Nombre del cliente *</Label>
              <Input
                id="qb-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="María García"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qb-email">Email *</Label>
              <Input
                id="qb-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="cliente@email.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qb-phone">Teléfono *</Label>
              <Input
                id="qb-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Notas opcionales */}
          <div className="space-y-1.5">
            <Label htmlFor="qb-notes">Notas (opcional)</Label>
            <Input
              id="qb-notes"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Preferencias, indicaciones..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !professionalId ||
                !bookingDate ||
                !startTime ||
                !serviceId ||
                !clientName ||
                !clientEmail ||
                !clientPhone
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear cita"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
