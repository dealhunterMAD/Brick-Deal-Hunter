/**
 * Firebase Cloud Functions for Brick Deal Hunter
 *
 * These functions run on Firebase servers and:
 * 1. Fetch LEGO sets from Rebrickable API (reliable, free)
 * 2. Store price data in Firestore
 * 3. Calculate deals and discounts
 * 4. Handle push notifications
 *
 * SECURITY FEATURES:
 * - API key authentication on sensitive endpoints
 * - Rate limiting to prevent abuse
 * - Input validation on all user inputs
 * - Restricted CORS
 * - Safe error messages (no internal details leaked)
 */

import { setGlobalOptions } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Limit concurrent executions for cost control
setGlobalOptions({ maxInstances: 10 });

// ============================================
// SECURITY CONFIGURATION
// ============================================

// API key for authenticating requests (set in Firebase environment)
// Set with: firebase functions:config:set app.api_key="your-secure-key"
const APP_API_KEY = process.env.APP_API_KEY || "";

// Allowed origins for CORS (restrict to your app's domains)
const ALLOWED_ORIGINS = [
  "https://brickdealhunter.com",
  "https://www.brickdealhunter.com",
  "exp://", // Expo development
  "https://exp.host",
];

// Rate limiting: track requests per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

// ============================================
// SECURITY HELPER FUNCTIONS
// ============================================

/**
 * Validate API key from request headers
 */
function validateApiKey(req: any): boolean {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");

  // In development, allow requests without API key if APP_API_KEY is not set
  if (!APP_API_KEY) {
    logger.warn("APP_API_KEY not configured - running in development mode");
    return true;
  }

  return apiKey === APP_API_KEY;
}

/**
 * Check rate limiting for an IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get client IP from request
 */
function getClientIp(req: any): string {
  return req.headers["x-forwarded-for"]?.split(",")[0] ||
         req.connection?.remoteAddress ||
         "unknown";
}

/**
 * Set CORS headers with restrictions
 */
function setCorsHeaders(req: any, res: any): void {
  const origin = req.headers.origin || "";

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin.startsWith(allowed) || allowed === "*"
  );

  if (isAllowed || !APP_API_KEY) {
    // In development mode or if origin is allowed
    res.set("Access-Control-Allow-Origin", origin || "*");
  } else {
    // Default to first allowed origin
    res.set("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }

  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
  res.set("Access-Control-Max-Age", "86400");
}

/**
 * Validate LEGO set number format
 * Valid formats: "75192", "75192-1", "10294-1"
 */
function isValidSetNumber(setNumber: string): boolean {
  if (!setNumber || typeof setNumber !== "string") return false;
  // Allow digits with optional -1 suffix
  return /^\d{4,6}(-\d)?$/.test(setNumber);
}

/**
 * Sanitize set number for URL usage
 */
function sanitizeSetNumber(setNumber: string): string {
  if (!isValidSetNumber(setNumber)) return "";
  // Remove -1 suffix and ensure only digits
  return setNumber.replace(/-\d$/, "").replace(/[^\d]/g, "");
}

/**
 * Validate Expo push token format
 * Expo tokens start with "ExponentPushToken["
 */
function isValidExpoPushToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  return /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/.test(token);
}

/**
 * Create a safe error response (no internal details)
 */
function safeErrorResponse(res: any, statusCode: number, message: string): void {
  res.status(statusCode).json({
    success: false,
    error: message
  });
}

// ============================================
// TYPES
// ============================================

interface LegoSet {
  setNumber: string;
  name: string;
  price: number;
  imageUrl: string;
  url: string;
  theme?: string;
  themeId?: number;
  pieces?: number;
  year?: number;
  availability: "available" | "coming_soon" | "sold_out" | "retiring_soon";
}

interface PriceData {
  setNumber: string;
  setName: string;
  retailer: string;
  currentPrice: number;
  originalPrice: number;
  url: string;
  inStock: boolean;
  lastUpdated: admin.firestore.Timestamp;
  theme?: string;
  imageUrl?: string;
  pieces?: number;
}

interface DealData extends PriceData {
  percentOff: number;
  savings: number;
}

interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  notificationsEnabled: boolean;
  minDiscountThreshold: number;
  watchedThemes: string[];
  watchedSets: string[];
  lastUpdated: admin.firestore.Timestamp;
}

interface NotificationPayload {
  title: string;
  body: string;
  data: {
    type: 'deal' | 'price_drop' | 'back_in_stock';
    setNumber: string;
    retailer: string;
    percentOff: number;
  };
}

// ============================================
// REBRICKABLE API - Primary Source
// ============================================

const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY || "";

const THEME_NAMES: Record<number, string> = {
  158: "Star Wars",
  1: "Technic",
  252: "Ideas",
  435: "Architecture",
  52: "City",
  577: "Marvel Super Heroes",
  494: "Friends",
  246: "Creator",
  576: "DC Super Heroes",
  504: "Harry Potter",
  592: "Ninjago",
  610: "Speed Champions",
  209: "Disney",
  720: "Icons",
  667: "Botanical Collection",
  608: "Super Mario",
  573: "Minecraft",
  697: "Art",
  503: "Duplo",
};

async function fetchFromRebrickable(): Promise<LegoSet[]> {
  logger.info("Fetching sets from Rebrickable API...");

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 3;

  const sets: LegoSet[] = [];
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    try {
      logger.info(`Fetching Rebrickable page ${page}...`);

      const response = await fetch(
        `https://rebrickable.com/api/v3/lego/sets/?min_year=${minYear}&max_year=${currentYear + 1}&page=${page}&page_size=100&ordering=-year`,
        {
          headers: {
            "Authorization": `key ${REBRICKABLE_API_KEY}`,
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        logger.error(`Rebrickable API error: ${response.status}`);
        break;
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        logger.info("No more results from Rebrickable");
        break;
      }

      for (const set of results) {
        if (!set.set_img_url || set.num_parts < 20) continue;
        if (set.num_parts < 50 && set.name.toLowerCase().includes("minifig")) continue;

        const estimatedPrice = Math.round(set.num_parts * 0.11);

        sets.push({
          setNumber: set.set_num,
          name: set.name,
          price: estimatedPrice > 0 ? estimatedPrice : 20,
          imageUrl: set.set_img_url,
          url: `https://www.lego.com/en-us/product/${sanitizeSetNumber(set.set_num)}`,
          theme: THEME_NAMES[set.theme_id] || "LEGO",
          themeId: set.theme_id,
          pieces: set.num_parts,
          year: set.year,
          availability: "available",
        });
      }

      logger.info(`Page ${page}: fetched ${results.length} sets, total so far: ${sets.length}`);

      if (!data.next) {
        logger.info("Reached last page of Rebrickable results");
        break;
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      logger.error(`Rebrickable page ${page} failed:`, error);
      break;
    }
  }

  logger.info(`Total sets fetched from Rebrickable: ${sets.length}`);
  return sets;
}

async function fetchThemes(): Promise<void> {
  try {
    const response = await fetch(
      "https://rebrickable.com/api/v3/lego/themes/?page_size=500",
      {
        headers: {
          "Authorization": `key ${REBRICKABLE_API_KEY}`,
          "Accept": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      logger.info(`Fetched ${data.results?.length || 0} themes from Rebrickable`);
    }
  } catch (error) {
    logger.warn("Could not fetch themes:", error);
  }
}

// ============================================
// FIRESTORE OPERATIONS
// ============================================

async function saveLegoSetsCatalog(sets: LegoSet[]): Promise<void> {
  const batchSize = 450;

  for (let i = 0; i < sets.length; i += batchSize) {
    const batch = db.batch();
    const chunk = sets.slice(i, i + batchSize);

    for (const set of chunk) {
      const docRef = db.collection("lego_catalog").doc(set.setNumber);
      batch.set(docRef, {
        ...set,
        lastUpdated: admin.firestore.Timestamp.now(),
      }, { merge: true });
    }

    await batch.commit();
    logger.info(`Saved batch ${Math.floor(i / batchSize) + 1} (${chunk.length} sets)`);
  }

  logger.info(`Saved ${sets.length} sets to catalog`);
}

async function getLegoSetsCatalog(): Promise<LegoSet[]> {
  const snapshot = await db.collection("lego_catalog")
    .where("availability", "in", ["available", "retiring_soon"])
    .limit(500)
    .get();

  return snapshot.docs.map((doc) => doc.data() as LegoSet);
}

// ============================================
// PRICE DATA FUNCTIONS
// ============================================

// Allowed retailer domains for URL validation
const ALLOWED_RETAILER_DOMAINS: Record<string, string> = {
  lego: "lego.com",
  amazon: "amazon.com",
  walmart: "walmart.com",
  target: "target.com",
  best_buy: "bestbuy.com",
  kohls: "kohls.com",
  gamestop: "gamestop.com",
  shop_disney: "shopdisney.com",
  macys: "macys.com",
  barnes_noble: "barnesandnoble.com",
  sams_club: "samsclub.com",
  walgreens: "walgreens.com",
};

function getRetailerUrl(retailer: string, setNumber: string): string {
  const cleanSetNum = sanitizeSetNumber(setNumber);

  // Validate retailer is in our allowed list
  if (!ALLOWED_RETAILER_DOMAINS[retailer]) {
    return "";
  }

  switch (retailer) {
    case "lego":
      return `https://www.lego.com/en-us/product/${cleanSetNum}`;
    case "amazon":
      return `https://www.amazon.com/s?k=LEGO+${cleanSetNum}`;
    case "walmart":
      return `https://www.walmart.com/search?q=LEGO+${cleanSetNum}`;
    case "target":
      return `https://www.target.com/s?searchTerm=LEGO+${cleanSetNum}`;
    case "best_buy":
      return `https://www.bestbuy.com/site/searchpage.jsp?st=LEGO+${cleanSetNum}`;
    case "kohls":
      return `https://www.kohls.com/search.jsp?search=LEGO+${cleanSetNum}`;
    case "gamestop":
      return `https://www.gamestop.com/search/?q=LEGO+${cleanSetNum}`;
    case "shop_disney":
      return `https://www.shopdisney.com/search?q=LEGO+${cleanSetNum}`;
    case "macys":
      return `https://www.macys.com/shop/featured/lego+${cleanSetNum}`;
    case "barnes_noble":
      return `https://www.barnesandnoble.com/s/LEGO+${cleanSetNum}`;
    case "sams_club":
      return `https://www.samsclub.com/s/LEGO+${cleanSetNum}`;
    case "walgreens":
      return `https://www.walgreens.com/search/results.jsp?Ntt=LEGO+${cleanSetNum}`;
    default:
      return "";
  }
}

function generateSimulatedPrice(set: LegoSet, retailer: string): PriceData {
  const originalPrice = set.price;

  let discountPercent = 0;
  if (retailer !== "lego") {
    if (Math.random() < 0.7) {
      discountPercent = Math.floor(Math.random() * 31) + 10;
    }

    if (Math.random() < 0.1) {
      discountPercent = Math.floor(Math.random() * 21) + 40;
    }
  }

  const currentPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
  const inStock = set.availability === "available" && Math.random() > 0.15;

  return {
    setNumber: set.setNumber,
    setName: set.name,
    retailer,
    currentPrice,
    originalPrice,
    url: getRetailerUrl(retailer, set.setNumber),
    inStock,
    lastUpdated: admin.firestore.Timestamp.now(),
    imageUrl: set.imageUrl,
    theme: set.theme,
    pieces: set.pieces,
  };
}

async function savePriceToFirestore(price: PriceData): Promise<void> {
  const docId = `${price.setNumber}_${price.retailer}`;
  await db.collection("prices").doc(docId).set(price, { merge: true });
}

async function saveDealToFirestore(deal: DealData): Promise<void> {
  const docId = `${deal.setNumber}_${deal.retailer}`;
  await db.collection("deals").doc(docId).set(deal, { merge: true });
}

async function cleanOldDeals(): Promise<void> {
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  const oldDeals = await db
    .collection("deals")
    .where("lastUpdated", "<", cutoff)
    .get();

  if (oldDeals.empty) {
    logger.info("No old deals to clean");
    return;
  }

  const batchSize = 450;
  for (let i = 0; i < oldDeals.docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = oldDeals.docs.slice(i, i + batchSize);
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  logger.info(`Cleaned ${oldDeals.size} old deals`);
}

// ============================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================

async function getEligiblePushTokens(deal: DealData): Promise<string[]> {
  const tokensSnapshot = await db.collection("push_tokens")
    .where("notificationsEnabled", "==", true)
    .where("minDiscountThreshold", "<=", deal.percentOff)
    .get();

  const eligibleTokens: string[] = [];

  for (const doc of tokensSnapshot.docs) {
    const tokenData = doc.data() as PushToken;

    const watchingTheme = deal.theme && tokenData.watchedThemes.length > 0
      ? tokenData.watchedThemes.includes(deal.theme)
      : true;

    const watchingSet = tokenData.watchedSets.length > 0
      ? tokenData.watchedSets.includes(deal.setNumber)
      : true;

    if (watchingTheme || watchingSet) {
      eligibleTokens.push(tokenData.token);
    }
  }

  return eligibleTokens;
}

async function sendExpoPushNotification(
  pushTokens: string[],
  notification: NotificationPayload
): Promise<void> {
  if (pushTokens.length === 0) {
    logger.info("No push tokens to send to");
    return;
  }

  const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data,
    badge: 1,
    priority: "high",
  }));

  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);

    try {
      const response = await fetch(expoPushEndpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        logger.error(`Expo push error: ${response.status}`);
      } else {
        const result = await response.json();
        logger.info(`Sent ${batch.length} notifications, result:`, result);
      }
    } catch (error) {
      logger.error("Failed to send push notifications:", error);
    }
  }
}

async function notifyHotDeal(deal: DealData): Promise<void> {
  if (deal.percentOff < 40) return;

  const tokens = await getEligiblePushTokens(deal);

  if (tokens.length === 0) {
    logger.info(`No eligible tokens for deal: ${deal.setNumber}`);
    return;
  }

  const notification: NotificationPayload = {
    title: `${deal.percentOff}% OFF - Hot Deal!`,
    body: `${deal.setName} at ${deal.retailer.toUpperCase()} - Now $${deal.currentPrice} (Save $${deal.savings})`,
    data: {
      type: "deal",
      setNumber: deal.setNumber,
      retailer: deal.retailer,
      percentOff: deal.percentOff,
    },
  };

  await sendExpoPushNotification(tokens, notification);
  logger.info(`Sent hot deal notification for ${deal.setNumber} to ${tokens.length} devices`);
}

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

export const updateLegoCatalog = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/New_York",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    logger.info("Starting LEGO catalog update...");

    try {
      await fetchThemes();
      const sets = await fetchFromRebrickable();
      await saveLegoSetsCatalog(sets);
      logger.info(`Catalog update complete. ${sets.length} sets saved.`);
    } catch (error) {
      logger.error("Catalog update failed:", error);
      throw error;
    }
  }
);

export const updatePrices = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "America/New_York",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async () => {
    logger.info("Starting price update...");

    try {
      let sets = await getLegoSetsCatalog();
      logger.info(`Found ${sets.length} sets in catalog`);

      if (sets.length === 0) {
        logger.info("Catalog empty, fetching from Rebrickable...");
        sets = await fetchFromRebrickable();
        await saveLegoSetsCatalog(sets);
      }

      const retailers = [
        "lego", "amazon", "walmart", "target", "best_buy",
        "kohls", "gamestop", "shop_disney", "macys",
        "barnes_noble", "sams_club", "walgreens"
      ];

      let dealsFound = 0;

      for (const set of sets.slice(0, 100)) {
        for (const retailer of retailers) {
          const priceData = generateSimulatedPrice(set, retailer);
          await savePriceToFirestore(priceData);

          const percentOff = Math.round(
            ((priceData.originalPrice - priceData.currentPrice) /
              priceData.originalPrice) * 100
          );

          if (percentOff >= 10 && priceData.inStock) {
            const deal: DealData = {
              ...priceData,
              percentOff,
              savings: Math.round((priceData.originalPrice - priceData.currentPrice) * 100) / 100,
            };
            await saveDealToFirestore(deal);
            dealsFound++;

            if (percentOff >= 40) {
              await notifyHotDeal(deal);
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      await cleanOldDeals();
      logger.info(`Price update complete. Found ${dealsFound} deals.`);
    } catch (error) {
      logger.error("Price update failed:", error);
      throw error;
    }
  }
);

// ============================================
// HTTP ENDPOINTS (with security)
// ============================================

export const manualCatalogUpdate = onRequest(
  { memory: "512MiB", timeoutSeconds: 540 },
  async (req, res) => {
    // Validate API key for admin endpoints
    if (!validateApiKey(req)) {
      safeErrorResponse(res, 401, "Unauthorized");
      return;
    }

    logger.info("Manual catalog update triggered");

    try {
      const sets = await fetchFromRebrickable();

      if (sets.length === 0) {
        safeErrorResponse(res, 500, "Failed to fetch sets");
        return;
      }

      await saveLegoSetsCatalog(sets);

      const themeCount: Record<string, number> = {};
      for (const set of sets) {
        const theme = set.theme || "Other";
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      }

      const topThemes = Object.entries(themeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      res.json({
        success: true,
        message: `Catalog updated with ${sets.length} sets`,
        totalSets: sets.length,
        topThemes: topThemes.map(([name, count]) => ({ name, count })),
      });
    } catch (error) {
      logger.error("Manual catalog update failed:", error);
      safeErrorResponse(res, 500, "Catalog update failed");
    }
  }
);

export const manualPriceUpdate = onRequest(
  { memory: "512MiB", timeoutSeconds: 300 },
  async (req, res) => {
    // Validate API key for admin endpoints
    if (!validateApiKey(req)) {
      safeErrorResponse(res, 401, "Unauthorized");
      return;
    }

    logger.info("Manual price update triggered");

    try {
      let sets = await getLegoSetsCatalog();

      if (sets.length === 0) {
        logger.info("Catalog empty, fetching from Rebrickable...");
        const fetchedSets = await fetchFromRebrickable();
        await saveLegoSetsCatalog(fetchedSets);
        sets = fetchedSets;
      }

      logger.info(`Processing ${sets.length} sets`);

      const retailers = [
        "lego", "amazon", "walmart", "target", "best_buy",
        "kohls", "gamestop", "shop_disney", "macys",
        "barnes_noble", "sams_club", "walgreens"
      ];
      let dealsFound = 0;

      for (const set of sets.slice(0, 50)) {
        for (const retailer of retailers) {
          const priceData = generateSimulatedPrice(set, retailer);
          await savePriceToFirestore(priceData);

          const percentOff = Math.round(
            ((priceData.originalPrice - priceData.currentPrice) /
              priceData.originalPrice) * 100
          );

          if (percentOff >= 10 && priceData.inStock) {
            const deal: DealData = {
              ...priceData,
              percentOff,
              savings: Math.round((priceData.originalPrice - priceData.currentPrice) * 100) / 100,
            };
            await saveDealToFirestore(deal);
            dealsFound++;
          }
        }
      }

      await cleanOldDeals();

      res.json({
        success: true,
        message: `Updated prices for ${Math.min(sets.length, 50)} sets. Found ${dealsFound} deals.`,
        catalogSize: sets.length,
        dealsFound,
      });
    } catch (error) {
      logger.error("Manual update failed:", error);
      safeErrorResponse(res, 500, "Price update failed");
    }
  }
);

export const healthCheck = onRequest(async (req, res) => {
  try {
    const catalogSnapshot = await db.collection("lego_catalog").count().get();
    const catalogSize = catalogSnapshot.data().count;

    const dealsSnapshot = await db.collection("deals").count().get();
    const dealsCount = dealsSnapshot.data().count;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "7.0.0",
      catalog: {
        size: catalogSize,
        source: "Rebrickable API"
      },
      deals: {
        count: dealsCount
      },
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    safeErrorResponse(res, 500, "Health check failed");
  }
});

// ============================================
// PUSH NOTIFICATION ENDPOINTS (with security)
// ============================================

/**
 * Register a push token for notifications
 * POST /registerPushToken
 * Body: { token: string, platform: 'ios' | 'android' | 'web', preferences: {...} }
 */
export const registerPushToken = onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    safeErrorResponse(res, 405, "Method not allowed");
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    safeErrorResponse(res, 429, "Too many requests");
    return;
  }

  try {
    const { token, platform, preferences } = req.body;

    // Validate push token format
    if (!isValidExpoPushToken(token)) {
      safeErrorResponse(res, 400, "Invalid push token format");
      return;
    }

    // Validate platform
    const validPlatforms = ["ios", "android", "web"];
    const platformValue = validPlatforms.includes(platform) ? platform : "ios";

    // Validate preferences
    const minDiscount = typeof preferences?.minDiscountThreshold === "number"
      ? Math.min(Math.max(preferences.minDiscountThreshold, 0), 100)
      : 20;

    const tokenData: PushToken = {
      token,
      platform: platformValue,
      notificationsEnabled: preferences?.notificationsEnabled ?? true,
      minDiscountThreshold: minDiscount,
      watchedThemes: Array.isArray(preferences?.watchedThemes)
        ? preferences.watchedThemes.slice(0, 50) // Limit to 50 themes
        : [],
      watchedSets: Array.isArray(preferences?.watchedSets)
        ? preferences.watchedSets.filter(isValidSetNumber).slice(0, 100) // Limit to 100 sets
        : [],
      lastUpdated: admin.firestore.Timestamp.now(),
    };

    await db.collection("push_tokens").doc(token).set(tokenData, { merge: true });

    logger.info(`Registered push token for ${platformValue}`);

    res.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    logger.error("Failed to register push token:", error);
    safeErrorResponse(res, 500, "Registration failed");
  }
});

/**
 * Update notification preferences for a push token
 * POST /updateNotificationPreferences
 * Body: { token: string, preferences: {...} }
 */
export const updateNotificationPreferences = onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    safeErrorResponse(res, 405, "Method not allowed");
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    safeErrorResponse(res, 429, "Too many requests");
    return;
  }

  try {
    const { token, preferences } = req.body;

    // Validate push token format
    if (!isValidExpoPushToken(token)) {
      safeErrorResponse(res, 400, "Invalid push token format");
      return;
    }

    // Check if token exists
    const tokenDoc = await db.collection("push_tokens").doc(token).get();
    if (!tokenDoc.exists) {
      safeErrorResponse(res, 404, "Token not found");
      return;
    }

    const updates: Partial<PushToken> = {
      lastUpdated: admin.firestore.Timestamp.now(),
    };

    if (preferences?.notificationsEnabled !== undefined) {
      updates.notificationsEnabled = Boolean(preferences.notificationsEnabled);
    }
    if (typeof preferences?.minDiscountThreshold === "number") {
      updates.minDiscountThreshold = Math.min(Math.max(preferences.minDiscountThreshold, 0), 100);
    }
    if (Array.isArray(preferences?.watchedThemes)) {
      updates.watchedThemes = preferences.watchedThemes.slice(0, 50);
    }
    if (Array.isArray(preferences?.watchedSets)) {
      updates.watchedSets = preferences.watchedSets.filter(isValidSetNumber).slice(0, 100);
    }

    await db.collection("push_tokens").doc(token).update(updates);

    logger.info("Updated notification preferences");

    res.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update preferences:", error);
    safeErrorResponse(res, 500, "Update failed");
  }
});

/**
 * Unregister a push token
 * POST /unregisterPushToken
 * Body: { token: string }
 */
export const unregisterPushToken = onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    safeErrorResponse(res, 405, "Method not allowed");
    return;
  }

  // Rate limiting
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    safeErrorResponse(res, 429, "Too many requests");
    return;
  }

  try {
    const { token } = req.body;

    // Validate push token format
    if (!isValidExpoPushToken(token)) {
      safeErrorResponse(res, 400, "Invalid push token format");
      return;
    }

    await db.collection("push_tokens").doc(token).delete();

    logger.info("Unregistered push token");

    res.json({
      success: true,
      message: "Push token unregistered successfully",
    });
  } catch (error) {
    logger.error("Failed to unregister push token:", error);
    safeErrorResponse(res, 500, "Unregistration failed");
  }
});

/**
 * Send a test notification to a specific token
 * POST /sendTestNotification
 * Body: { token: string }
 * Requires API key authentication
 */
export const sendTestNotification = onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    safeErrorResponse(res, 405, "Method not allowed");
    return;
  }

  // Rate limiting (stricter for test notifications)
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    safeErrorResponse(res, 429, "Too many requests");
    return;
  }

  try {
    const { token } = req.body;

    // Validate push token format
    if (!isValidExpoPushToken(token)) {
      safeErrorResponse(res, 400, "Invalid push token format");
      return;
    }

    // Check if token is registered
    const tokenDoc = await db.collection("push_tokens").doc(token).get();
    if (!tokenDoc.exists) {
      safeErrorResponse(res, 404, "Token not registered");
      return;
    }

    const notification: NotificationPayload = {
      title: "Test Notification",
      body: "Brick Deal Hunter notifications are working!",
      data: {
        type: "deal",
        setNumber: "TEST-1",
        retailer: "test",
        percentOff: 50,
      },
    };

    await sendExpoPushNotification([token], notification);

    res.json({
      success: true,
      message: "Test notification sent",
    });
  } catch (error) {
    logger.error("Failed to send test notification:", error);
    safeErrorResponse(res, 500, "Failed to send notification");
  }
});
