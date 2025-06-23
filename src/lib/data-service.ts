
import { initializeApp, getApps, type App } from 'firebase-admin/app';
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
// This block will run once when the server starts.
try {
  if (getApps().length === 0) {
    // This uses Application Default Credentials, which is the standard for managed environments
    // like Firebase Studio, App Hosting, or Cloud Run.
    // For local development, ensure `gcloud auth application-default login` has been run.
    initializeApp();
  }
  db = getFirestore();
  console.log("✅ Firebase Admin SDK initialized successfully.");
} catch (error: any) {
  // If initialization fails, log a critical error and stop the process.
  // This is better than a silent failure or hanging.
  console.error("🔥 CRITICAL: Firebase Admin SDK initialization failed. This is a fatal error.");
  console.error("🔥 Ensure your environment is authenticated correctly (e.g., via `gcloud auth`). Error details:", error.message);
  // Re-throwing the error ensures the server process will crash instead of hang, providing a clear failure signal.
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Export the initialized db instance for use in server actions and data-fetching functions.
export { db };


// --- Data Fetching Functions ---
// These functions now assume `db` is successfully initialized. If not, the server would have already crashed.

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
