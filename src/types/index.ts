/**
 * @fileoverview Tipos centrales del sistema TurnoPro.
 * Define interfaces compartidas entre frontend y backend.
 */

import type { Types } from 'mongoose';

// =============================================================================
// Enums y constantes de tipo
// =============================================================================

/** Roles del sistema */
export type UserRole = 'admin' | 'professional' | 'client';

/** Estado de la cita */
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

/** Estado del pago */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/** Método de pago */
export type PaymentMethod = 'cash' | 'card' | 'mercadopago';

/** Estado de la suscripción */
export type SubscriptionStatus = 'trial' | 'active' | 'pending' | 'cancelled' | 'expired';

/** Plan de suscripción */
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';

/** Países soportados */
export type SupportedCountry = 'CL' | 'MX';

/** Monedas soportadas */
export type SupportedCurrency = 'CLP' | 'MXN';

/** Locales soportados */
export type SupportedLocale = 'es-CL' | 'es-MX';

/** Tipo de notificación */
export type NotificationType = 'new-booking' | 'booking-cancelled' | 'booking-rescheduled' | 'booking-reminder' | 'schedule-blocked' | 'schedule-unblocked';

/** Tipo de bloqueo de agenda */
export type ScheduleBlockType = 'day' | 'week' | 'month' | 'full';

/** Origen del cliente */
export type ClientSource = 'online' | 'walk-in' | 'referral' | 'marketplace';

/** Días de la semana (0 = Domingo) */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// =============================================================================
// Interfaces de dominio
// =============================================================================

/** Horario de trabajo para un día */
export interface WorkingHour {
  dayOfWeek: DayOfWeek;
  isOpen: boolean;
  openTime: string;  // "09:00"
  closeTime: string; // "18:00"
}

/** Slot de disponibilidad */
export interface AvailableSlot {
  start: string; // "09:00"
  end: string;   // "09:45"
}

/** Horario disponible por día */
export interface DayAvailability {
  dayOfWeek: DayOfWeek;
  slots: AvailableSlot[];
}

/** Ubicación geoespacial */
export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

/** Registro de recordatorio enviado */
export interface ReminderLog {
  type: 'email';
  sentAt: Date;
  status: 'sent' | 'failed';
}

/** Historial de visitas del cliente */
export interface VisitRecord {
  appointmentId: Types.ObjectId;
  date: Date;
  serviceName: string;
  professionalName: string;
  notes?: string;
}

/** Historial de pago de suscripción */
export interface SubscriptionPaymentRecord {
  date: Date;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  mercadopagoPaymentId: string;
}

// =============================================================================
// Interfaces de documento (Mongoose)
// =============================================================================

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  preferredLocale: SupportedLocale;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusiness {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: SupportedCountry;
  location: GeoLocation;
  phone: string;
  email: string;
  website?: string;
  workingHours: WorkingHour[];
  timezone: string;
  currency: SupportedCurrency;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt?: Date;
  mercadopagoSubscriptionId?: string;
  allowOnlinePayments: boolean;
  requirePaymentUpfront: boolean;
  cancellationPolicy?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfessional {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  businessId: Types.ObjectId;
  displayName: string;
  specialties: string[];
  bio?: string;
  avatar?: string;
  services: Types.ObjectId[];
  availableHours: DayAvailability[];
  isActive: boolean;
  rating: number;
  totalReviews: number;
  showInPublicPage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClient {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  tags?: string[];
  visitHistory: VisitRecord[];
  source: ClientSource;
  totalSpent: number;
  totalVisits: number;
  lastVisit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IService {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
  currency: SupportedCurrency;
  isActive: boolean;
  image?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceCategory {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceCategorySerialized {
  _id: string;
  businessId: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAppointment {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  clientId: Types.ObjectId;
  professionalId: Types.ObjectId;
  serviceId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentAmount: number;
  mercadopagoPaymentId?: string;
  clientNotes?: string;
  professionalNotes?: string;
  cancellationReason?: string;
  remindersSent: ReminderLog[];
  rating?: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceModel?: 'Appointment' | 'Business' | 'ScheduleBlock';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  mercadopagoPreapprovalId?: string;
  startDate: Date;
  endDate?: Date;
  amount: number;
  currency: SupportedCurrency;
  paymentHistory: SubscriptionPaymentRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleBlock {
  _id: Types.ObjectId;
  professionalId: Types.ObjectId;
  businessId: Types.ObjectId;
  blockType: ScheduleBlockType;
  startDate: Date;
  endDate: Date | null;
  reason: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleBlockSerialized {
  _id: string;
  professionalId: string;
  businessId: string;
  blockType: ScheduleBlockType;
  startDate: string;
  endDate: string | null;
  reason: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// DTOs (Data Transfer Objects) para formularios y API
// =============================================================================

/** Datos para crear una cita */
export interface CreateAppointmentDTO {
  businessId: string;
  professionalId: string;
  serviceId: string;
  date: string;      // ISO date
  startTime: string; // "10:00"
  clientNotes?: string;
}

/** Datos para crear un servicio */
export interface CreateServiceDTO {
  name: string;
  description?: string;
  category: string;
  duration: number;
  price: number;
}

/** Datos para crear un profesional */
export interface CreateProfessionalDTO {
  email: string;
  name: string;
  specialties: string[];
  bio?: string;
}

/** Datos de registro de usuario */
export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

/** Filtros de búsqueda pública */
export interface SearchFilters {
  query?: string;
  specialty?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

/** Resultado de acción del servidor */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Datos de dashboard admin */
export interface DashboardMetrics {
  todayAppointments: number;
  upcomingAppointments: number;
  monthlyRevenue: number;
  occupancyRate: number;
  totalClients: number;
  totalProfessionals: number;
}

// =============================================================================
// Interfaces populated (para uso en cliente tras .populate())
// =============================================================================

/** Cita con relaciones populated — seguro para serialización al cliente */
export interface IAppointmentPopulated extends Omit<IAppointment, '_id' | 'businessId' | 'clientId' | 'professionalId' | 'serviceId' | 'date' | 'createdAt' | 'updatedAt' | 'remindersSent'> {
  _id: string;
  businessId: string;
  clientId: { _id: string; name: string; email: string; phone?: string };
  professionalId: { _id: string; displayName: string; avatar?: string };
  serviceId: { _id: string; name: string; duration: number; price: number };
  date: string;
  createdAt: string;
  updatedAt: string;
}

/** Servicio serializado — seguro para envío al cliente */
export interface IServiceSerialized extends Omit<IService, '_id' | 'businessId' | 'createdAt' | 'updatedAt'> {
  _id: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}
