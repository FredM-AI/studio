

'use server';

import type { Player, Event, Season, AppSettings, BlindStructureTemplate } from './definitions';
import { db } from './firebase';
import type { Timestamp } from 'firebase-admin/firestore';

// Constants for collection names
const PLAYERS_COLLECTION = 'players';
const EVENTS_COLlection = 'events';
const SEASONS_COLLECTION = 'seasons';
const SETTINGS_COLLECTION = 'settings';
const BLIND_STRUCTURES_COLLECTION = 'blindStructures';
const GLOBAL_SETTINGS_DOC_ID = 'global';

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
      stats: data.stats || { gamesPlayed: 0, wins: 0, winRate: 0, finalTables: 0, itmRate: 0, totalWinnings: 0, totalBuyIns: 0, bestPosition: null, averagePosition: null, seasonStats: {}, profitEvolution: [] },
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Player;
  });
  return playerList;
}

// Event data functions
export async function getEvents(): Promise<Event[]> {
  const eventsCol = db.collection(EVENTS_COLlection);
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
      startingStack: data.startingStack,
      status: data.status,
      seasonId: data.seasonId,
      prizePool: data.prizePool || { total: 0, distributionType: 'automatic', distribution: [] },
      blindStructureId: data.blindStructureId,
      blindStructure: data.blindStructure,
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
    
    // Helper to safely convert a Firestore Timestamp or a string to an ISO string
    const toISOString = (dateValue: any): string | undefined => {
      if (!dateValue) return undefined;
      // Check if it's a Firestore Timestamp
      if (typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toISOString();
      }
      // If it's already a string, assume it's in a valid format
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toISOString();
      }
      return undefined;
    };


    return {
      id: doc.id,
      name: data.name,
      startDate: toISOString(data.startDate),
      endDate: toISOString(data.endDate),
      isActive: data.isActive,
      leaderboard: data.leaderboard || [], // Ensure leaderboard is always an array
      createdAt: toISOString(data.createdAt),
      updatedAt: toISOString(data.updatedAt),
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

// Blind Structures
export async function getBlindStructures(): Promise<BlindStructureTemplate[]> {
    const blindCol = db.collection(BLIND_STRUCTURES_COLLECTION);
    const blindSnapshot = await blindCol.get();
    if (blindSnapshot.empty) {
        console.log("Firestore 'blindStructures' collection is empty.");
        // We'll read from the JSON file as a fallback
        try {
            const blindsData = await import('@/data/blinds.json');
            const blinds: BlindStructureTemplate[] = blindsData.default || blindsData;
            
            // Let's write this to Firestore so it exists for next time
            const batch = db.batch();
            blinds.forEach(structure => {
                const docRef = blindCol.doc(structure.id);
                batch.set(docRef, structure);
            });
            await batch.commit();
            console.log("Written default blind structures to Firestore.");

            return blinds;
        } catch (e) {
            console.error("Could not read fallback blinds.json file.", e);
            return [];
        }
    }
    const blindList = blindSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            levels: data.levels || [],
            startingStack: data.startingStack
        } as BlindStructureTemplate;
    });
    return blindList;
}

export async function saveBlindStructure(structure: BlindStructureTemplate): Promise<void> {
    const blindDocRef = db.collection(BLIND_STRUCTURES_COLLECTION).doc(structure.id);
    await blindDocRef.set(structure);
}

export async function deleteBlindStructure(structureId: string): Promise<{ success: boolean, message?: string }> {
    if (!structureId) {
        return { success: false, message: 'Structure ID is required for deletion.' };
    }
    try {
        await db.collection(BLIND_STRUCTURES_COLLECTION).doc(structureId).delete();
        return { success: true };
    } catch (error) {
        console.error("Error deleting blind structure from Firestore:", error);
        return { success: false, message: 'Database error while deleting structure.' };
    }
}
