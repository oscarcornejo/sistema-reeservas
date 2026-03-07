/**
 * @fileoverview Definiciones de temas visuales para páginas públicas de negocios.
 * Cada tema define colores que se aplican como CSS custom properties,
 * sobrescribiendo los tokens de diseño dentro de la página del negocio.
 */

import type { BusinessThemeId } from '@/types';
import type { CSSProperties } from 'react';

/** Colores de un tema de negocio */
interface ThemeColors {
  /** Color principal (botones, links, acentos) */
  primary: string;
  /** Fondo general de la página */
  background: string;
  /** Superficie de tarjetas */
  card: string;
  /** Fondo de elementos sutiles / muted */
  muted: string;
  /** Texto sobre fondo muted */
  mutedForeground: string;
  /** Bordes */
  border: string;
  /** Texto principal */
  foreground: string;
  /** Texto sobre color primary */
  primaryForeground: string;
  /** Color de acento secundario */
  accent: string;
  /** Anillo de enfoque */
  ring: string;
}

/** Definición completa de un tema */
export interface ThemeDefinition {
  id: BusinessThemeId;
  label: string;
  description: string;
  emoji: string;
  colors: ThemeColors;
}

/** IDs de temas válidos (para enum de Mongoose) */
export const BUSINESS_THEME_IDS: BusinessThemeId[] = [
  'salud',
  'barberia',
  'estetica',
  'naturaleza',
  'hospedaje',
  'fitness',
];

/** Tokens globales compartidos entre todos los temas */
const SHARED = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  foreground: '#0F172A',
  primaryForeground: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
} as const;

/** Los 6 temas predefinidos */
export const BUSINESS_THEMES: ThemeDefinition[] = [
  {
    id: 'salud',
    label: 'Azul Médico',
    description: 'Profesional y confiable — ideal para consultorios y clínicas',
    emoji: '🩺',
    colors: {
      ...SHARED,
      primary: '#3B82F6',
      accent: '#60A5FA',
      ring: '#3B82F6',
    },
  },
  {
    id: 'barberia',
    label: 'Naranja Moderno',
    description: 'Enérgico y audaz — perfecto para barberías y estudios',
    emoji: '💈',
    colors: {
      ...SHARED,
      primary: '#F97316',
      accent: '#FB923C',
      ring: '#F97316',
    },
  },
  {
    id: 'estetica',
    label: 'Rosa Vibrante',
    description: 'Elegante y femenino — ideal para salones de belleza y spas',
    emoji: '✨',
    colors: {
      ...SHARED,
      primary: '#EC4899',
      accent: '#F472B6',
      ring: '#EC4899',
    },
  },
  {
    id: 'naturaleza',
    label: 'Verde Esmeralda',
    description: 'Fresco y natural — perfecto para centros de bienestar',
    emoji: '🌿',
    colors: {
      ...SHARED,
      primary: '#10B981',
      accent: '#34D399',
      ring: '#10B981',
    },
  },
  {
    id: 'hospedaje',
    label: 'Índigo Confort',
    description: 'Sofisticado y premium — ideal para hospedajes y servicios exclusivos',
    emoji: '🏨',
    colors: {
      ...SHARED,
      primary: '#6366F1',
      accent: '#818CF8',
      ring: '#6366F1',
    },
  },
  {
    id: 'fitness',
    label: 'Rojo Pasión',
    description: 'Intenso y motivador — perfecto para gimnasios y entrenamiento',
    emoji: '🏋️',
    colors: {
      ...SHARED,
      primary: '#EF4444',
      accent: '#F87171',
      ring: '#EF4444',
    },
  },
];

/**
 * Obtener tema por ID con fallback a 'salud'.
 */
export function getThemeById(id?: string | null): ThemeDefinition {
  if (!id) return BUSINESS_THEMES[0];
  return BUSINESS_THEMES.find((t) => t.id === id) ?? BUSINESS_THEMES[0];
}

/**
 * Genera CSSProperties con custom properties para aplicar como inline style.
 * Los valores se mapean directamente a los tokens de Tailwind (--primary, etc.)
 * para que las clases utilitarias (`bg-primary`, `text-primary`) adopten
 * automáticamente los colores del tema.
 */
export function getThemeCSSVars(theme: ThemeDefinition): CSSProperties {
  const { colors } = theme;
  return {
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors.foreground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.primaryForeground,
    '--border': colors.border,
    '--input': colors.border,
    '--ring': colors.ring,
    '--secondary': colors.muted,
    '--secondary-foreground': colors.foreground,
    '--popover': colors.card,
    '--popover-foreground': colors.foreground,
  } as CSSProperties;
}
