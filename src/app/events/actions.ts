
'use server';

import { z } from 'zod';
import { getEvents, saveEvents, getPlayers } from '@/lib/data-service';
import type { Event, Player } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const EventSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  date: z.string().min(1, { message: 'Date is required.' }),
  buyIn: z.coerce.number().positive({ message: 'Buy-in must be a positive number.' }),
  rebuyAllowed: z.preprocess((val) => val === 'on' || val === true, z.boolean()).default(false),
  rebuyPrice: z.coerce.number().optional(),
  maxPlayers: z.coerce.number().int().positive({ message: 'Max players must be a positive integer.' }),
  prizePoolTotal: z.coerce.number().nonnegative({ message: 'Prize pool total cannot be negative.' }),
  participantIds: z.preprocess(
    (val) => (typeof val === 'string' && val ? val.split(',') : Array.isArray(val) ? val : []),
    z.array(z.string()).optional().default([])
  ),
}).refine(data => !data.rebuyAllowed || (data.rebuyAllowed && data.rebuyPrice !== undefined && data.rebuyPrice > 0), {
  message: "Rebuy price must be set if rebuys are allowed.",
  path: ["rebuyPrice"],
});


export type EventFormState = {
  errors?: {
    name?: string[];
    date?: string[];
    buyIn?: string[];
    rebuyAllowed?: string[];
    rebuyPrice?: string[];
    maxPlayers?: string[];
    prizePoolTotal?: string[];
    participantIds?: string[];
    _form?: string[];
  };
  message?: string | null;
};

export async function createEvent(prevState: EventFormState, formData: FormData): Promise<EventFormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  
  // Handle participantIds: if it's a single string, convert to array, otherwise use as is (if multiple entries)
  const participantIdsData = formData.getAll('participantIds');
  rawFormData.participantIds = participantIdsData.length > 0 ? participantIdsData : [];


  const validatedFields = EventSchema.safeParse(rawFormData);

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
    status: 'draft',
    prizePool: {
      total: data.prizePoolTotal,
      distributionType: 'automatic', // Default, can be changed later
      distribution: [],
    },
    participants: data.participantIds,
    results: [],
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
