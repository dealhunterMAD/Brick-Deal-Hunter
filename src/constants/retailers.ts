// ============================================
// BRICK DEAL HUNTER - RETAILER DATA
// ============================================
// Information about all supported retailers.
// This includes their names, colors, and URLs.

import { RetailerInfo, RetailerId } from '../types';
import { COLORS } from './colors';

/**
 * All supported retailers with their info
 */
export const RETAILERS: Record<RetailerId, RetailerInfo> = {
  lego: {
    id: 'lego',
    name: 'LEGO.com',
    color: COLORS.retailerLego,
    logo: 'lego-logo',
    baseUrl: 'https://www.lego.com',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    color: COLORS.retailerAmazon,
    logo: 'amazon-logo',
    baseUrl: 'https://www.amazon.com',
  },
  walmart: {
    id: 'walmart',
    name: 'Walmart',
    color: COLORS.retailerWalmart,
    logo: 'walmart-logo',
    baseUrl: 'https://www.walmart.com',
  },
  target: {
    id: 'target',
    name: 'Target',
    color: COLORS.retailerTarget,
    logo: 'target-logo',
    baseUrl: 'https://www.target.com',
  },
  barnes_noble: {
    id: 'barnes_noble',
    name: 'Barnes & Noble',
    color: COLORS.retailerBarnesNoble,
    logo: 'barnes-noble-logo',
    baseUrl: 'https://www.barnesandnoble.com',
  },
  sams_club: {
    id: 'sams_club',
    name: "Sam's Club",
    color: COLORS.retailerSamsClub,
    logo: 'sams-club-logo',
    baseUrl: 'https://www.samsclub.com',
  },
  walgreens: {
    id: 'walgreens',
    name: 'Walgreens',
    color: COLORS.retailerWalgreens,
    logo: 'walgreens-logo',
    baseUrl: 'https://www.walgreens.com',
  },
  best_buy: {
    id: 'best_buy',
    name: 'Best Buy',
    color: COLORS.retailerBestBuy,
    logo: 'best-buy-logo',
    baseUrl: 'https://www.bestbuy.com',
  },
  kohls: {
    id: 'kohls',
    name: "Kohl's",
    color: COLORS.retailerKohls,
    logo: 'kohls-logo',
    baseUrl: 'https://www.kohls.com',
  },
  gamestop: {
    id: 'gamestop',
    name: 'GameStop',
    color: COLORS.retailerGamestop,
    logo: 'gamestop-logo',
    baseUrl: 'https://www.gamestop.com',
  },
  shop_disney: {
    id: 'shop_disney',
    name: 'shopDisney',
    color: COLORS.retailerShopDisney,
    logo: 'shop-disney-logo',
    baseUrl: 'https://www.shopdisney.com',
  },
  macys: {
    id: 'macys',
    name: "Macy's",
    color: COLORS.retailerMacys,
    logo: 'macys-logo',
    baseUrl: 'https://www.macys.com',
  },
};

/**
 * Get list of all retailer IDs
 */
export const ALL_RETAILER_IDS: RetailerId[] = Object.keys(RETAILERS) as RetailerId[];

/**
 * Get retailer info by ID
 * @param id - The retailer ID
 * @returns RetailerInfo or undefined if not found
 */
export function getRetailerInfo(id: RetailerId): RetailerInfo | undefined {
  return RETAILERS[id];
}

/**
 * Get retailer name by ID (with fallback)
 * @param id - The retailer ID
 * @returns Display name
 */
export function getRetailerName(id: RetailerId): string {
  return RETAILERS[id]?.name || id;
}

/**
 * Build a product URL for a retailer
 * Note: These are general search URLs. Actual product URLs
 * will come from the scraper/API data.
 */
export function buildSearchUrl(retailerId: RetailerId, setNumber: string): string {
  const cleanSetNum = setNumber.replace('-1', ''); // Remove suffix

  switch (retailerId) {
    case 'lego':
      return `https://www.lego.com/en-us/search?q=${cleanSetNum}`;
    case 'amazon':
      return `https://www.amazon.com/s?k=LEGO+${cleanSetNum}`;
    case 'walmart':
      return `https://www.walmart.com/search?q=LEGO+${cleanSetNum}`;
    case 'target':
      return `https://www.target.com/s?searchTerm=LEGO+${cleanSetNum}`;
    case 'barnes_noble':
      return `https://www.barnesandnoble.com/s/LEGO+${cleanSetNum}`;
    case 'sams_club':
      return `https://www.samsclub.com/s/LEGO+${cleanSetNum}`;
    case 'walgreens':
      return `https://www.walgreens.com/search/results.jsp?Ntt=LEGO+${cleanSetNum}`;
    case 'best_buy':
      return `https://www.bestbuy.com/site/searchpage.jsp?st=LEGO+${cleanSetNum}`;
    case 'kohls':
      return `https://www.kohls.com/search.jsp?search=LEGO+${cleanSetNum}`;
    case 'gamestop':
      return `https://www.gamestop.com/search/?q=LEGO+${cleanSetNum}`;
    case 'shop_disney':
      return `https://www.shopdisney.com/search?q=LEGO+${cleanSetNum}`;
    case 'macys':
      return `https://www.macys.com/shop/featured/lego+${cleanSetNum}`;
    default:
      return '';
  }
}
