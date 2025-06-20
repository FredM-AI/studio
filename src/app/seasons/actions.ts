
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service'; // Import db
import { collection, doc, setDoc, getDoc, getDocs, writeBatch, query, where } from 'firebase/firestore';
import type { Season, SeasonFormState } from '@/lib/definitions'; // Removed Event
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
};

const SeasonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Season name must be at least 3 characters.' }),
  startDate: z.string().min(1, { message: 'Start date is required.' }),
  endDate: z.string().optional(),
  // Correctly transform isActive: 'on' becomes true, undefined/other becomes false.
  isActive: z.string().optional().transform(val => val === 'on'),
  eventIdsToAssociate: z.preprocess(
    (val) => (typeof val === 'string' && val ? val.split(',').filter(id => id.trim() !== '') : Array.isArray(val) ? val : []),
    z.array(z.string()).optional().default([])
  ),
}).refine(data => {
  if (data.startDate && data.endDate && data.endDate.trim() !== '') {
    try {
      return new Date(data.endDate) >= new Date(data.startDate);
    } catch (e) { return false; } // Invalid date string
  }
  return true;
}, {
  message: 'End date must be on or after start date, and dates must be valid.',
  path: ['endDate'],
})
.refine(data => {
    try {
        new Date(data.startDate).toISOString();
        return true;
    } catch (e) { return false; }
}, { message: 'Invalid start date format.', path: ['startDate']})
.refine(data => {
    if (data.endDate && data.endDate.trim() !== '') {
        try {
            new Date(data.endDate).toISOString();
            return true;
        } catch (e) { return false;}
    }
    return true;
}, { message: 'Invalid end date format.', path: ['endDate']});

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
    startDate: new Date(data.startDate).toISOString(), // Assuming startDate is validated to be a valid date string by refine
    isActive: data.isActive, // Already transformed to boolean by Zod
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (data.endDate && data.endDate.trim() !== '') {
    // Assuming endDate is validated to be a valid date string by refine
    seasonDocData.endDate = new Date(data.endDate).toISOString();
  }

  try {
    const seasonRef = doc(db, SEASONS_COLLECTION, seasonId);
    await setDoc(seasonRef, seasonDocData);

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
    const existingSeason = seasonSnap.data() as SeasonDocumentData; // Use SeasonDocumentData

    const updatedSeasonDocData: SeasonDocumentData = {
        ...existingSeason,
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        isActive: data.isActive, // Already transformed
        updatedAt: new Date().toISOString(),
    };

    if (data.endDate && data.endDate.trim() !== '') {
        updatedSeasonDocData.endDate = new Date(data.endDate).toISOString();
    } else {
        // If endDate was previously set and now is empty, we need to remove it
        // Firestore's `deleteField()` is suitable for this, but `setDoc` with missing field also works.
        // To be explicit with setDoc for overwriting, ensure it's not in the object.
        delete updatedSeasonDocData.endDate;
    }
    
    const batch = writeBatch(db);
    batch.set(seasonRef, updatedSeasonDocData); 

    const eventIdsToAssociateInForm = new Set(data.eventIdsToAssociate || []);
    
    const qAssociatedEvents = query(collection(db, EVENTS_COLLECTION), where("seasonId", "==", seasonIdToUpdate));
    const associatedEventsSnapshot = await getDocs(qAssociatedEvents);
    const currentAssociatedEventIds = new Set(associatedEventsSnapshot.docs.map(d => d.id));

    associatedEventsSnapshot.forEach(eventDoc => {
        if (!eventIdsToAssociateInForm.has(eventDoc.id)) {
            batch.update(eventDoc.ref, { seasonId: null }); 
        }
    });
    
    for (const eventId of eventIdsToAssociateInForm) {
        if (!currentAssociatedEventIds.has(eventId)) {
            const eventRef = doc(db, EVENTS_COLLECTION, eventId);
            batch.update(eventRef, { seasonId: seasonIdToUpdate });
        }
    }
    
    await batch.commit();

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
