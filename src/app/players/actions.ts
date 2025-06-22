
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc, writeBatch } from 'firebase/firestore';
import type { Player, PlayerFormState, PlayerStats } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const PLAYERS_COLLECTION = 'players';

// Helper function to remove undefined properties from an object
function cleanUndefinedProperties(obj: any): any {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

const PlayerSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  avatar: z.string().url({ message: 'Invalid URL for avatar.' }).or(z.literal('')).optional(),
  isActive: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(true),
  isGuest: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(false),
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
    
    const newPlayerData: Partial<Player> = { // Using Partial<Player> for type safety during construction
      id: playerId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      isActive: data.isActive,
      isGuest: data.isGuest,
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
      newPlayerData.nickname = data.nickname.trim();
    }
    if (data.phone && data.phone.trim() !== '') {
      newPlayerData.phone = data.phone.trim();
    }
    if (data.avatar && data.avatar.trim() !== '') {
      newPlayerData.avatar = data.avatar.trim();
    }

    await setDoc(doc(db, PLAYERS_COLLECTION, playerId), newPlayerData);

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
      isGuest: data.isGuest,
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


// Schemas for JSON import
const PlayerStatsImportSchema = z.object({
  gamesPlayed: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  finalTables: z.number().int().nonnegative(),
  totalWinnings: z.number().nonnegative(),
  totalBuyIns: z.number().nonnegative(),
  bestPosition: z.number().int().positive().nullable(),
  averagePosition: z.number().nonnegative().nullable(),
});

const PlayerImportEntrySchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID for id." }),
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  nickname: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  avatar: z.string().url({ message: 'Invalid URL for avatar.' }).or(z.literal('')).optional(),
  isActive: z.boolean().default(true),
  isGuest: z.boolean().default(false),
  stats: PlayerStatsImportSchema,
  createdAt: z.string().refine((val) => !isNaN(new Date(val).getTime()), { message: "Invalid createdAt date string." }),
  updatedAt: z.string().refine((val) => !isNaN(new Date(val).getTime()), { message: "Invalid updatedAt date string." }),
});

const ImportPlayersFormSchema = z.object({
  jsonContent: z.string().min(1, {message: "JSON content cannot be empty."})
    .transform((str, ctx) => {
      try {
        const parsed = JSON.parse(str);
        if (!Array.isArray(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "JSON must be an array of players.",
          });
          return z.NEVER;
        }
        const validatedPlayers = z.array(PlayerImportEntrySchema).safeParse(parsed);
        if (!validatedPlayers.success) {
          // Construct a more detailed error message if possible
          let errorMsg = "Invalid player data in JSON. ";
          const fieldErrors = validatedPlayers.error.flatten().fieldErrors;
          const formErrors = validatedPlayers.error.flatten().formErrors;
          
          if (formErrors.length > 0) {
             errorMsg += `General errors: ${formErrors.join(', ')}. `;
          }
          
          // Limit the number of field errors shown to prevent overly long messages
          let count = 0;
          for (const key in fieldErrors) {
              if (count < 3) { // Show errors for up to 3 fields
                // @ts-ignore
                errorMsg += `Field '${key}': ${fieldErrors[key]?.join(', ')}. `;
                count++;
              } else {
                errorMsg += "More field errors exist. ";
                break;
              }
          }

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMsg,
          });
          return z.NEVER;
        }
        return validatedPlayers.data;
      } catch (e) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON format. Could not parse the file.' });
        return z.NEVER;
      }
    }),
});

export type PlayerImportFormState = {
  errors?: {
    jsonContent?: string[];
    _form?: string[];
  };
  message?: string | null;
  successCount?: number;
  skippedCount?: number;
};

export async function importPlayersFromJson(prevState: PlayerImportFormState, formData: FormData): Promise<PlayerImportFormState> {
  const validatedFields = ImportPlayersFormSchema.safeParse({
    jsonContent: formData.get('jsonContent')
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'JSON validation failed.',
    };
  }

  const playersToImport = validatedFields.data.jsonContent;
  let successCount = 0;
  let skippedCount = 0;
  const batch = writeBatch(db);
  const playersRef = collection(db, PLAYERS_COLLECTION);

  try {
    for (const playerJson of playersToImport) {
      // 1. Check if player ID already exists
      const playerDocRefById = doc(db, PLAYERS_COLLECTION, playerJson.id);
      const playerSnapById = await getDoc(playerDocRefById);
      if (playerSnapById.exists()) {
        skippedCount++;
        continue; // Skip if ID exists
      }

      // 2. Check if email already exists
      const qEmail = query(playersRef, where("email", "==", playerJson.email));
      const emailQuerySnapshot = await getDocs(qEmail);
      if (!emailQuerySnapshot.empty) {
        skippedCount++;
        continue; // Skip if email exists
      }
      
      // Prepare player data for Firestore, ensuring all optional fields are handled correctly
      const playerDataForFirestore: Player = {
        id: playerJson.id,
        firstName: playerJson.firstName,
        lastName: playerJson.lastName,
        nickname: (playerJson.nickname && playerJson.nickname.trim() !== '') ? playerJson.nickname.trim() : undefined,
        email: playerJson.email,
        phone: (playerJson.phone && playerJson.phone.trim() !== '') ? playerJson.phone.trim() : undefined,
        avatar: (playerJson.avatar && playerJson.avatar.trim() !== '') ? playerJson.avatar.trim() : undefined,
        isActive: playerJson.isActive,
        isGuest: playerJson.isGuest,
        stats: playerJson.stats, // Assume stats from JSON are complete
        createdAt: new Date(playerJson.createdAt).toISOString(), // Ensure it's a valid ISO string
        updatedAt: new Date(playerJson.updatedAt).toISOString(), // Ensure it's a valid ISO string
      };
      
      batch.set(playerDocRefById, cleanUndefinedProperties(playerDataForFirestore));
      successCount++;
    }

    await batch.commit();
    revalidatePath('/players');
    return { 
        message: `Import completed. ${successCount} players imported successfully. ${skippedCount} players skipped (already exist by ID or email).`,
        successCount,
        skippedCount,
    };

  } catch (error: any) {
    console.error("Firestore Error importing players:", error);
    let errorMessage = 'Database Error: Failed to import players.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { 
      message: errorMessage,
      errors: { _form: [errorMessage] }
    };
  }
}
