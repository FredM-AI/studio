
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
    throw new Error("The FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side authentication with Firestore. On Vercel or Firebase App Hosting, this must be set in the project settings, not in a file.");
  }

  const serviceAccount = JSON.parse(serviceAccountString);

  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
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
  // db remains undefined, subsequent calls will throw an error.
}


// Export db for use in server actions
export { db };

function checkDb() {
    if (!db) {
        // This is the user-facing error. It will be shown on the Next.js error page.
        throw new Error("Database connection failed. The 'FIREBASE_SERVICE_ACCOUNT' environment variable is likely missing or misconfigured. Please check your hosting provider's settings and review the server logs for detailed initialization errors.");
    }
}


// Player data functions
export async function getPlayers(): Promise<Player[]> {
  checkDb();
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
    throw new Error("Failed to fetch players from Firestore.");
  }
}

// Event data functions
export async function getEvents(): Promise<Event[]> {
  checkDb();
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
    throw new Error("Failed to fetch events from Firestore.");
  }
}

// Season data functions
export async function getSeasons(): Promise<Season[]> {
  checkDb();
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
    throw new Error("Failed to fetch seasons from Firestore.");
  }
}

// Settings data functions
export async function getSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
  checkDb();
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
    // It's safer to return defaults for settings than to crash the app
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  checkDb();
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error('Could not save settings to Firestore');
  }
}
