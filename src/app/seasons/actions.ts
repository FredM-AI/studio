
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service'; // Import db
import { collection, doc, setDoc, getDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import type { Season, SeasonFormState, Event } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SEASONS_COLLECTION = 'seasons';
const EVENTS_COLLECTION = 'events';

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
  const seasonId = crypto.randomUUID();

  const newSeasonData: Omit<Season, 'leaderboard'> = { // Leaderboard is calculated, not stored directly
    id: seasonId,
    name: data.name,
    startDate: new Date(data.startDate).toISOString(),
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const seasonRef = doc(db, SEASONS_COLLECTION, seasonId);
    await setDoc(seasonRef, newSeasonData);

    // Event association for new seasons:
    // Typically, events are associated during season edit or event edit.
    // If eventIdsToAssociate is populated for a new season, update those events.
    const eventIdsToAssociate = data.eventIdsToAssociate || [];
    if (eventIdsToAssociate.length > 0) {
      const batch = writeBatch(db);
      eventIdsToAssociate.forEach(eventId => {
        const eventRef = doc(db, EVENTS_COLLECTION, eventId);
        batch.update(eventRef, { seasonId: seasonId });
      });
      await batch.commit();
    }

  } catch (error) {
    console.error("Firestore Error creating season:", error);
    return { message: 'Database Error: Failed to create season.' };
  }
  
  revalidatePath('/seasons');
  revalidatePath('/events');
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
  const seasonIdToUpdate = data.id;

  if (!seasonIdToUpdate) {
    return { message: 'Season ID is missing for update.' };
  }

  try {
    const seasonRef = doc(db, SEASONS_COLLECTION, seasonIdToUpdate);
    const seasonSnap = await getDoc(seasonRef);

    if (!seasonSnap.exists()) {
      return { message: 'Season not found in database.' };
    }
    const existingSeason = seasonSnap.data() as Season;

    const updatedSeasonData: Omit<Season, 'leaderboard'> = {
        ...existingSeason,
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
    };
    
    // Prepare batch for Firestore updates
    const batch = writeBatch(db);
    batch.set(seasonRef, updatedSeasonData); // Update season document

    // Handle event association changes
    const eventIdsToAssociateInForm = new Set(data.eventIdsToAssociate || []);
    
    // Fetch events currently associated with this season
    const qAssociatedEvents = query(collection(db, EVENTS_COLLECTION), where("seasonId", "==", seasonIdToUpdate));
    const associatedEventsSnapshot = await getDocs(qAssociatedEvents);
    const currentAssociatedEventIds = new Set(associatedEventsSnapshot.docs.map(d => d.id));

    // Dissociate events: events currently associated but not in form's list
    associatedEventsSnapshot.forEach(eventDoc => {
        if (!eventIdsToAssociateInForm.has(eventDoc.id)) {
            batch.update(eventDoc.ref, { seasonId: null }); // Or deleteField('seasonId')
        }
    });
    
    // Associate new events: events in form's list not currently associated (or associated to another season)
    for (const eventId of eventIdsToAssociateInForm) {
        if (!currentAssociatedEventIds.has(eventId)) {
            const eventRef = doc(db, EVENTS_COLLECTION, eventId);
            // We could check if the event exists, but update will fail if it doesn't
            batch.update(eventRef, { seasonId: seasonIdToUpdate });
        }
    }
    
    await batch.commit(); // Commit all changes (season update and event updates)

  } catch (error) {
     console.error("Error updating season:", error);
     return { message: 'Database Error: Failed to update season.' };
  }

  revalidatePath('/seasons');
  revalidatePath(`/seasons/${seasonIdToUpdate}`);
  revalidatePath(`/seasons/${seasonIdToUpdate}/edit`);
  revalidatePath('/events'); 
  redirect(`/seasons`);
}

// Note: deleteSeason functionality would also need to update associated events,
// potentially unsetting their seasonId or deleting them if they are exclusively part of this season.
// This is not implemented here but is a consideration for complete CRUD.
