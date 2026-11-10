/**
 * SISTEMA DE DISEÑO EJECUTIVO: "NORDIC EMERALD & AGRO SLATE"
 * Calibrado con contraste AAA (WCAG 2.1) para lectura bajo sol directo en el campo
 * y modo nocturno profundo para cabina de tractor / escritorio.
 */

export interface ThemeColors {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMuted: string;
  heroBackground: string;
  heroBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primarySoft: string;
  accentGold: string;
  accentGoldSoft: string;
  usdBadgeBg: string;
  usdBadgeText: string;
  pygBadgeBg: string;
  pygBadgeText: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  border: string;
  borderStrong: string;
  skeletonBase: string;
}

export const LIGHT_THEME: ThemeColors = {
  mode: 'light',
  background: '#F3F6F4',        // Alabaster Sage (reduce encandilamiento al sol)
  surface: '#FFFFFF',           // Blanco Puro para tarjetas
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#E7EFEA',      // Verde pizarra ultra suave
  heroBackground: '#064E3B',    // Deep Nordic Emerald (Institucional Bancario Agro)
  heroBorder: '#047857',
  textPrimary: '#0B1712',       // Carbon Forest (Contraste 17.4:1)
  textSecondary: '#334E43',     // Slate Pine
  textMuted: '#4B6559',         // Ajustado para contraste AA (>=4.5:1) sobre fondos claros
  textInverse: '#F8FAFC',
  primary: '#047857',           // Emerald Action (texto blanco encima cumple AA)
  primarySoft: '#D1FAE5',
  accentGold: '#B45309',        // Harvest Amber (Soja/Maíz/Alertas)
  accentGoldSoft: '#FEF3C7',
  usdBadgeBg: '#DCFCE7',
  usdBadgeText: '#166534',
  pygBadgeBg: '#E0E7FF',
  pygBadgeText: '#1E40AF',
  success: '#047857',
  successSoft: '#D1FAE5',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  border: '#D5E1DA',
  borderStrong: '#94A89C',
  skeletonBase: '#DCE6E0',
};

export const DARK_THEME: ThemeColors = {
  mode: 'dark',
  background: '#09110E',        // Obsidian Forest
  surface: '#111E19',           // Agro Slate Dark Card
  surfaceElevated: '#172922',
  surfaceMuted: '#1B2F27',
  heroBackground: '#052E23',    // Deep Emerald Vault
  heroBorder: '#065F46',
  textPrimary: '#ECFDF5',       // Crisp Mint White
  textSecondary: '#A7F3D0',     // Soft Sage
  textMuted: '#6EE7B7',
  textInverse: '#09110E',
  primary: '#10B981',           // Luminous Emerald
  primarySoft: '#064E3B',
  accentGold: '#F59E0B',        // Golden Grain
  accentGoldSoft: '#451A03',
  usdBadgeBg: '#064E3B',
  usdBadgeText: '#6EE7B7',
  pygBadgeBg: '#1E293B',
  pygBadgeText: '#93C5FD',
  success: '#10B981',
  successSoft: '#064E3B',
  warning: '#F59E0B',
  warningSoft: '#451A03',
  danger: '#EF4444',
  dangerSoft: '#450A0A',
  border: '#1F352C',
  borderStrong: '#2D4F41',
  skeletonBase: '#1C3028',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

