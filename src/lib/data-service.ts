
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

// Import local JSON data as a fallback
import playersData from '@/data/players.json';
import eventsData from '@/data/events.json';
import seasonsData from '@/data/seasons.json';
import settingsData from '@/data/settings.json';

// Constants for collection names
const PLAYERS_COLLECTION = 'players';
const EVENTS_COLLECTION = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC_ID = 'global';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- START: Added for Vercel deployment debugging ---
// Helper to check if the config is valid and log errors if not.
const checkFirebaseConfig = () => {
  const missingEnvVars: string[] = [];
  if (!firebaseConfig.apiKey) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingEnvVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missingEnvVars.length > 0) {
    console.error("🔴 CRITICAL: Firebase config is missing variables.");
    console.error(`Missing: ${missingEnvVars.join(', ')}`);
    console.error("➡️ ACTION: Go to your Vercel project settings > Environment Variables and add the missing NEXT_PUBLIC_FIREBASE_* variables. Committing a .env file to GitHub will not work for production deployments.");
    console.log("Current config (values may be empty):", firebaseConfig);
    return false;
  }
  console.log("✅ Firebase environment variables seem to be correctly set.");
  return true;
};

const isConfigValid = checkFirebaseConfig();
// --- END: Added for Vercel deployment debugging ---

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;

// Only initialize if the config is valid.
if (isConfigValid) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (e) {
      console.error("🔴 Firebase initialization failed:", e);
      // @ts-ignore - db will be undefined, causing downstream functions to fail gracefully (in their try/catch blocks).
      db = undefined;
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
  }
} else {
   console.error("Firebase initialization skipped due to invalid configuration.");
   // @ts-ignore - db will be undefined.
   db = undefined;
}


// Export db for use in server actions
export { db };

// Player data functions
export async function getPlayers(): Promise<Player[]> {
  if (!db) {
    console.warn("⚠️ Firestore not initialized. Falling back to local JSON data for players. Please check your Firebase environment variables on your hosting provider.");
    // @ts-ignore
    return playersData as Player[];
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
    console.warn("⚠️ Firestore not initialized. Falling back to local JSON data for events. Please check your Firebase environment variables on your hosting provider.");
    // @ts-ignore
    return eventsData as Event[];
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
    console.warn("⚠️ Firestore not initialized. Falling back to local JSON data for seasons. Please check your Firebase environment variables on your hosting provider.");
    // @ts-ignore
    return seasonsData as Season[];
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
    console.warn("⚠️ Firestore not initialized. Falling back to local JSON data for settings. Please check your Firebase environment variables on your hosting provider.");
    return settingsData as AppSettings;
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
    console.warn("⚠️ Firestore not initialized. Settings cannot be saved. Please check your Vercel environment variables.");
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
