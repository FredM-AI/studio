
'use server';

import { z } from 'zod';
import { getSeasons, saveSeasons } from '@/lib/data-service';
import type { Season, SeasonFormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SeasonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Season name must be at least 3 characters.' }),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
  endDate: z.string().optional(),
  isActive: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(true),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'End date must be on or after start date.',
  path: ['endDate'],
});

export async function createSeason(prevState: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = SeasonSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  const newSeason: Season = {
    id: crypto.randomUUID(),
    name: data.name,
    startDate: new Date(data.startDate).toISOString(),
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    isActive: data.isActive,
    leaderboard: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const seasons = await getSeasons();
    seasons.push(newSeason);
    await saveSeasons(seasons);
  } catch (error) {
    return { message: 'Database Error: Failed to create season.' };
  }
  
  revalidatePath('/seasons');
  redirect('/seasons');
}

// Placeholder for updateSeason action - to be implemented later
export async function updateSeason(prevState: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  // Similar logic to createSeason, but finds and updates existing season
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = SeasonSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }
  
  const data = validatedFields.data;
   if (!data.id) {
    return { message: 'Season ID is missing for update.' };
  }

  try {
    const seasons = await getSeasons();
    const seasonIndex = seasons.findIndex(s => s.id === data.id);

    if (seasonIndex === -1) {
      return { message: 'Season not found.' };
    }
    
    const updatedSeason: Season = {
        ...seasons[seasonIndex],
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
    };
    
    seasons[seasonIndex] = updatedSeason;
    await saveSeasons(seasons);

  } catch (error) {
     return { message: 'Database Error: Failed to update season.' };
  }

  revalidatePath('/seasons');
  revalidatePath(`/seasons/${data.id}`); // Assuming a detail page route
  redirect('/seasons');
}
