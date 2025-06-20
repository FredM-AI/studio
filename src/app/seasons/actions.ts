
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service'; // Import db
import { collection, doc, setDoc, getDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import type { SeasonFormState } from '@/lib/definitions'; // Removed Event, Season (as SeasonDocumentData is used internally)
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SEASONS_COLLECTION = 'seasons';
const EVENTS_COLLECTION = 'events';

// Define this type for clarity on what's stored in Firestore for a season
type SeasonDocumentData = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // leaderboards are calculated, not stored directly in the season document
};

const SeasonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Season name must be at least 3 characters.' }),
  startDate: z.string().min(1, { message: 'Start date is required.' })
    .refine(val => !isNaN(new Date(val).getTime()), { message: "Invalid start date format."}),
  endDate: z.string().optional()
    .refine(val => !val || val.trim() === '' || !isNaN(new Date(val).getTime()), { message: "Invalid end date format."}),
  isActive: z.preprocess((val) => val === 'on' || val === true, z.boolean().default(false)),
  eventIdsToAssociate: z.preprocess(
    (val) => (typeof val === 'string' && val ? val.split(',').filter(id => id.trim() !== '') : Array.isArray(val) ? val : []),
    z.array(z.string()).optional().default([])
  ),
}).refine(data => {
  if (data.startDate && data.endDate && data.endDate.trim() !== '') {
    try {
      return new Date(data.endDate) >= new Date(data.startDate);
    } catch (e) { return false; }
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
    console.error("Season validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;
  const seasonId = crypto.randomUUID();

  const seasonDocData: SeasonDocumentData = {
    id: seasonId,
    name: data.name,
    startDate: new Date(data.startDate).toISOString(),
    isActive: data.isActive, // Correctly a boolean from Zod preprocess
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (data.endDate && data.endDate.trim() !== '') {
    seasonDocData.endDate = new Date(data.endDate).toISOString();
  }

  try {
    const seasonRef = doc(db, SEASONS_COLLECTION, seasonId);
    await setDoc(seasonRef, seasonDocData);

    // For a new season, eventIdsToAssociate is usually empty from the form
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
    // Check the server console for detailed Firestore error message
    return { message: 'Database Error: Failed to create season. Check server logs and Firestore permissions.' };
  }
  
  revalidatePath('/seasons');
  revalidatePath('/events'); // if events might have been associated
  redirect('/seasons');
}

export async function updateSeason(prevState: SeasonFormState, formData: FormData): Promise<SeasonFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = SeasonSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Season update validation errors:", validatedFields.error.flatten().fieldErrors);
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
    const existingSeason = seasonSnap.data() as SeasonDocumentData;

    const updatedSeasonDocData: SeasonDocumentData = {
        ...existingSeason,
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        isActive: data.isActive,
        updatedAt: new Date().toISOString(),
    };

    if (data.endDate && data.endDate.trim() !== '') {
        updatedSeasonDocData.endDate = new Date(data.endDate).toISOString();
    } else {
        delete updatedSeasonDocData.endDate; // Remove if it's now empty
    }
    
    const batch = writeBatch(db);
    batch.set(seasonRef, updatedSeasonDocData); 

    const eventIdsToAssociateInForm = new Set(data.eventIdsToAssociate || []);
    
    const qAssociatedEvents = query(collection(db, EVENTS_COLLECTION), where("seasonId", "==", seasonIdToUpdate));
    const associatedEventsSnapshot = await getDocs(qAssociatedEvents);
    const currentAssociatedEventIdsDB = new Set(associatedEventsSnapshot.docs.map(d => d.id));

    // Dissociate events: events currently linked in DB but not in form's list
    associatedEventsSnapshot.forEach(eventDoc => {
        if (!eventIdsToAssociateInForm.has(eventDoc.id)) {
            batch.update(eventDoc.ref, { seasonId: null }); 
        }
    });
    
    // Associate new events: events in form's list but not currently linked in DB
    for (const eventId of eventIdsToAssociateInForm) {
        if (!currentAssociatedEventIdsDB.has(eventId)) {
            const eventRef = doc(db, EVENTS_COLLECTION, eventId);
            batch.update(eventRef, { seasonId: seasonIdToUpdate });
        }
    }
    
    await batch.commit();

  } catch (error) {
     console.error("Error updating season:", error);
     return { message: 'Database Error: Failed to update season. Check server logs and Firestore permissions.' };
  }

  revalidatePath('/seasons');
  revalidatePath(`/seasons/${seasonIdToUpdate}`);
  revalidatePath(`/seasons/${seasonIdToUpdate}/edit`);
  revalidatePath('/events'); 
  redirect(`/seasons`); // Redirect to seasons list page after successful update
}

// Note: A deleteSeason action would also need to handle dissociating events.
// For now, focusing on create/update.

