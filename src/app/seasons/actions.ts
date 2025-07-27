
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import type { SeasonFormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Timestamp } from 'firebase-admin/firestore';

const SEASONS_COLLECTION = 'seasons';
const EVENTS_COLLECTION = 'events';

// Define this type for clarity on what's stored in Firestore for a season
type SeasonDocumentData = {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
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
  
  const seasonDocData: Omit<SeasonDocumentData, 'id' | 'createdAt' | 'updatedAt'> & { endDate?: Timestamp } = {
    name: data.name,
    startDate: Timestamp.fromDate(new Date(data.startDate)),
    isActive: data.isActive, 
  };

  if (data.endDate && data.endDate.trim() !== '') {
    seasonDocData.endDate = Timestamp.fromDate(new Date(data.endDate));
  }

  const finalPayload = {
    id: seasonId,
    ...seasonDocData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  try {
    const seasonRef = db.collection(SEASONS_COLLECTION).doc(seasonId);
    await seasonRef.set(finalPayload);

    // For a new season, eventIdsToAssociate is usually empty from the form
    const eventIdsToAssociate = data.eventIdsToAssociate || [];
    if (eventIdsToAssociate.length > 0) {
      const batch = db.batch();
      eventIdsToAssociate.forEach(eventId => {
        const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
        batch.update(eventRef, { seasonId: seasonId });
      });
      await batch.commit();
    }

  } catch (error) {
    console.error("Firestore Error creating season:", error);
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
    const seasonRef = db.collection(SEASONS_COLLECTION).doc(seasonIdToUpdate);
    const seasonSnap = await seasonRef.get();

    if (!seasonSnap.exists) {
      return { message: 'Season not found in database.' };
    }
    
    const updatedSeasonDocData: any = {
        name: data.name,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        isActive: data.isActive,
        updatedAt: Timestamp.now(),
    };

    if (data.endDate && data.endDate.trim() !== '') {
        updatedSeasonDocData.endDate = Timestamp.fromDate(new Date(data.endDate));
    } else {
        // If endDate is empty, we may want to remove it.
        // Firestore update with `undefined` doesn't remove fields, need to be explicit or use `FieldValue.delete()`
        // For simplicity, we can just set it to null or a known value if business logic allows.
        // Let's assume for now updating with the payload will overwrite, and if we omit `endDate`, it remains.
        // To remove it, one would need FieldValue.delete().
        // For now, if an end date is cleared, we will not include it in the update payload.
    }
    
    const batch = db.batch();
    batch.update(seasonRef, updatedSeasonDocData); 

    const eventIdsToAssociateInForm = new Set(data.eventIdsToAssociate || []);
    
    const qAssociatedEvents = db.collection(EVENTS_COLLECTION).where("seasonId", "==", seasonIdToUpdate);
    const associatedEventsSnapshot = await qAssociatedEvents.get();
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
            const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
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
