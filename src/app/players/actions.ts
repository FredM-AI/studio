
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service'; // Import db
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from 'firebase/firestore';
import type { Player, PlayerFormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const PLAYERS_COLLECTION = 'players';

const PlayerSchema = z.object({
  id: z.string().optional(), // Present for updates, absent for creations
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  avatar: z.string().url({ message: 'Invalid URL for avatar.' }).optional().or(z.literal('')),
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
    // Check for duplicate email in Firestore
    const playersRef = collection(db, PLAYERS_COLLECTION);
    const q = query(playersRef, where("email", "==", data.email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return {
        errors: { email: ['Email already exists.'] },
        message: 'Player creation failed.',
      };
    }

    const playerId = crypto.randomUUID();
    const newPlayer: Player = {
      id: playerId,
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar || undefined,
      isActive: data.isActive,
      stats: {
        gamesPlayed: 0,
        wins: 0,
        finalTables: 0,
        totalWinnings: 0,
        totalBuyIns: 0,
        bestPosition: null,
        averagePosition: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, PLAYERS_COLLECTION, playerId), newPlayer);

  } catch (error) {
    console.error("Firestore Error creating player:", error);
    return { message: 'Database Error: Failed to create player.' };
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
    // Check for duplicate email (excluding the current player)
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
          message: 'Player update failed.',
        };
      }
    }
  
    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return { message: 'Player not found in database.' };
    }
    const existingPlayer = playerSnap.data() as Player;

    const updatedPlayer: Player = {
      ...existingPlayer, // Preserve existing fields like stats and createdAt
      firstName: data.firstName,
      lastName: data.lastName,
      nickname: data.nickname,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar || undefined,
      isActive: data.isActive,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(playerRef, updatedPlayer); // setDoc will overwrite or create if not exists

  } catch (error) {
    console.error("Firestore Error updating player:", error);
    return { message: 'Database Error: Failed to update player.' };
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
    // Optional: Check if document exists before deleting
    // const playerSnap = await getDoc(playerRef);
    // if (!playerSnap.exists()) {
    //   return { message: 'Player not found or already deleted.', success: false };
    // }
    await deleteDoc(playerRef);

    revalidatePath('/players');
    return { message: 'Player deleted successfully.', success: true };
  } catch (error) {
    console.error('Delete Player Error:', error);
    return { message: 'Database Error: Failed to delete player.', success: false };
  }
}
