
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import type { LoginFormState } from '@/lib/definitions';

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Hardcoded admin credentials for demonstration purposes
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password'; // In a real app, NEVER hardcode passwords. Use environment variables and hashing.

export async function loginUser(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
    };
  }

  const { username, password } = validatedFields.data;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In a real application, you would set up a session here (e.g., using cookies or a library like NextAuth.js)
    // For this prototype, we'll just redirect.
    redirect('/');
  } else {
    return {
      errors: { _form: ['Invalid username or password.'] },
      message: 'Invalid username or password.',
    };
  }
}
