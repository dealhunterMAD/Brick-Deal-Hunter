// ============================================
// BRICK DEAL HUNTER - THEME CONFIGURATION
// ============================================
// App-wide theme settings including spacing,
// typography, shadows, and other design tokens.

import { COLORS } from './colors';

/**
 * Spacing scale (in pixels)
 * Use these for consistent margins and padding
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999, // For circular elements
} as const;

/**
 * Font sizes
 */
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

/**
 * Font weights
 */
export const FONT_WEIGHT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Line heights (multipliers)
 */
export const LINE_HEIGHT = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

/**
 * Shadow presets for elevation
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Z-index layers for stacking
 */
export const Z_INDEX = {
  base: 0,
  card: 10,
  header: 100,
  modal: 1000,
  toast: 2000,
} as const;

/**
 * Icon sizes
 */
export const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Hit slop for touch targets (makes small buttons easier to tap)
 */
export const HIT_SLOP = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};

/**
 * Card component default styles
 */
export const CARD_STYLE = {
  backgroundColor: COLORS.cardBackground,
  borderRadius: BORDER_RADIUS.lg,
  padding: SPACING.lg,
  ...SHADOWS.md,
};

/**
 * Input field default styles
 */
export const INPUT_STYLE = {
  backgroundColor: COLORS.inputBackground,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: BORDER_RADIUS.md,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
  fontSize: FONT_SIZE.md,
  color: COLORS.textPrimary,
};

/**
 * Primary button styles
 */
export const BUTTON_PRIMARY = {
  backgroundColor: COLORS.legoRed,
  borderRadius: BORDER_RADIUS.md,
  paddingHorizontal: SPACING.xl,
  paddingVertical: SPACING.md,
};

/**
 * Secondary button styles
 */
export const BUTTON_SECONDARY = {
  backgroundColor: COLORS.cardBackground,
  borderWidth: 1,
  borderColor: COLORS.legoRed,
  borderRadius: BORDER_RADIUS.md,
  paddingHorizontal: SPACING.xl,
  paddingVertical: SPACING.md,
};

/**
 * Popular LEGO themes for filtering
 * These are the most searched themes
 */
export const POPULAR_THEMES = [
  { id: 158, name: 'Star Wars' },
  { id: 1, name: 'Technic' },
  { id: 52, name: 'City' },
  { id: 246, name: 'Harry Potter' },
  { id: 577, name: 'Marvel' },
  { id: 435, name: 'DC' },
  { id: 695, name: 'Ideas' },
  { id: 602, name: 'Creator Expert' },
  { id: 494, name: 'Speed Champions' },
  { id: 610, name: 'Architecture' },
  { id: 501, name: 'Ninjago' },
  { id: 688, name: 'Minecraft' },
] as const;
