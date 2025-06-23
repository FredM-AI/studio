
'use server';

import { z } from 'zod';
import { db } from '@/lib/data-service';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase-admin/firestore';
import type { Event, EventStatus } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EventFormState } from '@/lib/definitions';

const EVENTS_COLLECTION = 'events'; // Define the constant here

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

const EventResultInputSchema = z.object({
  playerId: z.string().min(1),
  position: z.coerce.number().int().min(1, { message: "Position must be 1 or greater." }),
  prize: z.coerce.number().int().min(0, { message: "Prize must be 0 or greater." }),
  rebuys: z.coerce.number().int().min(0, {message: "Rebuys must be 0 or greater."}).optional().default(0),
  bountiesWon: z.coerce.number().int().nonnegative({ message: "Bounties won must be non-negative." }).optional().default(0),
  mysteryKoWon: z.coerce.number().int().nonnegative({ message: "Mystery KO won must be non-negative." }).optional().default(0),
});

const NO_SEASON_ID_VALUE = "NONE"; // Value for "No Season" option

const EventFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  date: z.string().min(1, { message: 'Date is required.' }),
  buyIn: z.coerce.number().int().min(0, { message: 'Buy-in must be a non-negative integer.' }),
  rebuyPrice: z.coerce.number().int().nonnegative({ message: 'Rebuy price must be a non-negative integer.' }).optional(),
  bounties: z.coerce.number().int().nonnegative({ message: 'Bounties must be a non-negative integer.' }).optional(),
  mysteryKo: z.coerce.number().int().nonnegative({ message: 'Mystery KO must be a non-negative integer.' }).optional(),
  includeBountiesInNet: z.preprocess((val) => val === 'on' || val === true, z.boolean()),
  maxPlayers: z.coerce.number().int().positive({ message: 'Max players must be a positive integer.' }).optional(),
  prizePoolTotal: z.coerce.number().int().nonnegative({ message: 'Prize pool total must be a non-negative integer.' }),
  seasonId: z.string().optional(), // Optional season ID
  participantIds: z.preprocess(
    (val) => (typeof val === 'string' && val ? val.split(',').filter(id => id.trim() !== '') : Array.isArray(val) ? val : []),
    z.array(z.string()).optional().default([])
  ),
  status: z.enum(["draft", "active", "completed", "cancelled"], { message: "Invalid event status."}).default("draft"),
  resultsJson: z.string().optional().transform((val, ctx) => {
    if (!val || val === '[]') return [];
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Results must be an array.",
          path: ['resultsJson']
        });
        return z.NEVER;
      }
      const validatedResults = z.array(EventResultInputSchema).safeParse(parsed);
      if (!validatedResults.success) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid results format: ${JSON.stringify(validatedResults.error.flatten().fieldErrors)}`,
          path: ['resultsJson']
        });
        return z.NEVER;
      }
      return validatedResults.data;
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Results JSON is malformed.",
        path: ['resultsJson']
      });
      return z.NEVER;
    }
  }).pipe(z.array(EventResultInputSchema).optional().default([])),
}).refine(data => {
  if (data.status === 'completed' && data.participantIds.length > 0 && (!data.resultsJson || data.resultsJson.length === 0)) {
    // This validation might need adjustment based on exact requirements
  }
  return true;
}, {
  message: "Results should be provided for completed events with participants.",
  path: ["resultsJson"],
})
.refine(data => {
  if (!data.resultsJson || !data.participantIds) return true;
  const participantIdSet = new Set(data.participantIds);
  return data.resultsJson.every(result => participantIdSet.has(result.playerId));
}, {
  message: "All players in results must be participants in the event.",
  path: ["resultsJson"],
})
.refine(data => {
  if (!data.resultsJson) return true;
  const playerIdsInResults = data.resultsJson.map(r => r.playerId);
  return new Set(playerIdsInResults).size === playerIdsInResults.length;
}, {
  message: "A player cannot be assigned to multiple positions in the results.",
  path: ["resultsJson"],
})
.refine(data => {
  if (!data.resultsJson) return true;
  const positionsInResults = data.resultsJson.map(r => r.position);
  return new Set(positionsInResults).size === positionsInResults.length;
}, {
  message: "Each position can only appear once in the results.",
  path: ["resultsJson"],
});


export async function createEvent(prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const participantIdsValue = rawFormData.participantIds;
  rawFormData.participantIds = typeof participantIdsValue === 'string' && participantIdsValue ? participantIdsValue.split(',').filter(id => id.trim() !== '') : (Array.isArray(participantIdsValue) ? participantIdsValue : []);

  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;
  const eventId = crypto.randomUUID();
  const seasonIdValue = data.seasonId && data.seasonId !== NO_SEASON_ID_VALUE ? data.seasonId : undefined;


  const eventDataForFirestore: Omit<Event, 'createdAt' | 'updatedAt'> & { createdAt?: string, updatedAt?: string, seasonId?: string | null } = {
    id: eventId,
    name: data.name,
    date: new Date(data.date).toISOString(),
    buyIn: data.buyIn,
    rebuyPrice: data.rebuyPrice,
    bounties: data.bounties,
    mysteryKo: data.mysteryKo,
    includeBountiesInNet: data.includeBountiesInNet,
    maxPlayers: data.maxPlayers,
    status: data.status as EventStatus,
    seasonId: seasonIdValue,
    prizePool: {
      total: data.prizePoolTotal,
      distributionType: 'automatic',
      distribution: [],
    },
    participants: data.participantIds.filter(id => id.trim() !== ''),
    results: data.resultsJson?.map(r => ({
        playerId: r.playerId,
        position: r.position,
        prize: r.prize,
        rebuys: r.rebuys,
        bountiesWon: r.bountiesWon,
        mysteryKoWon: r.mysteryKoWon,
    })) || [],
  };

  const finalEventPayload = {
      ...cleanUndefinedProperties(eventDataForFirestore),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  } as Event;


  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await setDoc(eventRef, finalEventPayload);
  } catch (error: any) {
    console.error("Firestore Error creating event:", error);
    let errorMessage = 'Database Error: Failed to create event.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    return { message: errorMessage };
  }

  revalidatePath('/events');
  revalidatePath('/dashboard');
  revalidatePath('/seasons');
  redirect('/events');
}

export async function updateEvent(prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const participantIdsValue = rawFormData.participantIds;
  rawFormData.participantIds = typeof participantIdsValue === 'string' && participantIdsValue ? participantIdsValue.split(',').filter(id => id.trim() !== '') : (Array.isArray(participantIdsValue) ? participantIdsValue : []);

  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields for errors.',
    };
  }

  const data = validatedFields.data;
  const eventId = data.id;

  if (!eventId) {
    return { message: "Event ID is missing for update." };
  }

  const seasonIdValue = data.seasonId && data.seasonId !== NO_SEASON_ID_VALUE ? data.seasonId : undefined;


  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return { message: 'Event not found in database.' };
    }
    const existingEvent = eventSnap.data() as Event;

    const eventDataToUpdate: Partial<Event> & { seasonId?: string | null } = {
      name: data.name,
      date: new Date(data.date).toISOString(),
      buyIn: data.buyIn,
      rebuyPrice: data.rebuyPrice,
      bounties: data.bounties,
      mysteryKo: data.mysteryKo,
      includeBountiesInNet: data.includeBountiesInNet,
      maxPlayers: data.maxPlayers,
      status: data.status as EventStatus,
      seasonId: seasonIdValue,
      prizePool: {
        ...existingEvent.prizePool,
        total: data.prizePoolTotal,
      },
      participants: data.participantIds.filter(id => id.trim() !== ''),
      results: data.resultsJson?.map(r => ({
        playerId: r.playerId,
        position: r.position,
        prize: r.prize,
        rebuys: r.rebuys,
        bountiesWon: r.bountiesWon,
        mysteryKoWon: r.mysteryKoWon,
      })) || [],
    };

    const finalEventPayload = {
        ...existingEvent,
        ...cleanUndefinedProperties(eventDataToUpdate),
        updatedAt: new Date().toISOString(),
    } as Event;


    await setDoc(eventRef, finalEventPayload);

  } catch (error: any)
{
    console.error("Firestore Error updating event:", error);
    let errorMessage = 'Database Error: Failed to update event.';
    if (error && error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
     if (error.code) {
        errorMessage += ` Code: ${error.code}`;
    }
    return { message: errorMessage };
  }

  revalidatePath('/events');
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/edit`);
  revalidatePath('/dashboard');
  revalidatePath('/seasons'); // Also revalidate seasons in case event association changes season stats
  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
  if (!eventId) {
    return { success: false, message: 'Event ID is required for deletion.' };
  }
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventRef);

    revalidatePath('/events');
    revalidatePath('/dashboard');
    revalidatePath('/seasons');
    return { success: true, message: 'Event deleted successfully.' };
  } catch (error) {
    console.error('Delete Event Error:', error);
    return { success: false, message: 'Database Error: Failed to delete event.' };
  }
}
