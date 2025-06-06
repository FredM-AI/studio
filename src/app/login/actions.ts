
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import type { LoginFormState } from '@/lib/definitions';
import { cookies } from 'next/headers';

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Hardcoded admin credentials for demonstration purposes
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pbc_pwd25'; // In a real app, NEVER hardcode passwords. Use environment variables and hashing.
const AUTH_COOKIE_NAME = 'app_session_active';

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
    // Set a simple cookie to simulate session
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'none', // Changed from 'lax'
      secure: true, // Crucial for HTTPS environments like Firebase console
    });
    redirect('/dashboard');
  } else {
    return {
      errors: { _form: ['Invalid username or password.'] },
      message: 'Invalid username or password.',
    };
  }
}

export async function logoutUser() {
  // Ensure all relevant cookie attributes match how it was set for reliable deletion
  cookies().delete(AUTH_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: 'none', // Changed from 'lax'
    secure: true,
  });
  redirect('/login');
}

