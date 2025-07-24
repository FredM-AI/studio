
'use client';

import type { Player, PlayerFormState } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PlayerFormProps {
  player?: Player;
  action: (prevState: PlayerFormState, formData: FormData) => Promise<PlayerFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function PlayerForm({ player, action, formTitle, formDescription, submitButtonText }: PlayerFormProps) {
  const initialState: PlayerFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);
  
  const [avatarUrl, setAvatarUrl] = React.useState(player?.avatar || '');

  React.useEffect(() => {
    setAvatarUrl(player?.avatar || '');
  }, [player?.avatar]);

  const getInitials = () => {
      // Attempt to get names from the form if possible, otherwise from player prop
      const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value || player?.firstName || '';
      const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value || player?.lastName || '';
      return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };


  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-6">
          {player?.id && <input type="hidden" name="id" defaultValue={player.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                defaultValue={player?.firstName} 
                aria-describedby="firstName-error"
                required 
              />
              {state.errors?.firstName && (
                <p id="firstName-error" className="text-sm text-destructive mt-1">
                  {state.errors.firstName.join(', ')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                defaultValue={player?.lastName} 
                aria-describedby="lastName-error"
                required
              />
              {state.errors?.lastName && (
                <p id="lastName-error" className="text-sm text-destructive mt-1">
                  {state.errors.lastName.join(', ')}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input 
              id="nickname" 
              name="nickname" 
              defaultValue={player?.nickname} 
              aria-describedby="nickname-error"
            />
             {/* Nickname errors if any specific validation added */}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              defaultValue={player?.email} 
              aria-describedby="email-error"
              required
            />
            {state.errors?.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                {state.errors.email.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              defaultValue={player?.phone} 
              aria-describedby="phone-error"
            />
             {state.errors?.phone && (
              <p id="phone-error" className="text-sm text-destructive mt-1">
                {state.errors.phone.join(', ')}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="avatar">Avatar URL (Optional)</Label>
            <Input 
              id="avatar" 
              name="avatar" 
              type="url" 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              aria-describedby="avatar-error"
            />
            {state.errors?.avatar && (
              <p id="avatar-error" className="text-sm text-destructive mt-1">
                {state.errors.avatar.join(', ')}
              </p>
            )}
          </div>

          {avatarUrl && (
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                    <AvatarImage src={avatarUrl} alt="Avatar preview" />
                    <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
            </div>
          )}


          <div className="flex items-center space-x-2">
            <Switch 
              id="isGuest" 
              name="isGuest" 
              defaultChecked={player ? player.isGuest : false}
            />
            <Label htmlFor="isGuest">Guest Player</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              name="isActive" 
              defaultChecked={player ? player.isActive : true}
              aria-describedby="isActive-error"
            />
            <Label htmlFor="isActive">Active Player</Label>
          </div>

          {state.message && (
            <p className="text-sm text-destructive mt-2">{state.message}</p>
          )}
          {state.errors?._form && (
             <p className="text-sm text-destructive mt-2">{state.errors._form.join(', ')}</p>
          )}

        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/players">Cancel</Link>
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
