// ============================================
// BRICK DEAL HUNTER - TYPE DEFINITIONS
// ============================================
// This file contains all the TypeScript types
// used throughout the app. Think of types as
// "blueprints" that describe what data looks like.

/**
 * A LEGO set from the Rebrickable API
 */
export interface LegoSet {
  /** Unique set number like "75192-1" */
  setNumber: string;
  /** Display name like "Millennium Falcon" */
  name: string;
  /** Release year (e.g., 2024) */
  year: number;
  /** Theme name like "Star Wars" */
  theme: string;
  /** Theme ID from Rebrickable */
  themeId: number;
  /** Number of pieces in the set */
  numParts: number;
  /** URL to official set image */
  imageUrl: string;
  /** Official MSRP (retail price) in USD */
  msrp: number | null;
  /** Whether the set is currently available (not retired) */
  isActive: boolean;
}

/**
 * A theme category from Rebrickable
 */
export interface Theme {
  /** Unique theme ID */
  id: number;
  /** Theme name like "Star Wars" */
  name: string;
  /** Parent theme ID (for sub-themes) */
  parentId: number | null;
}

/**
 * Price data for a specific set at a retailer
 */
export interface PricePoint {
  /** The LEGO set number */
  setNumber: string;
  /** Retailer name (matches RetailerInfo.id) */
  retailer: RetailerId;
  /** Current sale price in USD */
  currentPrice: number;
  /** Original/MSRP price in USD */
  originalPrice: number;
  /** Direct link to buy */
  url: string;
  /** When this price was last checked */
  lastUpdated: Date;
  /** Whether the item is in stock */
  inStock: boolean;
}

/**
 * A complete deal combining set info + price
 */
export interface Deal {
  /** The LEGO set data */
  set: LegoSet;
  /** Current best price info */
  price: PricePoint;
  /** Calculated percentage off MSRP */
  percentOff: number;
  /** Discount amount in dollars */
  savings: number;
}

/**
 * Supported retailer IDs
 */
export type RetailerId =
  | 'lego'
  | 'amazon'
  | 'walmart'
  | 'target'
  | 'barnes_noble'
  | 'sams_club'
  | 'walgreens'
  | 'best_buy'
  | 'kohls'
  | 'gamestop'
  | 'shop_disney'
  | 'macys';

/**
 * Information about a retailer
 */
export interface RetailerInfo {
  /** Unique retailer identifier */
  id: RetailerId;
  /** Display name */
  name: string;
  /** Brand color (hex) */
  color: string;
  /** Logo image require path */
  logo: string;
  /** Base website URL */
  baseUrl: string;
}

/**
 * Price history entry for charts
 */
export interface PriceHistoryPoint {
  /** Date of the price */
  date: Date;
  /** Price at that date */
  price: number;
  /** Which retailer */
  retailer: RetailerId;
}

/**
 * User's filter preferences
 */
export interface FilterState {
  /** Minimum % off to show (0-100) */
  minDiscount: number;
  /** Maximum % off to show (0-100) */
  maxDiscount: number;
  /** Selected theme IDs (empty = all) */
  themes: number[];
  /** Selected retailer IDs (empty = all) */
  retailers: RetailerId[];
  /** Minimum price in USD */
  minPrice: number;
  /** Maximum price in USD */
  maxPrice: number;
  /** Only show in-stock items */
  inStockOnly: boolean;
}

/**
 * Sort options for deal list
 */
export type SortOption =
  | 'discount_high'
  | 'discount_low'
  | 'price_high'
  | 'price_low'
  | 'name_asc'
  | 'name_desc'
  | 'newest';

/**
 * User's notification preferences
 */
export interface NotificationSettings {
  /** Enable all notifications */
  enabled: boolean;
  /** Minimum % off to trigger notification */
  minDiscountThreshold: number;
  /** Themes to get notifications for (empty = all) */
  watchedThemes: number[];
  /** Specific set numbers to watch */
  watchedSets: string[];
  /** Quiet hours start (0-23) */
  quietHoursStart: number | null;
  /** Quiet hours end (0-23) */
  quietHoursEnd: number | null;
}

/**
 * App settings stored locally
 * NOTE: API keys are NOT stored here - they use SecureStore for encryption
 */
export interface AppSettings {
  /** User's notification preferences */
  notifications: NotificationSettings;
  /** Has user completed onboarding */
  hasCompletedOnboarding: boolean;
  /** Preferred sort option */
  defaultSort: SortOption;
  /** Theme preference */
  colorScheme: 'light' | 'dark' | 'system';
}

/**
 * API response wrapper for pagination
 */
export interface PaginatedResponse<T> {
  /** Total count of items */
  count: number;
  /** URL to next page (null if last page) */
  next: string | null;
  /** URL to previous page (null if first page) */
  previous: string | null;
  /** Array of items for current page */
  results: T[];
}

/**
 * Rebrickable API set response
 */
export interface RebrickableSet {
  set_num: string;
  name: string;
  year: number;
  theme_id: number;
  num_parts: number;
  set_img_url: string | null;
  set_url: string;
  last_modified_dt: string;
}

/**
 * Rebrickable API theme response
 */
export interface RebrickableTheme {
  id: number;
  name: string;
  parent_id: number | null;
}

/**
 * BrickLink price guide response
 */
export interface BrickLinkPriceGuide {
  item: {
    no: string;
    type: string;
  };
  new_or_used: 'N' | 'U';
  currency_code: string;
  min_price: string;
  max_price: string;
  avg_price: string;
  qty_avg_price: string;
  unit_quantity: number;
  total_quantity: number;
}

/**
 * Navigation param types
 */
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
  SetDetail: { setNumber: string };
  Settings: undefined;
  Alerts: undefined;
};

/**
 * Tab navigation param types
 */
export type MainTabParamList = {
  Home: undefined;
  Alerts: undefined;
  Settings: undefined;
};

/**
 * Loading states for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Error with user-friendly message
 */
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  retry?: () => void;
}
