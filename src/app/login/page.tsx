
'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { loginUser } from './actions';
import type { LoginFormState } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const initialState: LoginFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(loginUser, initialState);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-br from-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4 transform scale-125">
            <Logo />
           </div>
          <CardTitle className="font-headline text-3xl">Welcome</CardTitle>
          <CardDescription>Access your dashboard or continue as a guest.</CardDescription>
        </CardHeader>
        
        <form action={dispatch}>
          <CardContent className="space-y-6">
             <div>
                <p className="text-sm font-medium text-center text-muted-foreground mb-2">Admin Access</p>
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full">
              <LogIn className="mr-2 h-5 w-5" /> Login as Admin
            </Button>
          </CardFooter>
        </form>

        <div className="px-6 pb-6">
            <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                    OR
                </span>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <Eye className="mr-2 h-5 w-5" /> Continue as Guest
              </Link>
            </Button>
        </div>
      </Card>
    </div>
  );
}
