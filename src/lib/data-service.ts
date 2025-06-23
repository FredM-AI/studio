
import { initializeApp, getApps, credential } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

// Constants for collection names
const PLAYERS_COLLECTION = 'players';
const EVENTS_COLLECTION = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

let db: Firestore;

// --- Initialize Firebase Admin SDK ---
// This logic requires the service account JSON to be set as an environment variable.
const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountEnv) {
  const errorMessage = "🔥 CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set.";
  console.error(errorMessage);
  console.error("This is required for server-side communication with Firestore.");
  console.error("To fix this:");
  console.error("1. Get your service account JSON file from the Firebase Console.");
  console.error("2. Set the entire content of that JSON file as the FIREBASE_SERVICE_ACCOUNT environment variable in your hosting provider.");
  
  // Throw an error to prevent the server from starting improperly.
  throw new Error("Server configuration error: FIREBASE_SERVICE_ACCOUNT is not set.");
}


try {
  // We only initialize the app if it hasn't been initialized yet.
  if (getApps().length === 0) {
    let serviceAccount;
    try {
      // First, try to parse it as a raw JSON string.
      serviceAccount = JSON.parse(serviceAccountEnv);
    } catch (e) {
      // If that fails, assume it's a Base64 encoded string and decode it.
      console.log("Could not parse FIREBASE_SERVICE_ACCOUNT as raw JSON, attempting to decode from Base64.");
      const decodedString = Buffer.from(serviceAccountEnv, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decodedString);
      console.log("Successfully decoded and parsed service account from Base64.");
    }
    
    initializeApp({
      credential: credential.cert(serviceAccount)
    });
  }
  db = getFirestore();
  console.log("✅ Firebase Admin SDK initialized successfully via Service Account.");
} catch (error: any) {
  console.error("🔥 CRITICAL: Firebase Admin SDK initialization failed. The FIREBASE_SERVICE_ACCOUNT might be a malformed or invalid.");
  console.error("🔥 Error details:", error.message);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}


// Export the initialized db instance for use in server actions and data-fetching functions.
export { db };


// --- Data Fetching Functions ---

// Player data functions
export async function getPlayers(): Promise<Player[]> {
  const playersCol = db.collection(PLAYERS_COLLECTION);
  const playerSnapshot = await playersCol.get();
  if (playerSnapshot.empty) {
    console.log("Firestore 'players' collection is empty.");
    return [];
  }
  const playerList = playerSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      isGuest: data.isGuest || false,
      stats: data.stats || { gamesPlayed: 0, wins: 0, finalTables: 0, totalWinnings: 0, totalBuyIns: 0, bestPosition: null, averagePosition: null },
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Player;
  });
  return playerList;
}

// Event data functions
export async function getEvents(): Promise<Event[]> {
  const eventsCol = db.collection(EVENTS_COLLECTION);
  const eventSnapshot = await eventsCol.get();
  if (eventSnapshot.empty) {
      console.log("Firestore 'events' collection is empty.");
      return [];
  }
  const eventList = eventSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      date: data.date,
      buyIn: data.buyIn,
      rebuyPrice: data.rebuyPrice,
      bounties: data.bounties,
      mysteryKo: data.mysteryKo,
      includeBountiesInNet: data.includeBountiesInNet,
      maxPlayers: data.maxPlayers,
      status: data.status,
      seasonId: data.seasonId,
      prizePool: data.prizePool || { total: 0, distributionType: 'automatic', distribution: [] },
      participants: data.participants || [],
      results: data.results || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Event;
  });
  return eventList;
}

// Season data functions
export async function getSeasons(): Promise<Season[]> {
  const seasonsCol = db.collection(SEASONS_COLLECTION);
  const seasonSnapshot = await seasonsCol.get();
  if (seasonSnapshot.empty) {
    console.log("Firestore 'seasons' collection is empty.");
    return [];
  }
  const seasonList = seasonSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      leaderboard: data.leaderboard || [], // Ensure leaderboard is always an array
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Season;
  });
  return seasonList;
}

// Settings data functions
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
  const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
  const settingsSnap = await settingsDocRef.get();
  
  if (settingsSnap.exists) {
    return settingsSnap.data() as AppSettings;
  } else {
    console.log("No global settings found in Firestore. Using and saving defaults.");
    await settingsDocRef.set(defaultSettings);
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const settingsDocRef = db.collection(SETTINGS_COLLECTION).doc(GLOBAL_SETTINGS_DOC_ID);
  await settingsDocRef.set(settings);
}
