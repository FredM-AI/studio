
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { loginUser } from './actions';
import type { LoginFormState } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const initialState: LoginFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(loginUser, initialState);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-br from-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Image 
            src="/poker-bulls-club-logo.png" 
            alt="Poker Bulls Championship Logo"
            width={100}
            height={141}
            className="mx-auto mb-4 h-20 w-auto object-contain"
            data-ai-hint="poker bull card"
          />
          <CardTitle className="font-headline text-3xl">Admin Login</CardTitle>
          <CardDescription>Access the Poker Tournament Manager dashboard.</CardDescription>
        </CardHeader>
        <form action={dispatch}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                required
                aria-describedby="username-error"
              />
              {state.errors?.username && (
                <p id="username-error" className="text-sm text-destructive flex items-center gap-1 mt-1">
                   <AlertCircle className="h-3 w-3" /> {state.errors.username.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                aria-describedby="password-error"
              />
              {state.errors?.password && (
                <p id="password-error" className="text-sm text-destructive flex items-center gap-1 mt-1">
                   <AlertCircle className="h-3 w-3" /> {state.errors.password.join(', ')}
                </p>
              )}
            </div>
            {state.errors?._form && (
              <div 
                aria-live="polite"
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
              >
                <AlertCircle className="h-4 w-4" />
                <p>{state.errors._form.join(', ')}</p>
              </div>
            )}
             {state.message && !state.errors?._form && (
              <div 
                aria-live="polite"
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md"
              >
                 <AlertCircle className="h-4 w-4" />
                <p>{state.message}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-5 w-5" /> Login
            </Button>
          </CardFooter>
        </form>
         <p className="px-6 pb-4 text-center text-xs text-muted-foreground">
            Demo credentials: admin / password
          </p>
      </Card>
    </div>
  );
}
