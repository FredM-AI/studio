
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import type { LoginFormState } from '@/lib/definitions';
import { cookies } from 'next/headers';

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'pbc_pwd25'; 
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
    cookies().set(AUTH_COOKIE_NAME, 'true', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'none', 
      secure: true, 
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
  try {
    const cookieStore = cookies();
    // console.log(`[Logout] Attempting to clear cookie: ${AUTH_COOKIE_NAME} by setting expiry`);
    cookieStore.set(AUTH_COOKIE_NAME, '', { // Set empty value
        httpOnly: true,
        path: '/', // Must match the path the cookie was set with
        sameSite: 'none', 
        secure: true, // Must match the secure flag the cookie was set with
        expires: new Date(0) // Set to a past date to expire the cookie
    });
    // console.log(`[Logout] Cookie ${AUTH_COOKIE_NAME} set with past expiry.`);
  } catch (error) {
    // console.error('[Logout] Error during cookie clearing:', error);
  }
  redirect('/login');
}
