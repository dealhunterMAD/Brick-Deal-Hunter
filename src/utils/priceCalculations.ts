// ============================================
// BRICK DEAL HUNTER - PRICE CALCULATIONS
// ============================================
// Helper functions for calculating discounts,
// savings, and formatting price data.

import { Deal, LegoSet, PricePoint } from '../types';

/**
 * Calculate the percentage discount
 * @param originalPrice - The MSRP or original price
 * @param currentPrice - The sale price
 * @returns Percentage off (0-100), or 0 if no discount
 *
 * Example: Original $100, Sale $75 = 25% off
 */
export function calculatePercentOff(
  originalPrice: number,
  currentPrice: number
): number {
  if (originalPrice <= 0 || currentPrice <= 0) return 0;
  if (currentPrice >= originalPrice) return 0;

  const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
  return Math.round(discount);
}

/**
 * Calculate the dollar savings
 * @param originalPrice - The MSRP or original price
 * @param currentPrice - The sale price
 * @returns Dollar amount saved
 */
export function calculateSavings(
  originalPrice: number,
  currentPrice: number
): number {
  if (originalPrice <= 0 || currentPrice <= 0) return 0;
  if (currentPrice >= originalPrice) return 0;

  return originalPrice - currentPrice;
}

/**
 * Create a Deal object from a set and price
 * @param set - The LEGO set data
 * @param price - The price point data
 * @returns Complete Deal object
 */
export function createDeal(set: LegoSet, price: PricePoint): Deal {
  const msrp = set.msrp || price.originalPrice;
  const percentOff = calculatePercentOff(msrp, price.currentPrice);
  const savings = calculateSavings(msrp, price.currentPrice);

  return {
    set,
    price,
    percentOff,
    savings,
  };
}

/**
 * Find the best deal (lowest price) from multiple price points
 * @param prices - Array of price points for the same set
 * @returns The price point with the lowest current price
 */
export function findBestPrice(prices: PricePoint[]): PricePoint | null {
  if (prices.length === 0) return null;

  return prices.reduce((best, current) => {
    // Prefer in-stock items
    if (current.inStock && !best.inStock) return current;
    if (!current.inStock && best.inStock) return best;

    // Then lowest price
    return current.currentPrice < best.currentPrice ? current : best;
  });
}

/**
 * Sort deals by various criteria
 * @param deals - Array of deals to sort
 * @param sortBy - Sort criteria
 * @returns Sorted array (new array, doesn't mutate original)
 */
export function sortDeals(
  deals: Deal[],
  sortBy: 'discount_high' | 'discount_low' | 'price_high' | 'price_low' | 'name_asc' | 'name_desc' | 'newest'
): Deal[] {
  const sorted = [...deals];

  switch (sortBy) {
    case 'discount_high':
      return sorted.sort((a, b) => b.percentOff - a.percentOff);
    case 'discount_low':
      return sorted.sort((a, b) => a.percentOff - b.percentOff);
    case 'price_high':
      return sorted.sort((a, b) => b.price.currentPrice - a.price.currentPrice);
    case 'price_low':
      return sorted.sort((a, b) => a.price.currentPrice - b.price.currentPrice);
    case 'name_asc':
      return sorted.sort((a, b) => a.set.name.localeCompare(b.set.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.set.name.localeCompare(a.set.name));
    case 'newest':
      return sorted.sort((a, b) => b.set.year - a.set.year);
    default:
      return sorted;
  }
}

/**
 * Filter deals by criteria
 * @param deals - Array of deals to filter
 * @param filters - Filter criteria
 * @returns Filtered array
 */
export function filterDeals(
  deals: Deal[],
  filters: {
    minDiscount?: number;
    maxDiscount?: number;
    themes?: number[];
    retailers?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }
): Deal[] {
  return deals.filter((deal) => {
    // Filter by discount range
    if (filters.minDiscount !== undefined && deal.percentOff < filters.minDiscount) {
      return false;
    }
    if (filters.maxDiscount !== undefined && deal.percentOff > filters.maxDiscount) {
      return false;
    }

    // Filter by themes
    if (filters.themes && filters.themes.length > 0) {
      if (!filters.themes.includes(deal.set.themeId)) {
        return false;
      }
    }

    // Filter by retailers
    if (filters.retailers && filters.retailers.length > 0) {
      if (!filters.retailers.includes(deal.price.retailer)) {
        return false;
      }
    }

    // Filter by price range
    if (filters.minPrice !== undefined && deal.price.currentPrice < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && deal.price.currentPrice > filters.maxPrice) {
      return false;
    }

    // Filter by stock status
    if (filters.inStockOnly && !deal.price.inStock) {
      return false;
    }

    return true;
  });
}

/**
 * Get deal quality rating based on discount
 * @param percentOff - The discount percentage
 * @returns Rating string
 */
export function getDealRating(percentOff: number): 'amazing' | 'great' | 'good' | 'mild' | 'none' {
  if (percentOff >= 60) return 'amazing';
  if (percentOff >= 40) return 'great';
  if (percentOff >= 20) return 'good';
  if (percentOff >= 10) return 'mild';
  return 'none';
}

/**
 * Calculate price per piece (useful for comparing sets)
 * @param price - Current price
 * @param numParts - Number of pieces in set
 * @returns Price per piece in cents
 */
export function calculatePricePerPiece(price: number, numParts: number): number {
  if (numParts <= 0) return 0;
  return Math.round((price / numParts) * 100) / 100;
}
