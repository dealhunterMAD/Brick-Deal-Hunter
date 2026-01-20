/**
 * Firebase Cloud Functions for Brick Deal Hunter
 *
 * These functions run on Firebase servers and:
 * 1. Fetch LEGO sets from Rebrickable API (reliable, free)
 * 2. Store price data in Firestore
 * 3. Calculate deals and discounts
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

// Get API key from Firebase Functions config or environment variable
// Set with: firebase functions:config:set rebrickable.api_key="your_key"
// Or set REBRICKABLE_API_KEY environment variable in .env.local
const REBRICKABLE_API_KEY = process.env.REBRICKABLE_API_KEY || "";

// Theme ID to name mapping for Rebrickable
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

/**
 * Fetch sets from Rebrickable API - this is the most reliable method
 */
async function fetchFromRebrickable(): Promise<LegoSet[]> {
  logger.info("Fetching sets from Rebrickable API...");

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 3; // Last 3 years of sets

  const sets: LegoSet[] = [];
  let page = 1;
  const maxPages = 10; // Get up to 1000 sets

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
        // Skip sets without images or very small sets
        if (!set.set_img_url || set.num_parts < 20) continue;

        // Skip gear, books, minifigures (usually have -1 pattern but very few parts)
        if (set.num_parts < 50 && set.name.toLowerCase().includes("minifig")) continue;

        // Calculate estimated price (LEGO averages ~$0.11 per piece)
        const estimatedPrice = Math.round(set.num_parts * 0.11);

        sets.push({
          setNumber: set.set_num,
          name: set.name,
          price: estimatedPrice > 0 ? estimatedPrice : 20, // Minimum $20
          imageUrl: set.set_img_url,
          url: `https://www.lego.com/en-us/product/${set.set_num.replace("-1", "")}`,
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

      // Small delay to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      logger.error(`Rebrickable page ${page} failed:`, error);
      break;
    }
  }

  logger.info(`Total sets fetched from Rebrickable: ${sets.length}`);
  return sets;
}

/**
 * Fetch theme information from Rebrickable
 */
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

function getRetailerUrl(retailer: string, setNumber: string): string {
  const cleanSetNum = setNumber.replace("-1", "");

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

  // LEGO.com is always MSRP, other retailers have random discounts
  let discountPercent = 0;
  if (retailer !== "lego") {
    // 70% chance of some discount (10-40%)
    if (Math.random() < 0.7) {
      discountPercent = Math.floor(Math.random() * 31) + 10;
    }

    // 10% chance of big discount (40-60%)
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

/**
 * Get all push tokens that should receive a notification for a deal
 */
async function getEligiblePushTokens(deal: DealData): Promise<string[]> {
  const tokensSnapshot = await db.collection("push_tokens")
    .where("notificationsEnabled", "==", true)
    .where("minDiscountThreshold", "<=", deal.percentOff)
    .get();

  const eligibleTokens: string[] = [];

  for (const doc of tokensSnapshot.docs) {
    const tokenData = doc.data() as PushToken;

    // Check if user is watching this theme or set
    const watchingTheme = deal.theme && tokenData.watchedThemes.length > 0
      ? tokenData.watchedThemes.includes(deal.theme)
      : true; // If no watched themes, send all

    const watchingSet = tokenData.watchedSets.length > 0
      ? tokenData.watchedSets.includes(deal.setNumber)
      : true; // If no watched sets, send all

    // Send if user is watching the theme OR the specific set
    if (watchingTheme || watchingSet) {
      eligibleTokens.push(tokenData.token);
    }
  }

  return eligibleTokens;
}

/**
 * Send push notification via Expo's push service
 */
async function sendExpoPushNotification(
  pushTokens: string[],
  notification: NotificationPayload
): Promise<void> {
  if (pushTokens.length === 0) {
    logger.info("No push tokens to send to");
    return;
  }

  // Expo push notifications endpoint
  const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

  // Create messages for each token
  const messages = pushTokens.map((token) => ({
    to: token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data,
    badge: 1,
    priority: "high",
  }));

  // Send in batches of 100 (Expo limit)
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

/**
 * Send notifications for hot deals (>40% off)
 */
async function notifyHotDeal(deal: DealData): Promise<void> {
  // Only notify for deals > 40% off
  if (deal.percentOff < 40) return;

  const tokens = await getEligiblePushTokens(deal);

  if (tokens.length === 0) {
    logger.info(`No eligible tokens for deal: ${deal.setNumber}`);
    return;
  }

  const notification: NotificationPayload = {
    title: `🔥 ${deal.percentOff}% OFF - Hot Deal!`,
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

            // Send push notification for hot deals (>40% off)
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
// HTTP ENDPOINTS
// ============================================

export const manualCatalogUpdate = onRequest(
  { memory: "512MiB", timeoutSeconds: 540 },
  async (req, res) => {
    logger.info("Manual catalog update triggered");

    try {
      const sets = await fetchFromRebrickable();

      if (sets.length === 0) {
        res.status(500).json({
          success: false,
          error: "No sets fetched from Rebrickable API",
        });
        return;
      }

      await saveLegoSetsCatalog(sets);

      // Count themes
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
        message: `Catalog updated with ${sets.length} sets from Rebrickable`,
        totalSets: sets.length,
        topThemes: topThemes.map(([name, count]) => ({ name, count })),
        sampleSets: sets.slice(0, 10).map(s => ({
          setNumber: s.setNumber,
          name: s.name,
          price: s.price,
          theme: s.theme,
          pieces: s.pieces,
          year: s.year,
          imageUrl: s.imageUrl,
        })),
      });
    } catch (error) {
      logger.error("Manual catalog update failed:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  }
);

export const manualPriceUpdate = onRequest(
  { memory: "512MiB", timeoutSeconds: 300 },
  async (req, res) => {
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
      const sampleDeals: DealData[] = [];

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

            // Keep some sample deals for the response
            if (sampleDeals.length < 5) {
              sampleDeals.push(deal);
            }
          }
        }
      }

      await cleanOldDeals();

      res.json({
        success: true,
        message: `Updated prices for ${Math.min(sets.length, 50)} sets. Found ${dealsFound} deals.`,
        catalogSize: sets.length,
        dealsFound,
        sampleDeals: sampleDeals.map(d => ({
          setNumber: d.setNumber,
          setName: d.setName,
          retailer: d.retailer,
          originalPrice: d.originalPrice,
          currentPrice: d.currentPrice,
          percentOff: d.percentOff,
          savings: d.savings,
        })),
      });
    } catch (error) {
      logger.error("Manual update failed:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  }
);

export const healthCheck = onRequest(async (req, res) => {
  try {
    const catalogSnapshot = await db.collection("lego_catalog").count().get();
    const catalogSize = catalogSnapshot.data().count;

    const dealsSnapshot = await db.collection("deals").count().get();
    const dealsCount = dealsSnapshot.data().count;

    const tokensSnapshot = await db.collection("push_tokens").count().get();
    const tokensCount = tokensSnapshot.data().count;

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "6.0.0",
      catalog: {
        size: catalogSize,
        source: "Rebrickable API"
      },
      deals: {
        count: dealsCount
      },
      pushTokens: {
        count: tokensCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: String(error),
    });
  }
});

// ============================================
// PUSH NOTIFICATION ENDPOINTS
// ============================================

/**
 * Register a push token for notifications
 * POST /registerPushToken
 * Body: { token: string, platform: 'ios' | 'android' | 'web', preferences: {...} }
 */
export const registerPushToken = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { token, platform, preferences } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }

    const tokenData: PushToken = {
      token,
      platform: platform || "ios",
      notificationsEnabled: preferences?.notificationsEnabled ?? true,
      minDiscountThreshold: preferences?.minDiscountThreshold ?? 20,
      watchedThemes: preferences?.watchedThemes ?? [],
      watchedSets: preferences?.watchedSets ?? [],
      lastUpdated: admin.firestore.Timestamp.now(),
    };

    // Use token as document ID for easy lookup
    await db.collection("push_tokens").doc(token).set(tokenData, { merge: true });

    logger.info(`Registered push token for ${platform}`);

    res.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    logger.error("Failed to register push token:", error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Update notification preferences for a push token
 * POST /updateNotificationPreferences
 * Body: { token: string, preferences: {...} }
 */
export const updateNotificationPreferences = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { token, preferences } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }

    const updates: Partial<PushToken> = {
      lastUpdated: admin.firestore.Timestamp.now(),
    };

    if (preferences?.notificationsEnabled !== undefined) {
      updates.notificationsEnabled = preferences.notificationsEnabled;
    }
    if (preferences?.minDiscountThreshold !== undefined) {
      updates.minDiscountThreshold = preferences.minDiscountThreshold;
    }
    if (preferences?.watchedThemes !== undefined) {
      updates.watchedThemes = preferences.watchedThemes;
    }
    if (preferences?.watchedSets !== undefined) {
      updates.watchedSets = preferences.watchedSets;
    }

    await db.collection("push_tokens").doc(token).update(updates);

    logger.info("Updated notification preferences");

    res.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update preferences:", error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Unregister a push token
 * POST /unregisterPushToken
 * Body: { token: string }
 */
export const unregisterPushToken = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invalid push token" });
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
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Send a test notification to a specific token
 * POST /sendTestNotification
 * Body: { token: string }
 */
export const sendTestNotification = onRequest(async (req, res) => {
  // Enable CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }

    const notification: NotificationPayload = {
      title: "🧱 Test Notification",
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
    res.status(500).json({ error: String(error) });
  }
});
