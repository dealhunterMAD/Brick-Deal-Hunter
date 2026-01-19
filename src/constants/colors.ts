// ============================================
// BRICK DEAL HUNTER - COLOR PALETTE
// ============================================
// All colors used in the app are defined here.
// This makes it easy to change colors in one place.
// LEGO brand colors are the primary theme.

export const COLORS = {
  // =========== LEGO BRAND COLORS ===========
  // These are the official LEGO colors
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
  // Different colors based on how good the deal is
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
  // These help users quickly identify which store
  retailerLego: '#D91F2A',      // LEGO red
  retailerAmazon: '#FF9900',    // Amazon orange
  retailerWalmart: '#0071CE',   // Walmart blue
  retailerTarget: '#CC0000',    // Target red
  retailerBarnesNoble: '#2A5934', // B&N green
  retailerSamsClub: '#0067A0',  // Sam's blue
  retailerCostco: '#E31837',    // Costco red
  retailerWalgreens: '#E31837', // Walgreens red
  retailerBestBuy: '#0046BE',   // Best Buy blue
  retailerKohls: '#000000',     // Kohl's black
  retailerMeijer: '#E31837',    // Meijer red
  retailerFredMeyer: '#ED1C24', // Fred Meyer red
  retailerGamestop: '#000000',  // GameStop black
  retailerEntertainmentEarth: '#0066CC', // Entertainment Earth blue
  retailerShopDisney: '#006CFF', // Disney blue
  retailerToysRUs: '#004B93',   // Toys R Us blue

  // =========== UI ELEMENT COLORS ===========
  border: '#E5E7EB',         // Border color
  borderFocused: '#D91F2A',  // Focused input border
  inputBackground: '#F9FAFB', // Input field background
  placeholder: '#9CA3AF',     // Placeholder text
  disabled: '#D1D5DB',        // Disabled elements
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay

  // =========== SKELETON LOADING COLORS ===========
  skeletonBase: '#E5E7EB',    // Skeleton background
  skeletonHighlight: '#F3F4F6', // Skeleton shimmer
} as const;

// Type for the colors object
export type ColorName = keyof typeof COLORS;

/**
 * Get the badge color based on discount percentage
 * @param percentOff - The discount percentage (0-100)
 * @returns The hex color code
 */
export function getDiscountBadgeColor(percentOff: number): string {
  if (percentOff >= 60) return COLORS.dealAmazing;
  if (percentOff >= 40) return COLORS.dealGreat;
  if (percentOff >= 20) return COLORS.dealGood;
  if (percentOff >= 10) return COLORS.dealMild;
  return COLORS.textSecondary;
}

/**
 * Get retailer brand color
 * @param retailerId - The retailer identifier
 * @returns The hex color code
 */
export function getRetailerColor(retailerId: string): string {
  const colorMap: Record<string, string> = {
    lego: COLORS.retailerLego,
    amazon: COLORS.retailerAmazon,
    walmart: COLORS.retailerWalmart,
    target: COLORS.retailerTarget,
    barnes_noble: COLORS.retailerBarnesNoble,
    sams_club: COLORS.retailerSamsClub,
    costco: COLORS.retailerCostco,
    walgreens: COLORS.retailerWalgreens,
    best_buy: COLORS.retailerBestBuy,
    kohls: COLORS.retailerKohls,
    meijer: COLORS.retailerMeijer,
    fred_meyer: COLORS.retailerFredMeyer,
    gamestop: COLORS.retailerGamestop,
    entertainment_earth: COLORS.retailerEntertainmentEarth,
    shop_disney: COLORS.retailerShopDisney,
    toys_r_us: COLORS.retailerToysRUs,
  };
  return colorMap[retailerId] || COLORS.textSecondary;
}
