
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, type Firestore } from 'firebase-admin/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

// Constants for collection names
const PLAYERS_COLLECTION = 'players';
const EVENTS_COLLECTION = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

let app: App;
let db: Firestore;

// --- Initialize Firebase Admin SDK ---
// This uses a service account for server-side authentication.
// It's more secure and appropriate for backend operations than API keys.

try {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    throw new Error("The FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side authentication with Firestore. Go to your hosting provider (e.g., Vercel, App Hosting) and set this variable with the JSON content of your service account key.");
  }

  const serviceAccount = JSON.parse(serviceAccountString);

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized successfully.");
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);

} catch (error: any) {
  console.error("🔴 CRITICAL: Firebase Admin SDK initialization failed.");
  if (error.message.includes("JSON.parse")) {
    console.error("➡️ The FIREBASE_SERVICE_ACCOUNT environment variable does not seem to be valid JSON.");
  } else {
    console.error("➡️", error.message);
  }
  // If initialization fails, db will be undefined, and subsequent calls will fail.
  // @ts-ignore
  db = undefined;
}


// Export db for use in server actions
export { db };

// Player data functions
export async function getPlayers(): Promise<Player[]> {
  if (!db) {
    console.error("⚠️ Firestore not initialized. Players cannot be fetched. Check server logs for initialization errors.");
    return [];
  }
  try {
    const playersCol = collection(db, PLAYERS_COLLECTION);
    const playerSnapshot = await getDocs(playersCol);
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
    console.error("Error fetching players:", error);
    return [];
  }
}

// Event data functions
export async function getEvents(): Promise<Event[]> {
  if (!db) {
    console.error("⚠️ Firestore not initialized. Events cannot be fetched. Check server logs for initialization errors.");
    return [];
  }
  try {
    const eventsCol = collection(db, EVENTS_COLLECTION);
    const eventSnapshot = await getDocs(eventsCol);
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
    console.error("Error fetching events:", error);
    return [];
  }
}

// Season data functions
export async function getSeasons(): Promise<Season[]> {
  if (!db) {
     console.error("⚠️ Firestore not initialized. Seasons cannot be fetched. Check server logs for initialization errors.");
    return [];
  }
  try {
    const seasonsCol = collection(db, SEASONS_COLLECTION);
    const seasonSnapshot = await getDocs(seasonsCol);
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
    console.error("Error fetching seasons:", error);
    return [];
  }
}

// Settings data functions
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
  if (!db) {
    console.error("⚠️ Firestore not initialized. Settings cannot be fetched. Returning defaults. Check server logs for initialization errors.");
    return defaultSettings;
  }
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsDocRef);
    if (settingsSnap.exists()) {
      return settingsSnap.data() as AppSettings;
    } else {
      await setDoc(settingsDocRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!db) {
    console.warn("⚠️ Firestore not initialized. Settings cannot be saved. Check server logs for initialization errors.");
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
