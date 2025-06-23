
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, type Firestore } from 'firebase-admin/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

// For JSON fallback
import fs from 'fs/promises';
import path from 'path';

// Constants for collection names
const PLAYERS_COLLECTION = 'players';
const EVENTS_COLLECTION = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

let app: App;
let db: Firestore;
let dbInitialized = false; // Flag to check if DB is initialized

// --- Initialize Firebase Admin SDK ---
// This will automatically use Application Default Credentials in a managed environment like
// Firebase Studio, App Hosting, or Cloud Run. For local development, you may need to
// run `gcloud auth application-default login` in your terminal.
try {
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  dbInitialized = true;
  console.log("✅ Firebase Admin SDK initialized successfully.");

} catch (error: any) {
  console.warn("⚠️ Firebase Admin SDK initialization failed. The app will use local JSON files as a fallback.");
  console.error("➡️ This can happen if you are running locally without authenticating. Try running `gcloud auth application-default login` in your terminal. The error was:", error.message);
  // db remains undefined, and dbInitialized remains false
}


// Export db for use in server actions, but it might be undefined
export { db };

// Helper function to read local JSON data for arrays
async function readJsonArrayFallback<T>(fileName: string): Promise<T[]> {
    console.log(`↪️ Using local fallback for ${fileName}`);
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e: any) {
        console.error(`❌ Failed to read or parse fallback file ${fileName}:`, e.message);
        return [];
    }
}

// Helper function to read local JSON data for a single object
async function readJsonObjectFallback<T>(fileName: string, defaults: T): Promise<T> {
    console.log(`↪️ Using local fallback for ${fileName}`);
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e: any) {
        console.error(`❌ Failed to read or parse fallback file ${fileName}:`, e.message);
        return defaults;
    }
}

// Player data functions
export async function getPlayers(): Promise<Player[]> {
  if (!dbInitialized) {
    return readJsonArrayFallback<Player>('players.json');
  }
  try {
    const playersCol = collection(db, PLAYERS_COLLECTION);
    const playerSnapshot = await getDocs(playersCol);
    if (playerSnapshot.empty) {
        console.log("Firestore 'players' collection is empty. Falling back to local data.");
        return readJsonArrayFallback<Player>('players.json');
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
  } catch (error) {
    console.error("Error fetching players from Firestore:", error);
    console.log("↪️ Falling back to local players.json due to Firestore fetch error.");
    return readJsonArrayFallback<Player>('players.json');
  }
}

// Event data functions
export async function getEvents(): Promise<Event[]> {
  if (!dbInitialized) {
    return readJsonArrayFallback<Event>('events.json');
  }
  try {
    const eventsCol = collection(db, EVENTS_COLLECTION);
    const eventSnapshot = await getDocs(eventsCol);
     if (eventSnapshot.empty) {
        console.log("Firestore 'events' collection is empty. Falling back to local data.");
        return readJsonArrayFallback<Event>('events.json');
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
  } catch (error) {
    console.error("Error fetching events from Firestore:", error);
    console.log("↪️ Falling back to local events.json due to Firestore fetch error.");
    return readJsonArrayFallback<Event>('events.json');
  }
}

// Season data functions
export async function getSeasons(): Promise<Season[]> {
  if (!dbInitialized) {
    return readJsonArrayFallback<Season>('seasons.json');
  }
  try {
    const seasonsCol = collection(db, SEASONS_COLLECTION);
    const seasonSnapshot = await getDocs(seasonsCol);
     if (seasonSnapshot.empty) {
        console.log("Firestore 'seasons' collection is empty. Falling back to local data.");
        return readJsonArrayFallback<Season>('seasons.json');
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
  } catch (error) {
    console.error("Error fetching seasons from Firestore:", error);
    console.log("↪️ Falling back to local seasons.json due to Firestore fetch error.");
    return readJsonArrayFallback<Season>('seasons.json');
  }
}

// Settings data functions
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
  if (!dbInitialized) {
      return readJsonObjectFallback<AppSettings>('settings.json', defaultSettings);
  }
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as AppSettings;
    } else {
      console.log("No global settings found in Firestore. Using and saving defaults.");
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    console.log("↪️ Falling back to local settings.json due to Firestore fetch error.");
    return readJsonObjectFallback<AppSettings>('settings.json', defaultSettings);
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!dbInitialized) {
      console.warn("⚠️ Firestore not initialized. Settings cannot be saved.");
      return;
  }
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error('Could not save settings to Firestore');
  }
}
