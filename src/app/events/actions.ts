
'use server';

import { z } from 'zod';
import { getEvents, saveEvents } from '@/lib/data-service';
import type { Event, EventStatus } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EventFormState } from '@/lib/definitions'; 

const EventResultInputSchema = z.object({
  playerId: z.string().min(1),
  position: z.coerce.number().int().min(1, { message: "Position must be 1 or greater." }),
  prize: z.coerce.number().int().min(0, { message: "Prize must be 0 or greater." }),
  rebuys: z.coerce.number().int().min(0, {message: "Rebuys must be 0 or greater."}).optional().default(0),
});

const EventFormSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  date: z.string().min(1, { message: 'Date is required.' }),
  buyIn: z.coerce.number().int().positive({ message: 'Buy-in must be a positive integer.' }),
  rebuyPrice: z.coerce.number().int().nonnegative({ message: 'Rebuy price must be a non-negative integer.' }).optional(),
  maxPlayers: z.coerce.number().int().positive({ message: 'Max players must be a positive integer.' }).optional(),
  prizePoolTotal: z.coerce.number().int().nonnegative({ message: 'Prize pool total must be a non-negative integer.' }),
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
      return validatedResults.data.map(r => ({ ...r, eliminatedBy: undefined })); 
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Results JSON is malformed.",
        path: ['resultsJson']
      });
      return z.NEVER;
    }
  }).pipe(z.array(EventResultInputSchema.extend({ eliminatedBy: z.string().optional() })).optional().default([])),
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
  rawFormData.participantIds = typeof participantIdsValue === 'string' && participantIdsValue ? participantIdsValue.split(',') : (Array.isArray(participantIdsValue) ? participantIdsValue : []);

  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  const newEvent: Event = {
    id: crypto.randomUUID(),
    name: data.name,
    date: new Date(data.date).toISOString(),
    buyIn: data.buyIn,
    rebuyPrice: data.rebuyPrice,
    maxPlayers: data.maxPlayers, 
    status: data.status as EventStatus,
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
        eliminatedBy: undefined, 
    })) || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const events = await getEvents();
    events.push(newEvent);
    await saveEvents(events);
  } catch (error) {
    return { message: 'Database Error: Failed to create event.' };
  }
  
  revalidatePath('/events');
  redirect('/events');
}

export async function updateEvent(prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const participantIdsValue = rawFormData.participantIds;
  rawFormData.participantIds = typeof participantIdsValue === 'string' && participantIdsValue ? participantIdsValue.split(',') : (Array.isArray(participantIdsValue) ? participantIdsValue : []);
  
  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields for errors.',
    };
  }

  const data = validatedFields.data;

  if (!data.id) {
    return { message: "Event ID is missing for update." };
  }
  

  try {
    const events = await getEvents();
    const eventIndex = events.findIndex(e => e.id === data.id);

    if (eventIndex === -1) {
      return { message: 'Event not found.' };
    }

    const updatedEvent: Event = {
      ...events[eventIndex],
      name: data.name,
      date: new Date(data.date).toISOString(),
      buyIn: data.buyIn,
      rebuyPrice: data.rebuyPrice,
      maxPlayers: data.maxPlayers, 
      status: data.status as EventStatus,
      prizePool: {
        ...events[eventIndex].prizePool, 
        total: data.prizePoolTotal,
      },
      participants: data.participantIds.filter(id => id.trim() !== ''),
      results: data.resultsJson?.map(r => ({
        playerId: r.playerId,
        position: r.position,
        prize: r.prize,
        rebuys: r.rebuys,
        eliminatedBy: undefined, 
      })) || [],
      updatedAt: new Date().toISOString(),
    };

    events[eventIndex] = updatedEvent;
    await saveEvents(events);

  } catch (error) {
    console.error("Error during event update:", error);
    return { message: 'Database Error: Failed to update event.' };
  }

  revalidatePath('/events');
  revalidatePath(`/events/${data.id}`);
  revalidatePath(`/events/${data.id}/edit`);
  redirect(`/events/${data.id}`); 
}

    