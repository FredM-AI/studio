
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, type Firestore, query, where } from 'firebase/firestore';
import type { Player, Event, Season, AppSettings } from './definitions';

// Your web app's Firebase configuration
// It's highly recommended to use environment variables for this
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);

// Export db for use in server actions
export { db };

const PLAYERS_COLLECTION = 'players';
const EVENTS_COLLECTION = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC_ID = 'appGlobalSettings';


// Player data functions
export async function getPlayers(): Promise<Player[]> {
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
  try {
    const settingsDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC_ID);
    await setDoc(settingsDocRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error('Could not save settings to Firestore');
  }
}
