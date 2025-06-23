
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, type Firestore, query, where } from 'firebase/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

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
    console.error("🔴 CRITICAL ERROR: Firebase configuration is missing required environment variables.");
    console.error(`The following variables are not set: ${missingEnvVars.join(', ')}`);
    console.error("Please ensure you have set up these environment variables in your Vercel (or other hosting) project settings.");
    console.log("Current config being used (some values may be null or undefined):", firebaseConfig);
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
    console.error("Firestore is not initialized. Cannot fetch players.");
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
    console.error("Firestore is not initialized. Cannot fetch events.");
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
    console.error("Firestore is not initialized. Cannot fetch seasons.");
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
  if (!db) {
    console.error("Firestore is not initialized. Cannot fetch settings.");
    return { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
  }
  const defaultSettings: AppSettings = { theme: 'light', defaultBuyIn: 20, defaultMaxPlayers: 90 };
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
    console.error("Firestore is not initialized. Cannot save settings.");
    throw new Error('Could not save settings to Firestore, DB not initialized.');
  }
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error('Could not save settings to Firestore');
  }
}
