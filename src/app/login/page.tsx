
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

const BullIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      {/* Horns */}
      <path d="M5 9C2.5 7.5 3 4 7 4" />
      <path d="M19 9C21.5 7.5 21 4 17 4" />
  
      {/* Head Top */}
      <path d="M7 4C8.5 2.5 15.5 2.5 17 4" />
  
      {/* Face Outline & Snout Area */}
      <path d="M17 4L19 9L17 14L15.5 18C14.5 20 9.5 20 8.5 18L7 14L5 9L7 4Z" />
      
      {/* Eye Details (X shapes for an intense look) */}
      <path d="M9 10.5L10.5 11.5" />
      <path d="M10.5 10.5L9 11.5" /> 
      <path d="M15 10.5L13.5 11.5" />
      <path d="M13.5 10.5L15 11.5" />
  
      {/* Snout line */}
      <path d="M9 16C10.5 17.5 13.5 17.5 15 16" />
    </svg>
  );

export default function LoginPage() {
  const initialState: LoginFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(loginUser, initialState);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-br from-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <BullIcon className="mx-auto h-24 w-auto text-primary" />
          <CardTitle className="font-headline text-3xl">Poker Bulls Championship</CardTitle>
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
