// ============================================
// REBRICKABLE API SERVICE
// ============================================
// Handles all communication with the Rebrickable API.
// Rebrickable is the primary source for LEGO set data.
//
// API Documentation: https://rebrickable.com/api/v3/docs/
// You need a free API key from: https://rebrickable.com/api/

import {
  LegoSet,
  Theme,
  PaginatedResponse,
  RebrickableSet,
  RebrickableTheme,
} from '../types';

/**
 * Base URL for Rebrickable API
 */
const BASE_URL = 'https://rebrickable.com/api/v3';

/**
 * Default request headers
 */
const getHeaders = (apiKey: string) => ({
  Accept: 'application/json',
  Authorization: `key ${apiKey}`,
});

/**
 * Convert Rebrickable set format to our LegoSet format
 */
function mapRebrickableSet(
  rbSet: RebrickableSet,
  themeName: string = 'Unknown'
): LegoSet {
  return {
    setNumber: rbSet.set_num,
    name: rbSet.name,
    year: rbSet.year,
    theme: themeName,
    themeId: rbSet.theme_id,
    numParts: rbSet.num_parts,
    imageUrl: rbSet.set_img_url || '',
    msrp: null, // Rebrickable doesn't provide MSRP
    isActive: true, // We filter for active sets
  };
}

/**
 * Convert Rebrickable theme format to our Theme format
 */
function mapRebrickableTheme(rbTheme: RebrickableTheme): Theme {
  return {
    id: rbTheme.id,
    name: rbTheme.name,
    parentId: rbTheme.parent_id,
  };
}

/**
 * Fetch all themes from Rebrickable
 * @param apiKey - Your Rebrickable API key
 * @returns Array of themes
 */
export async function fetchThemes(apiKey: string): Promise<Theme[]> {
  const themes: Theme[] = [];
  let nextUrl: string | null = `${BASE_URL}/lego/themes/?page_size=1000`;

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: getHeaders(apiKey),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch themes: ${response.status}`);
    }

    const data: PaginatedResponse<RebrickableTheme> = await response.json();
    themes.push(...data.results.map(mapRebrickableTheme));
    nextUrl = data.next;
  }

  return themes;
}

/**
 * Fetch current (non-retired) LEGO sets
 * @param apiKey - Your Rebrickable API key
 * @param options - Filter options
 * @returns Array of LEGO sets
 */
export async function fetchCurrentSets(
  apiKey: string,
  options: {
    minYear?: number;
    maxYear?: number;
    themeId?: number;
    pageSize?: number;
    maxPages?: number;
  } = {}
): Promise<LegoSet[]> {
  const {
    minYear = 2020, // Only recent sets
    maxYear = new Date().getFullYear() + 1,
    themeId,
    pageSize = 500,
    maxPages = 10, // Limit to prevent too many requests
  } = options;

  // First, fetch themes to get theme names
  const themes = await fetchThemes(apiKey);
  const themeMap = new Map(themes.map((t) => [t.id, t.name]));

  const sets: LegoSet[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    // Build URL with filters
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      min_year: String(minYear),
      max_year: String(maxYear),
      ordering: '-year', // Newest first
    });

    if (themeId) {
      params.set('theme_id', String(themeId));
    }

    const url = `${BASE_URL}/lego/sets/?${params}`;

    const response = await fetch(url, {
      headers: getHeaders(apiKey),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sets: ${response.status}`);
    }

    const data: PaginatedResponse<RebrickableSet> = await response.json();

    // Map and add sets
    for (const rbSet of data.results) {
      const themeName = themeMap.get(rbSet.theme_id) || 'Unknown';
      sets.push(mapRebrickableSet(rbSet, themeName));
    }

    // Check if there are more pages
    hasMore = data.next !== null;
    page++;

    // Small delay to be respectful to the API
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return sets;
}

/**
 * Fetch a single set by set number
 * @param apiKey - Your Rebrickable API key
 * @param setNumber - The set number (e.g., "75192-1")
 * @returns The LEGO set or null if not found
 */
export async function fetchSetByNumber(
  apiKey: string,
  setNumber: string
): Promise<LegoSet | null> {
  // Ensure set number has the suffix
  const fullSetNumber = setNumber.includes('-') ? setNumber : `${setNumber}-1`;

  const response = await fetch(`${BASE_URL}/lego/sets/${fullSetNumber}/`, {
    headers: getHeaders(apiKey),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch set: ${response.status}`);
  }

  const rbSet: RebrickableSet = await response.json();

  // Fetch theme name
  const themeResponse = await fetch(
    `${BASE_URL}/lego/themes/${rbSet.theme_id}/`,
    { headers: getHeaders(apiKey) }
  );

  let themeName = 'Unknown';
  if (themeResponse.ok) {
    const theme: RebrickableTheme = await themeResponse.json();
    themeName = theme.name;
  }

  return mapRebrickableSet(rbSet, themeName);
}

/**
 * Search sets by name or number
 * @param apiKey - Your Rebrickable API key
 * @param query - Search query
 * @returns Array of matching sets
 */
export async function searchSets(
  apiKey: string,
  query: string
): Promise<LegoSet[]> {
  const params = new URLSearchParams({
    search: query,
    page_size: '50',
    ordering: '-year',
  });

  const response = await fetch(`${BASE_URL}/lego/sets/?${params}`, {
    headers: getHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(`Failed to search sets: ${response.status}`);
  }

  const data: PaginatedResponse<RebrickableSet> = await response.json();

  // For search, we'll use a simplified theme mapping
  return data.results.map((rbSet) => mapRebrickableSet(rbSet, 'Unknown'));
}

/**
 * Get sets by theme
 * @param apiKey - Your Rebrickable API key
 * @param themeId - Theme ID
 * @param limit - Maximum number of sets to return
 * @returns Array of sets in the theme
 */
export async function fetchSetsByTheme(
  apiKey: string,
  themeId: number,
  limit: number = 100
): Promise<LegoSet[]> {
  return fetchCurrentSets(apiKey, {
    themeId,
    pageSize: Math.min(limit, 500),
    maxPages: Math.ceil(limit / 500),
  });
}

/**
 * Validate an API key by making a simple request
 * @param apiKey - The API key to validate
 * @returns True if valid, false otherwise
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/lego/themes/?page_size=1`, {
      headers: getHeaders(apiKey),
    });
    return response.ok;
  } catch {
    return false;
  }
}
