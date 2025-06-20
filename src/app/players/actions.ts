
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service'; // Import db
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import type { Player, PlayerFormState, PlayerStats } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const PLAYERS_COLLECTION = 'players';

// Helper function to remove undefined properties from an object
function cleanUndefinedProperties(obj: any): any {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  }
  return newObj;
}

const PlayerSchema = z.object({
  id: z.string().optional(), // Present for updates, absent for creations
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  avatar: z.string().url({ message: 'Invalid URL for avatar.' }).or(z.literal('')).optional(),
  isActive: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(true),
});

export async function createPlayer(prevState: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  const validatedFields = PlayerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  try {
    const playersRef = collection(db, PLAYERS_COLLECTION);
    const q = query(playersRef, where("email", "==", data.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return {
        errors: { email: ['Email already exists.'] },
        message: 'Player creation failed due to duplicate email.',
      };
    }

    const playerId = crypto.randomUUID();
    
    const newPlayerDataForFirestore: any = {
      id: playerId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: data.isActive,
      stats: {
        gamesPlayed: 0,
        wins: 0,
        finalTables: 0,
        totalWinnings: 0,
        totalBuyIns: 0,
        bestPosition: null,
        averagePosition: null,
      } as PlayerStats,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (data.nickname && data.nickname.trim() !== '') {
      newPlayerDataForFirestore.nickname = data.nickname.trim();
    }
    if (data.phone && data.phone.trim() !== '') {
      newPlayerDataForFirestore.phone = data.phone.trim();
    }
    if (data.avatar && data.avatar.trim() !== '') {
      newPlayerDataForFirestore.avatar = data.avatar.trim();
    }

    await setDoc(doc(db, PLAYERS_COLLECTION, playerId), newPlayerDataForFirestore);

  } catch (error: any) {
    console.error("Firestore Error creating player:", error);
    let errorMessage = 'Database Error: Failed to create player.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    if (error && error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }
    return { message: errorMessage };
  }
  
  revalidatePath('/players');
  redirect('/players');
}

export async function updatePlayer(prevState: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  const validatedFields = PlayerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }
  
  const data = validatedFields.data;
  const playerId = data.id;

  if (!playerId) {
    return { message: "Player ID is missing for update." };
  }

  try {
    const playersRef = collection(db, PLAYERS_COLLECTION);
    const q = query(playersRef, where("email", "==", data.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      let duplicateFound = false;
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== playerId) {
          duplicateFound = true;
        }
      });
      if (duplicateFound) {
        return {
          errors: { email: ['Email already exists for another player.'] },
          message: 'Player update failed due to duplicate email.',
        };
      }
    }
  
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return { message: 'Player not found in database.' };
    }
    const existingPlayer = playerSnap.data() as Player;

    const playerToSave: Player = {
      ...existingPlayer, 
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: (data.nickname && data.nickname.trim() !== '') ? data.nickname.trim() : undefined,
      email: data.email,
      phone: (data.phone && data.phone.trim() !== '') ? data.phone.trim() : undefined,
      avatar: (data.avatar && data.avatar.trim() !== '') ? data.avatar.trim() : undefined,
      isActive: data.isActive,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(playerRef, cleanUndefinedProperties(playerToSave)); 

  } catch (error: any) {
    console.error("Firestore Error updating player:", error);
    let errorMessage = 'Database Error: Failed to update player.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    if (error && error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }
    return { message: errorMessage };
  }

  revalidatePath('/players');
  revalidatePath(`/players/${playerId}`);
  revalidatePath(`/players/${playerId}/edit`);
  redirect('/players');
}

export async function deletePlayer(playerId: string): Promise<{ message?: string | null, success?: boolean }> {
  if (!playerId) {
    return { message: 'Player ID is required for deletion.', success: false };
  }
  try {
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    await deleteDoc(playerRef);

    revalidatePath('/players');
    return { message: 'Player deleted successfully.', success: true };
  } catch (error: any) {
    console.error('Delete Player Error:', error);
    let errorMessage = 'Database Error: Failed to delete player.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    if (error && error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }
    return { message: errorMessage, success: false };
  }
}
