// ============================================
// BRICK DEAL HUNTER - FILTERS STORE
// ============================================
// Zustand store for managing filter state.
// Keeps track of what filters the user has selected.

import { create } from 'zustand';
import { FilterState, RetailerId, SortOption } from '../types';
import { ALL_RETAILER_IDS } from '../constants/retailers';

/**
 * State shape for the filters store
 */
interface FiltersState extends FilterState {
  // ===== SORT =====
  /** Current sort option */
  sortOption: SortOption;

  // ===== UI STATE =====
  /** Whether the filter modal is open */
  isFilterModalOpen: boolean;

  // ===== ACTIONS =====
  /** Set minimum discount filter */
  setMinDiscount: (value: number) => void;
  /** Set maximum discount filter */
  setMaxDiscount: (value: number) => void;
  /** Toggle a theme in the filter */
  toggleTheme: (themeId: number) => void;
  /** Set all selected themes at once */
  setThemes: (themes: number[]) => void;
  /** Toggle a retailer in the filter */
  toggleRetailer: (retailerId: RetailerId) => void;
  /** Set all selected retailers at once */
  setRetailers: (retailers: RetailerId[]) => void;
  /** Set minimum price filter */
  setMinPrice: (value: number) => void;
  /** Set maximum price filter */
  setMaxPrice: (value: number) => void;
  /** Toggle in-stock only filter */
  toggleInStockOnly: () => void;
  /** Set sort option */
  setSortOption: (option: SortOption) => void;
  /** Open/close filter modal */
  setFilterModalOpen: (open: boolean) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Check if any filters are active */
  hasActiveFilters: () => boolean;
}

/**
 * Default filter values
 */
const defaultFilters: FilterState = {
  minDiscount: 0,
  maxDiscount: 100,
  themes: [], // Empty = all themes
  retailers: [], // Empty = all retailers
  minPrice: 0,
  maxPrice: 1000,
  inStockOnly: false,
};

/**
 * The filters store
 *
 * Usage:
 * const minDiscount = useFiltersStore((state) => state.minDiscount);
 * const setMinDiscount = useFiltersStore((state) => state.setMinDiscount);
 */
export const useFiltersStore = create<FiltersState>((set, get) => ({
  ...defaultFilters,
  sortOption: 'discount_high',
  isFilterModalOpen: false,

  setMinDiscount: (value) =>
    set({ minDiscount: Math.max(0, Math.min(value, get().maxDiscount)) }),

  setMaxDiscount: (value) =>
    set({ maxDiscount: Math.min(100, Math.max(value, get().minDiscount)) }),

  toggleTheme: (themeId) =>
    set((state) => {
      const themes = state.themes.includes(themeId)
        ? state.themes.filter((id) => id !== themeId)
        : [...state.themes, themeId];
      return { themes };
    }),

  setThemes: (themes) => set({ themes }),

  toggleRetailer: (retailerId) =>
    set((state) => {
      const retailers = state.retailers.includes(retailerId)
        ? state.retailers.filter((id) => id !== retailerId)
        : [...state.retailers, retailerId];
      return { retailers };
    }),

  setRetailers: (retailers) => set({ retailers }),

  setMinPrice: (value) =>
    set({ minPrice: Math.max(0, Math.min(value, get().maxPrice)) }),

  setMaxPrice: (value) =>
    set({ maxPrice: Math.max(value, get().minPrice) }),

  toggleInStockOnly: () =>
    set((state) => ({ inStockOnly: !state.inStockOnly })),

  setSortOption: (option) => set({ sortOption: option }),

  setFilterModalOpen: (open) => set({ isFilterModalOpen: open }),

  resetFilters: () => set(defaultFilters),

  hasActiveFilters: () => {
    const state = get();
    return (
      state.minDiscount > 0 ||
      state.maxDiscount < 100 ||
      state.themes.length > 0 ||
      state.retailers.length > 0 ||
      state.minPrice > 0 ||
      state.maxPrice < 1000 ||
      state.inStockOnly
    );
  },
}));

// ===== SELECTORS =====

/**
 * Get filter state as an object (for passing to filter function)
 */
export function useFilterState(): FilterState {
  return useFiltersStore((state) => ({
    minDiscount: state.minDiscount,
    maxDiscount: state.maxDiscount,
    themes: state.themes,
    retailers: state.retailers,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStockOnly: state.inStockOnly,
  }));
}

/**
 * Get count of active filters
 */
export function useActiveFilterCount(): number {
  const state = useFiltersStore();
  let count = 0;

  if (state.minDiscount > 0) count++;
  if (state.maxDiscount < 100) count++;
  if (state.themes.length > 0) count++;
  if (state.retailers.length > 0) count++;
  if (state.minPrice > 0) count++;
  if (state.maxPrice < 1000) count++;
  if (state.inStockOnly) count++;

  return count;
}
