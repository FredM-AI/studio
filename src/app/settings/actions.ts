
'use server';

import { z } from 'zod';
import { saveBlindStructure, getBlindStructures } from '@/lib/data-service';
import type { BlindStructureTemplate, BlindLevel } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

const BlindLevelSchema = z.object({
  level: z.coerce.number().int(),
  smallBlind: z.coerce.number().int().nonnegative(),
  bigBlind: z.coerce.number().int().nonnegative(),
  ante: z.coerce.number().int().nonnegative().optional().default(0),
  duration: z.coerce.number().int().positive(),
  isBreak: z.boolean(),
});

const BlindStructureSchema = z.object({
  id: z.string().min(1, 'ID is required.'),
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  levels: z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const validated = z.array(BlindLevelSchema).safeParse(parsed);
      if (!validated.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid level data in JSON.',
        });
        return z.NEVER;
      }
      return validated.data;
    } catch (e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON format for levels.' });
      return z.NEVER;
    }
  }),
});

export type BlindStructureFormState = {
  errors?: {
    name?: string[];
    levels?: string[];
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function saveBlindStructureAction(prevState: BlindStructureFormState, formData: FormData): Promise<BlindStructureFormState> {
  const validatedFields = BlindStructureSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    levels: formData.get('levels'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      success: false,
    };
  }

  const { id, name, levels } = validatedFields.data;

  const structureToSave: BlindStructureTemplate = { id, name, levels };

  try {
    await saveBlindStructure(structureToSave);
  } catch (error) {
    console.error('Error saving blind structure:', error);
    return {
      message: 'Database Error: Failed to save blind structure.',
      success: false,
    };
  }

  // Revalidate paths where structures might be used
  revalidatePath('/events/new');
  revalidatePath('/events/.*edit');
  revalidatePath('/events/.*live');
  revalidatePath('/settings'); // Or wherever structures are managed

  return {
    message: `Structure "${name}" saved successfully.`,
    success: true,
  };
}
