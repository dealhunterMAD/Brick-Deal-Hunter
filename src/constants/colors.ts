// ============================================
// BRICK DEAL HUNTER - COLOR PALETTE
// ============================================
// All colors used in the app are defined here.
// This makes it easy to change colors in one place.
// LEGO brand colors are the primary theme.

// =========== LIGHT THEME COLORS ===========
export const LIGHT_COLORS = {
  // =========== LEGO BRAND COLORS ===========
  legoRed: '#D91F2A',      // Primary LEGO red
  legoYellow: '#F7B500',   // Primary LEGO yellow
  legoBlue: '#006DB7',     // LEGO blue
  legoGreen: '#00852B',    // LEGO green
  legoOrange: '#FE8A18',   // LEGO orange
  legoBlack: '#1A1A1A',    // LEGO black
  legoWhite: '#FFFFFF',    // LEGO white

  // =========== BACKGROUND COLORS ===========
  background: '#F5F5F5',       // Main app background (light gray)
  cardBackground: '#FFFFFF',    // Card/container background
  surfaceLight: '#FAFAFA',      // Lighter surface
  surfaceDark: '#E5E5E5',       // Darker surface/dividers

  // =========== TEXT COLORS ===========
  textPrimary: '#1A1A1A',    // Main text (almost black)
  textSecondary: '#6B7280',  // Secondary/muted text (gray)
  textTertiary: '#9CA3AF',   // Even lighter text
  textInverse: '#FFFFFF',    // Text on dark backgrounds

  // =========== DEAL BADGE COLORS ===========
  dealMild: '#F59E0B',      // 10-19% off (amber/yellow)
  dealGood: '#22C55E',      // 20-39% off (green)
  dealGreat: '#16A34A',     // 40-59% off (darker green)
  dealAmazing: '#DC2626',   // 60%+ off (red - clearance!)

  // =========== STATUS COLORS ===========
  success: '#22C55E',  // Success/positive (green)
  warning: '#F59E0B',  // Warning (amber)
  error: '#EF4444',    // Error/danger (red)
  info: '#3B82F6',     // Information (blue)

  // =========== RETAILER BRAND COLORS ===========
  retailerLego: '#D91F2A',
  retailerAmazon: '#FF9900',
  retailerWalmart: '#0071CE',
  retailerTarget: '#CC0000',
  retailerBarnesNoble: '#2A5934',
  retailerSamsClub: '#0067A0',
  retailerWalgreens: '#E31837',
  retailerBestBuy: '#0046BE',
  retailerKohls: '#000000',
  retailerGamestop: '#000000',
  retailerShopDisney: '#006CFF',
  retailerMacys: '#E21A2C',

  // =========== UI ELEMENT COLORS ===========
  border: '#E5E7EB',
  borderFocused: '#D91F2A',
  inputBackground: '#F9FAFB',
  placeholder: '#9CA3AF',
  disabled: '#D1D5DB',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // =========== SKELETON LOADING COLORS ===========
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
} as const;

// =========== DARK THEME COLORS ===========
export const DARK_COLORS = {
  // =========== LEGO BRAND COLORS ===========
  legoRed: '#E53E3E',      // Slightly brighter red for dark mode
  legoYellow: '#F7B500',   // Keep yellow the same
  legoBlue: '#4299E1',     // Brighter blue
  legoGreen: '#38A169',    // Brighter green
  legoOrange: '#FE8A18',   // Keep orange
  legoBlack: '#1A1A1A',    // Keep black
  legoWhite: '#FFFFFF',    // Keep white

  // =========== BACKGROUND COLORS ===========
  background: '#121212',        // Dark background
  cardBackground: '#1E1E1E',    // Dark card background
  surfaceLight: '#2D2D2D',      // Lighter dark surface
  surfaceDark: '#0A0A0A',       // Even darker surface

  // =========== TEXT COLORS ===========
  textPrimary: '#F5F5F5',    // Light text on dark
  textSecondary: '#A0AEC0',  // Muted light text
  textTertiary: '#718096',   // Even more muted
  textInverse: '#1A1A1A',    // Dark text on light backgrounds

  // =========== DEAL BADGE COLORS ===========
  dealMild: '#F6AD55',      // Brighter amber for dark mode
  dealGood: '#48BB78',      // Brighter green
  dealGreat: '#38A169',     // Darker green
  dealAmazing: '#FC8181',   // Brighter red

  // =========== STATUS COLORS ===========
  success: '#48BB78',
  warning: '#F6AD55',
  error: '#FC8181',
  info: '#63B3ED',

  // =========== RETAILER BRAND COLORS ===========
  retailerLego: '#E53E3E',
  retailerAmazon: '#FF9900',
  retailerWalmart: '#4299E1',
  retailerTarget: '#FC8181',
  retailerBarnesNoble: '#48BB78',
  retailerSamsClub: '#4299E1',
  retailerWalgreens: '#FC8181',
  retailerBestBuy: '#4299E1',
  retailerKohls: '#A0AEC0',
  retailerGamestop: '#A0AEC0',
  retailerShopDisney: '#4299E1',
  retailerMacys: '#4299E1',

  // =========== UI ELEMENT COLORS ===========
  border: '#2D3748',
  borderFocused: '#E53E3E',
  inputBackground: '#2D2D2D',
  placeholder: '#718096',
  disabled: '#4A5568',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // =========== SKELETON LOADING COLORS ===========
  skeletonBase: '#2D2D2D',
  skeletonHighlight: '#3D3D3D',
} as const;

// Default export for backwards compatibility
export const COLORS = LIGHT_COLORS;

// Type for the colors object
export type ColorName = keyof typeof LIGHT_COLORS;
export type ThemeColors = typeof LIGHT_COLORS;

/**
 * Get the badge color based on discount percentage
 * @param percentOff - The discount percentage (0-100)
 * @param colors - The current theme colors
 * @returns The hex color code
 */
export function getDiscountBadgeColor(percentOff: number, colors: ThemeColors = COLORS): string {
  if (percentOff >= 60) return colors.dealAmazing;
  if (percentOff >= 40) return colors.dealGreat;
  if (percentOff >= 20) return colors.dealGood;
  if (percentOff >= 10) return colors.dealMild;
  return colors.textSecondary;
}

/**
 * Get retailer brand color
 * @param retailerId - The retailer identifier
 * @param colors - The current theme colors
 * @returns The hex color code
 */
export function getRetailerColor(retailerId: string, colors: ThemeColors = COLORS): string {
  const colorMap: Record<string, string> = {
    lego: colors.retailerLego,
    amazon: colors.retailerAmazon,
    walmart: colors.retailerWalmart,
    target: colors.retailerTarget,
    barnes_noble: colors.retailerBarnesNoble,
    sams_club: colors.retailerSamsClub,
    walgreens: colors.retailerWalgreens,
    best_buy: colors.retailerBestBuy,
    kohls: colors.retailerKohls,
    gamestop: colors.retailerGamestop,
    shop_disney: colors.retailerShopDisney,
    macys: colors.retailerMacys,
  };
  return colorMap[retailerId] || colors.textSecondary;
}
