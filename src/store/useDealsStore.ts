// ============================================
// BRICK DEAL HUNTER - DEALS STORE
// ============================================
// Zustand store for managing deal data.
// This is where we store all the LEGO deals
// fetched from our backend/APIs.

import { create } from 'zustand';
import { Deal, LegoSet, LoadingState, SortOption, Theme } from '../types';
import { sortDeals, filterDeals } from '../utils/priceCalculations';

/**
 * State shape for the deals store
 */
interface DealsState {
  // ===== DATA =====
  /** All deals from the backend */
  deals: Deal[];
  /** All LEGO sets (from Rebrickable) */
  sets: LegoSet[];
  /** All themes for filtering */
  themes: Theme[];

  // ===== LOADING STATES =====
  /** Loading state for deals */
  dealsLoadingState: LoadingState;
  /** Loading state for sets */
  setsLoadingState: LoadingState;
  /** Loading state for themes */
  themesLoadingState: LoadingState;

  // ===== ERROR MESSAGES =====
  /** Error message if deals failed to load */
  dealsError: string | null;
  /** Error message if sets failed to load */
  setsError: string | null;

  // ===== TIMESTAMPS =====
  /** When deals were last refreshed */
  lastUpdated: Date | null;

  // ===== SORTING =====
  /** Current sort option */
  sortOption: SortOption;

  // ===== ACTIONS =====
  /** Set the deals array */
  setDeals: (deals: Deal[]) => void;
  /** Add deals to existing array */
  addDeals: (deals: Deal[]) => void;
  /** Set the sets array */
  setSets: (sets: LegoSet[]) => void;
  /** Set the themes array */
  setThemes: (themes: Theme[]) => void;
  /** Update loading state for deals */
  setDealsLoading: (state: LoadingState) => void;
  /** Update loading state for sets */
  setSetsLoading: (state: LoadingState) => void;
  /** Update loading state for themes */
  setThemesLoading: (state: LoadingState) => void;
  /** Set error message for deals */
  setDealsError: (error: string | null) => void;
  /** Set error message for sets */
  setSetsError: (error: string | null) => void;
  /** Update the last updated timestamp */
  setLastUpdated: (date: Date) => void;
  /** Change sort option */
  setSortOption: (option: SortOption) => void;
  /** Clear all data (for logout/reset) */
  clearAll: () => void;
}

/**
 * Initial state
 */
const initialState = {
  deals: [],
  sets: [],
  themes: [],
  dealsLoadingState: 'idle' as LoadingState,
  setsLoadingState: 'idle' as LoadingState,
  themesLoadingState: 'idle' as LoadingState,
  dealsError: null,
  setsError: null,
  lastUpdated: null,
  sortOption: 'discount_high' as SortOption,
};

/**
 * The deals store
 *
 * Usage:
 * const deals = useDealsStore((state) => state.deals);
 * const setDeals = useDealsStore((state) => state.setDeals);
 */
export const useDealsStore = create<DealsState>((set) => ({
  ...initialState,

  setDeals: (deals) =>
    set((state) => ({
      deals: sortDeals(deals, state.sortOption),
      dealsLoadingState: 'success',
      dealsError: null,
      lastUpdated: new Date(),
    })),

  addDeals: (newDeals) =>
    set((state) => ({
      deals: sortDeals([...state.deals, ...newDeals], state.sortOption),
    })),

  setSets: (sets) =>
    set({
      sets,
      setsLoadingState: 'success',
      setsError: null,
    }),

  setThemes: (themes) =>
    set({
      themes,
      themesLoadingState: 'success',
    }),

  setDealsLoading: (loadingState) =>
    set({ dealsLoadingState: loadingState }),

  setSetsLoading: (loadingState) =>
    set({ setsLoadingState: loadingState }),

  setThemesLoading: (loadingState) =>
    set({ themesLoadingState: loadingState }),

  setDealsError: (error) =>
    set({
      dealsError: error,
      dealsLoadingState: error ? 'error' : 'success',
    }),

  setSetsError: (error) =>
    set({
      setsError: error,
      setsLoadingState: error ? 'error' : 'success',
    }),

  setLastUpdated: (date) =>
    set({ lastUpdated: date }),

  setSortOption: (option) =>
    set((state) => ({
      sortOption: option,
      deals: sortDeals(state.deals, option),
    })),

  clearAll: () => set(initialState),
}));

// ===== SELECTORS =====
// These are helper functions to get specific data from the store

/**
 * Get deals filtered and sorted
 * Usage: const filteredDeals = useFilteredDeals(filters);
 */
export function useFilteredDeals(filters: {
  minDiscount?: number;
  maxDiscount?: number;
  themes?: number[];
  retailers?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}): Deal[] {
  const deals = useDealsStore((state) => state.deals);
  return filterDeals(deals, filters);
}

/**
 * Get a single deal by set number
 */
export function useDealBySetNumber(setNumber: string): Deal | undefined {
  const deals = useDealsStore((state) => state.deals);
  return deals.find((deal) => deal.set.setNumber === setNumber);
}

/**
 * Get top N deals by discount
 */
export function useTopDeals(count: number = 10): Deal[] {
  const deals = useDealsStore((state) => state.deals);
  return sortDeals(deals, 'discount_high').slice(0, count);
}

/**
 * Check if data is loading
 */
export function useIsLoading(): boolean {
  const dealsLoading = useDealsStore((state) => state.dealsLoadingState);
  return dealsLoading === 'loading';
}

/**
 * Get theme by ID
 */
export function useThemeById(themeId: number): Theme | undefined {
  const themes = useDealsStore((state) => state.themes);
  return themes.find((t) => t.id === themeId);
}
