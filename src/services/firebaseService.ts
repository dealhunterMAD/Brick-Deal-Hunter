// ============================================
// FIREBASE SERVICE
// ============================================
// Handles communication with Firebase for:
// - Firestore: Storing and retrieving price data
// - Auth: (Optional) User authentication
// - Messaging: Push notifications
//
// Setup instructions:
// 1. Create a project at https://console.firebase.google.com
// 2. Enable Firestore Database
// 3. Copy your config from Project Settings > General > Your apps

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { Deal, PricePoint, LegoSet, RetailerId } from '../types';

/**
 * Firebase configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyBUAS9Hf6d_9xUIqDlbT_A1FhW8cPS7LQE",
  authDomain: "brick-deal-hunter.firebaseapp.com",
  projectId: "brick-deal-hunter",
  storageBucket: "brick-deal-hunter.firebasestorage.app",
  messagingSenderId: "247281783147",
  appId: "1:247281783147:web:381482bb20220fa6cf7c2e"
};

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/**
 * Initialize Firebase
 * Call this once at app startup
 */
export function initializeFirebase(config?: typeof firebaseConfig): void {
  if (getApps().length === 0) {
    app = initializeApp(config || firebaseConfig);
    db = getFirestore(app);
  }
}

/**
 * Get Firestore instance
 */
function getDb(): Firestore {
  if (!db) {
    initializeFirebase();
    db = getFirestore();
  }
  return db;
}

// ============================================
// PRICE DATA OPERATIONS
// ============================================

/**
 * Collection names in Firestore
 */
const COLLECTIONS = {
  PRICES: 'prices',
  SETS: 'sets',
  DEALS: 'deals',
  PRICE_HISTORY: 'price_history',
};

/**
 * Get the latest prices for a specific set
 * @param setNumber - The LEGO set number
 * @returns Array of price points from different retailers
 */
export async function getSetPrices(setNumber: string): Promise<PricePoint[]> {
  const db = getDb();
  const pricesRef = collection(db, COLLECTIONS.PRICES);

  const q = query(
    pricesRef,
    where('setNumber', '==', setNumber),
    orderBy('lastUpdated', 'desc')
  );

  const snapshot = await getDocs(q);
  const prices: PricePoint[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    prices.push({
      setNumber: data.setNumber,
      retailer: data.retailer as RetailerId,
      currentPrice: data.currentPrice,
      originalPrice: data.originalPrice,
      url: data.url,
      lastUpdated: data.lastUpdated.toDate(),
      inStock: data.inStock,
    });
  });

  return prices;
}

/**
 * Get all current deals (sets with discounts)
 * @param minDiscount - Minimum discount percentage
 * @param limitCount - Maximum number of deals to return
 * @returns Array of deals
 */
export async function getDeals(
  minDiscount: number = 0,
  limitCount: number = 100
): Promise<Deal[]> {
  const db = getDb();
  const dealsRef = collection(db, COLLECTIONS.DEALS);

  const q = query(
    dealsRef,
    where('percentOff', '>=', minDiscount),
    orderBy('percentOff', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const deals: Deal[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    deals.push({
      set: {
        setNumber: data.setNumber,
        name: data.setName,
        year: data.year,
        theme: data.theme,
        themeId: data.themeId,
        numParts: data.numParts,
        imageUrl: data.imageUrl,
        msrp: data.msrp,
        isActive: true,
      },
      price: {
        setNumber: data.setNumber,
        retailer: data.retailer as RetailerId,
        currentPrice: data.currentPrice,
        originalPrice: data.originalPrice,
        url: data.url,
        lastUpdated: data.lastUpdated.toDate(),
        inStock: data.inStock,
      },
      percentOff: data.percentOff,
      savings: data.savings,
    });
  });

  return deals;
}

/**
 * Get deals by theme
 * @param themeId - Theme ID
 * @param limitCount - Maximum number of deals
 * @returns Array of deals in the theme
 */
export async function getDealsByTheme(
  themeId: number,
  limitCount: number = 50
): Promise<Deal[]> {
  const db = getDb();
  const dealsRef = collection(db, COLLECTIONS.DEALS);

  const q = query(
    dealsRef,
    where('themeId', '==', themeId),
    orderBy('percentOff', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const deals: Deal[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    deals.push({
      set: {
        setNumber: data.setNumber,
        name: data.setName,
        year: data.year,
        theme: data.theme,
        themeId: data.themeId,
        numParts: data.numParts,
        imageUrl: data.imageUrl,
        msrp: data.msrp,
        isActive: true,
      },
      price: {
        setNumber: data.setNumber,
        retailer: data.retailer as RetailerId,
        currentPrice: data.currentPrice,
        originalPrice: data.originalPrice,
        url: data.url,
        lastUpdated: data.lastUpdated.toDate(),
        inStock: data.inStock,
      },
      percentOff: data.percentOff,
      savings: data.savings,
    });
  });

  return deals;
}

/**
 * Get price history for a set
 * @param setNumber - The set number
 * @param days - Number of days of history
 * @returns Array of historical prices
 */
export async function getPriceHistory(
  setNumber: string,
  days: number = 30
): Promise<Array<{ date: Date; price: number; retailer: RetailerId }>> {
  const db = getDb();
  const historyRef = collection(db, COLLECTIONS.PRICE_HISTORY);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    historyRef,
    where('setNumber', '==', setNumber),
    where('date', '>=', Timestamp.fromDate(startDate)),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  const history: Array<{ date: Date; price: number; retailer: RetailerId }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    history.push({
      date: data.date.toDate(),
      price: data.price,
      retailer: data.retailer as RetailerId,
    });
  });

  return history;
}

/**
 * Save a new price point (called by Cloud Functions)
 * This is typically called by the scraper, not the app
 */
export async function savePricePoint(price: PricePoint): Promise<void> {
  const db = getDb();
  const docId = `${price.setNumber}_${price.retailer}`;

  await setDoc(doc(db, COLLECTIONS.PRICES, docId), {
    ...price,
    lastUpdated: Timestamp.fromDate(price.lastUpdated),
  });
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return true; // Firebase is now configured
}

// ============================================
// MOCK DATA FOR DEVELOPMENT
// ============================================

/**
 * Get mock deals for development/demo
 * Use this when Firebase is not configured
 */
export function getMockDeals(): Deal[] {
  const mockDeals: Deal[] = [
    {
      set: {
        setNumber: '75192-1',
        name: 'Millennium Falcon',
        year: 2024,
        theme: 'Star Wars',
        themeId: 158,
        numParts: 7541,
        imageUrl: 'https://images.brickset.com/sets/images/75192-1.jpg',
        msrp: 849.99,
        isActive: true,
      },
      price: {
        setNumber: '75192-1',
        retailer: 'amazon',
        currentPrice: 679.99,
        originalPrice: 849.99,
        url: 'https://www.amazon.com/dp/B075SDMMMV',
        lastUpdated: new Date(),
        inStock: true,
      },
      percentOff: 20,
      savings: 170,
    },
    {
      set: {
        setNumber: '10497-1',
        name: 'Galaxy Explorer',
        year: 2024,
        theme: 'Icons',
        themeId: 695,
        numParts: 1254,
        imageUrl: 'https://images.brickset.com/sets/images/10497-1.jpg',
        msrp: 99.99,
        isActive: true,
      },
      price: {
        setNumber: '10497-1',
        retailer: 'walmart',
        currentPrice: 69.99,
        originalPrice: 99.99,
        url: 'https://www.walmart.com/ip/LEGO-Galaxy-Explorer',
        lastUpdated: new Date(),
        inStock: true,
      },
      percentOff: 30,
      savings: 30,
    },
    {
      set: {
        setNumber: '76240-1',
        name: 'Batmobile Tumbler',
        year: 2024,
        theme: 'DC',
        themeId: 435,
        numParts: 2049,
        imageUrl: 'https://images.brickset.com/sets/images/76240-1.jpg',
        msrp: 269.99,
        isActive: true,
      },
      price: {
        setNumber: '76240-1',
        retailer: 'target',
        currentPrice: 161.99,
        originalPrice: 269.99,
        url: 'https://www.target.com/p/lego-batmobile-tumbler',
        lastUpdated: new Date(),
        inStock: true,
      },
      percentOff: 40,
      savings: 108,
    },
    {
      set: {
        setNumber: '42143-1',
        name: 'Ferrari Daytona SP3',
        year: 2024,
        theme: 'Technic',
        themeId: 1,
        numParts: 3778,
        imageUrl: 'https://images.brickset.com/sets/images/42143-1.jpg',
        msrp: 449.99,
        isActive: true,
      },
      price: {
        setNumber: '42143-1',
        retailer: 'lego',
        currentPrice: 359.99,
        originalPrice: 449.99,
        url: 'https://www.lego.com/product/ferrari-daytona-sp3-42143',
        lastUpdated: new Date(),
        inStock: true,
      },
      percentOff: 20,
      savings: 90,
    },
    {
      set: {
        setNumber: '76419-1',
        name: 'Hogwarts Castle and Grounds',
        year: 2024,
        theme: 'Harry Potter',
        themeId: 246,
        numParts: 2660,
        imageUrl: 'https://images.brickset.com/sets/images/76419-1.jpg',
        msrp: 169.99,
        isActive: true,
      },
      price: {
        setNumber: '76419-1',
        retailer: 'barnes_noble',
        currentPrice: 101.99,
        originalPrice: 169.99,
        url: 'https://www.barnesandnoble.com/w/lego-hogwarts',
        lastUpdated: new Date(),
        inStock: false,
      },
      percentOff: 40,
      savings: 68,
    },
  ];

  return mockDeals;
}
