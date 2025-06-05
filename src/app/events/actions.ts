
'use server';

import { z } from 'zod';
import { getEvents, saveEvents, getPlayers } from '@/lib/data-service';
import type { Event, EventStatus } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { EventFormState } from '@/lib/definitions'; // Import from definitions

const EventResultInputSchema = z.object({
  playerId: z.string().min(1),
  position: z.coerce.number().int().min(0, { message: "Position must be 0 or greater." }),
  prize: z.coerce.number().min(0, { message: "Prize must be 0 or greater." }),
  rebuys: z.coerce.number().int().min(0, {message: "Rebuys must be 0 or greater."}).optional().default(0),
  // eliminatedBy is not handled in this form
});

const EventFormSchema = z.object({
  id: z.string().optional(), // For updates
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  date: z.string().min(1, { message: 'Date is required.' }),
  buyIn: z.coerce.number().positive({ message: 'Buy-in must be a positive number.' }),
  rebuyAllowed: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(false),
  rebuyPrice: z.coerce.number().optional(),
  maxPlayers: z.coerce.number().int().positive({ message: 'Max players must be a positive integer.' }),
  prizePoolTotal: z.coerce.number().nonnegative({ message: 'Prize pool total cannot be negative.' }),
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
      return validatedResults.data.map(r => ({ ...r, eliminatedBy: undefined })); // Ensure EventResult structure
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Results JSON is malformed.",
        path: ['resultsJson']
      });
      return z.NEVER;
    }
  }).pipe(z.array(EventResultInputSchema.extend({ eliminatedBy: z.string().optional() })).optional().default([])),
}).refine(data => !data.rebuyAllowed || (data.rebuyAllowed && data.rebuyPrice !== undefined && data.rebuyPrice > 0), {
  message: "Rebuy price must be set if rebuys are allowed.",
  path: ["rebuyPrice"],
}).refine(data => {
  if (data.status === 'completed' && (!data.resultsJson || data.resultsJson.length === 0) && data.participantIds.length > 0) {
    return false; 
  }
  return true;
}, {
  message: "Results must be provided for completed events with participants.",
  path: ["resultsJson"],
}).refine(data => {
  const participantIdsInResults = new Set(data.resultsJson?.map(r => r.playerId));
  for (const participantId of data.participantIds) {
    if (!participantIdsInResults.has(participantId) && data.status === 'completed') {
      // This validation can be adjusted based on strictness.
      // For now, if an event is completed, we expect results for all participants.
      // Or, if results are provided, they must be for actual participants.
    }
  }
  for (const result of data.resultsJson || []) {
    if (!data.participantIds.includes(result.playerId)) {
      return false; 
    }
  }
  return true;
}, {
  message: "All players in results must be participants in the event, or results submitted for non-participants.",
  path: ["resultsJson"],
});


export async function createEvent(prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const participantIdsData = formData.getAll('participantIds');
  rawFormData.participantIds = participantIdsData.length === 1 && typeof participantIdsData[0] === 'string' ? participantIdsData[0].split(',') : participantIdsData;


  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  const data = validatedFields.data;

  if (data.participantIds.length > data.maxPlayers) {
    return {
        errors: { participantIds: ['Number of participants cannot exceed max players.'] },
        message: 'Validation failed.',
    };
  }

  const newEvent: Event = {
    id: crypto.randomUUID(),
    name: data.name,
    date: new Date(data.date).toISOString(),
    buyIn: data.buyIn,
    rebuyAllowed: data.rebuyAllowed,
    rebuyPrice: data.rebuyAllowed ? data.rebuyPrice : undefined,
    maxPlayers: data.maxPlayers,
    status: data.status as EventStatus,
    prizePool: {
      total: data.prizePoolTotal,
      distributionType: 'automatic', 
      distribution: [],
    },
    participants: data.participantIds.filter(id => id.trim() !== ''), // Clean empty strings
    results: data.resultsJson?.map(r => ({
        playerId: r.playerId,
        position: r.position,
        prize: r.prize,
        rebuys: r.rebuys, // Added rebuys
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
  const participantIdsData = formData.getAll('participantIds');
  rawFormData.participantIds = participantIdsData.length === 1 && typeof participantIdsData[0] === 'string' ? participantIdsData[0].split(',') : participantIdsData;
  
  const validatedFields = EventFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields for errors.',
    };
  }

  const data = validatedFields.data;

  if (!data.id) {
    return { message: "Event ID is missing for update." };
  }
  
  if (data.participantIds.length > data.maxPlayers) {
    return {
        errors: { participantIds: ['Number of participants cannot exceed max players.'] },
        message: 'Validation failed.',
    };
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
      rebuyAllowed: data.rebuyAllowed,
      rebuyPrice: data.rebuyAllowed ? data.rebuyPrice : undefined,
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
        rebuys: r.rebuys, // Added rebuys
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

