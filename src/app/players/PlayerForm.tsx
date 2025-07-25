
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
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

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
  const { toast } = useToast();
  
  const [firstName, setFirstName] = React.useState(player?.firstName || '');
  const [lastName, setLastName] = React.useState(player?.lastName || '');
  const [avatarUrl, setAvatarUrl] = React.useState(player?.avatar || '');
  
  React.useEffect(() => {
    if (state.message) {
      if (Object.keys(state.errors || {}).length > 0) {
        toast({
          title: "Update Failed",
          description: state.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: state.message,
          variant: "default",
        });
      }
    }
  }, [state, toast]);

  const getInitials = () => {
      const first = firstName || player?.firstName || '';
      const last = lastName || player?.lastName || '';
      return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
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
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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

          <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar preview" />}
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                      {getInitials()}
                  </AvatarFallback>
              </Avatar>
          </div>


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
          
           {state.errors?._form && (
             <div className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p>{state.errors._form.join(', ')}</p>
             </div>
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
