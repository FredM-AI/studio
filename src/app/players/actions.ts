'use server';

import { z } from 'zod';
import { getPlayers, savePlayers } from '@/lib/data-service';
import type { Player } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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

export type PlayerFormState = {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phone?: string[];
    avatar?: string[];
    _form?: string[]; // For general form errors
  };
  message?: string | null;
};

export async function createPlayer(prevState: PlayerFormState, formData: FormData): Promise<PlayerFormState> {
  const validatedFields = PlayerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;
  const players = await getPlayers();

  // Check for duplicate email
  if (players.some(player => player.email === data.email)) {
    return {
      errors: { email: ['Email already exists.'] },
      message: 'Player creation failed.',
    };
  }

  const newPlayer: Player = {
    id: crypto.randomUUID(),
    ...data,
    avatar: data.avatar || undefined, // Ensure empty string becomes undefined
    stats: { // Initialize stats
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

  try {
    players.push(newPlayer);
    await savePlayers(players);
  } catch (error) {
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
  if (!data.id) {
    return { message: "Player ID is missing for update." };
  }

  const players = await getPlayers();
  const playerIndex = players.findIndex(p => p.id === data.id);

  if (playerIndex === -1) {
    return { message: 'Player not found.' };
  }

  // Check for duplicate email (excluding the current player)
  if (players.some(player => player.email === data.email && player.id !== data.id)) {
     return {
      errors: { email: ['Email already exists for another player.'] },
      message: 'Player update failed.',
    };
  }
  
  const updatedPlayer: Player = {
    ...players[playerIndex],
    ...data,
    avatar: data.avatar || undefined,
    updatedAt: new Date().toISOString(),
  };

  try {
    players[playerIndex] = updatedPlayer;
    await savePlayers(players);
  } catch (error) {
    return { message: 'Database Error: Failed to update player.' };
  }

  revalidatePath('/players');
  revalidatePath(`/players/${data.id}`);
  revalidatePath(`/players/${data.id}/edit`);
  redirect('/players');
}


export async function deletePlayer(playerId: string): Promise<{ message?: string | null, success?: boolean }> {
  try {
    let players = await getPlayers();
    const initialLength = players.length;
    players = players.filter(p => p.id !== playerId);

    if (players.length === initialLength) {
      return { message: 'Player not found.', success: false };
    }

    await savePlayers(players);
    revalidatePath('/players');
    return { message: 'Player deleted successfully.', success: true };
  } catch (error) {
    return { message: 'Database Error: Failed to delete player.', success: false };
  }
}

