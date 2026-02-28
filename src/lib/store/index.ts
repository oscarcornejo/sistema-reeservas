/**
 * @fileoverview Zustand stores del sistema TurnoPro.
 * Estado global para usuario, citas y búsqueda.
 */

import { create } from 'zustand';
import type { UserRole, IAppointment, IProfessional } from '@/types';

// =============================================================================
// User Store
// =============================================================================

interface UserState {
    /** Usuario autenticado */
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        image?: string | null;
    } | null;
    /** ID del negocio actual (admin) */
    businessId: string | null;
    /** Setear el usuario desde la sesión */
    setUser: (user: UserState['user']) => void;
    /** Setear el negocio */
    setBusinessId: (id: string | null) => void;
    /** Limpiar estado */
    clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    businessId: null,
    setUser: (user) => set({ user }),
    setBusinessId: (businessId) => set({ businessId }),
    clear: () => set({ user: null, businessId: null }),
}));

// =============================================================================
// Appointment Store
// =============================================================================

type CalendarView = 'day' | 'week' | 'month';

interface AppointmentState {
    /** Citas cargadas */
    appointments: IAppointment[];
    /** Fecha seleccionada en el calendario */
    selectedDate: Date;
    /** Modo de vista del calendario */
    viewMode: CalendarView;
    /** Cargando */
    isLoading: boolean;
    /** Setear citas */
    setAppointments: (appointments: IAppointment[]) => void;
    /** Cambiar fecha seleccionada */
    setSelectedDate: (date: Date) => void;
    /** Cambiar modo de vista */
    setViewMode: (mode: CalendarView) => void;
    /** Setear estado de carga */
    setLoading: (loading: boolean) => void;
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
    appointments: [],
    selectedDate: new Date(),
    viewMode: 'week',
    isLoading: false,
    setAppointments: (appointments) => set({ appointments }),
    setSelectedDate: (selectedDate) => set({ selectedDate }),
    setViewMode: (viewMode) => set({ viewMode }),
    setLoading: (isLoading) => set({ isLoading }),
}));

// =============================================================================
// Search Store
// =============================================================================

interface SearchState {
    /** Query de texto */
    query: string;
    /** Filtro por especialidad */
    specialty: string | null;
    /** Filtro por categoría */
    category: string | null;
    /** Ubicación del usuario/mapa */
    location: { lat: number; lng: number } | null;
    /** Radio de búsqueda en km */
    radiusKm: number;
    /** Resultados de la búsqueda */
    results: IProfessional[];
    /** Cargando */
    isLoading: boolean;
    /** Setear query */
    setQuery: (query: string) => void;
    /** Setear filtros */
    setFilters: (filters: Partial<Pick<SearchState, 'specialty' | 'category' | 'radiusKm'>>) => void;
    /** Setear ubicación */
    setLocation: (location: SearchState['location']) => void;
    /** Setear resultados */
    setResults: (results: IProfessional[]) => void;
    /** Setear carga */
    setLoading: (loading: boolean) => void;
    /** Resetear búsqueda */
    reset: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
    query: '',
    specialty: null,
    category: null,
    location: null,
    radiusKm: 10,
    results: [],
    isLoading: false,
    setQuery: (query) => set({ query }),
    setFilters: (filters) => set(filters),
    setLocation: (location) => set({ location }),
    setResults: (results) => set({ results }),
    setLoading: (isLoading) => set({ isLoading }),
    reset: () =>
        set({
            query: '',
            specialty: null,
            category: null,
            location: null,
            radiusKm: 10,
            results: [],
        }),
}));

// =============================================================================
// Notification Store
// =============================================================================

interface NotificationState {
    /** Conteo de notificaciones no leídas */
    unreadCount: number;
    /** Setear conteo */
    setUnreadCount: (count: number) => void;
    /** Decrementar conteo en 1 */
    decrementUnread: () => void;
    /** Limpiar conteo (todas leídas) */
    clearUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (unreadCount) => set({ unreadCount }),
    decrementUnread: () =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    clearUnread: () => set({ unreadCount: 0 }),
}));
