
'use server';

import { z } from 'zod';
import { getSeasons, saveSeasons, getEvents, saveEvents } from '@/lib/data-service';
import type { Season, SeasonFormState, Event } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SeasonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Season name must be at least 3 characters.' }),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
  endDate: z.string().optional(),
  isActive: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(true),
  eventIdsToAssociate: z.preprocess(
    (val) => (typeof val === 'string' && val ? val.split(',').filter(id => id.trim() !== '') : Array.isArray(val) ? val : []),
    z.array(z.string()).optional().default([])
  ),
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
    leaderboard: [], // Leaderboard will be calculated later
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const seasons = await getSeasons();
    seasons.push(newSeason);
    await saveSeasons(seasons);

    // Handle event association (though typically done in update, good to be consistent if needed)
    const eventIdsToAssociate = data.eventIdsToAssociate || [];
    if (eventIdsToAssociate.length > 0) {
      const events = await getEvents();
      const updatedEvents = events.map(event => {
        if (eventIdsToAssociate.includes(event.id)) {
          return { ...event, seasonId: newSeason.id };
        }
        return event;
      });
      await saveEvents(updatedEvents);
    }

  } catch (error) {
    return { message: 'Database Error: Failed to create season.' };
  }
  
  revalidatePath('/seasons');
  revalidatePath('/events'); // Revalidate events in case their seasonId changed
  redirect('/seasons');
}

export async function updateSeason(prevState: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
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

  const seasonIdToUpdate = data.id;

  try {
    const seasons = await getSeasons();
    const seasonIndex = seasons.findIndex(s => s.id === seasonIdToUpdate);

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

    // Handle event association
    const eventIdsToAssociate = data.eventIdsToAssociate || [];
    const allEvents = await getEvents();
    let eventsModified = false;

    const updatedEvents = allEvents.map(event => {
      const isAssociatedInForm = eventIdsToAssociate.includes(event.id);
      const wasAssociatedToThisSeason = event.seasonId === seasonIdToUpdate;

      if (isAssociatedInForm) {
        if (event.seasonId !== seasonIdToUpdate) {
          eventsModified = true;
          return { ...event, seasonId: seasonIdToUpdate };
        }
      } else { // Not associated in form
        if (wasAssociatedToThisSeason) { // Was associated to this season, now needs to be unlinked
          eventsModified = true;
          return { ...event, seasonId: undefined };
        }
      }
      return event;
    });

    if (eventsModified) {
      await saveEvents(updatedEvents);
    }

  } catch (error) {
     console.error("Error updating season:", error);
     return { message: 'Database Error: Failed to update season.' };
  }

  revalidatePath('/seasons');
  revalidatePath(`/seasons/${seasonIdToUpdate}/edit`);
  revalidatePath('/events'); // Revalidate events in case their seasonId changed
  redirect(`/seasons`); // Redirect to seasons list page for now
}
