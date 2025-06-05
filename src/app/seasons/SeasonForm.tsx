
'use client';

import type { Season, SeasonFormState } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { CalendarDays, Info, ToggleLeft, ToggleRight, Edit } from 'lucide-react';

interface SeasonFormProps {
  season?: Season;
  action: (prevState: SeasonFormState, formData: FormData) => Promise<SeasonFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function SeasonForm({ season, action, formTitle, formDescription, submitButtonText }: SeasonFormProps) {
  const initialState: SeasonFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [startDate, setStartDate] = React.useState<Date | undefined>(
    season?.startDate ? new Date(season.startDate) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    season?.endDate ? new Date(season.endDate) : undefined
  );
  const [isActive, setIsActive] = React.useState<boolean>(season ? season.isActive : true);

  React.useEffect(() => {
    if (season) {
      setStartDate(season.startDate ? new Date(season.startDate) : undefined);
      setEndDate(season.endDate ? new Date(season.endDate) : undefined);
      setIsActive(season.isActive);
    }
  }, [season]);
  

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-6">
          {season?.id && <input type="hidden" name="id" defaultValue={season.id} />}
          
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Season Name</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={season?.name} 
              aria-describedby="name-error"
              required 
              className="h-9"
            />
            {state.errors?.name && (
              <p id="name-error" className="text-sm text-destructive mt-1">
                {state.errors.name.join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Start Date</Label>
              <DatePicker date={startDate} setDate={setStartDate} className="h-9 w-full"/>
              <input type="hidden" name="startDate" value={startDate ? startDate.toISOString() : ''} aria-describedby="startDate-error" />
              {state.errors?.startDate && (
                <p id="startDate-error" className="text-sm text-destructive mt-1">
                  {state.errors.startDate.join(', ')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />End Date (Optional)</Label>
               <DatePicker date={endDate} setDate={setEndDate} disabled={(date) => startDate ? date < startDate : false} className="h-9 w-full" />
              <input type="hidden" name="endDate" value={endDate ? endDate.toISOString() : ''} aria-describedby="endDate-error" />
              {state.errors?.endDate && (
                <p id="endDate-error" className="text-sm text-destructive mt-1">
                  {state.errors.endDate.join(', ')}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="isActive" className="flex items-center">
                {isActive ? <ToggleRight className="mr-2 h-5 w-5 text-green-500" /> : <ToggleLeft className="mr-2 h-5 w-5 text-muted-foreground" /> }
                Season Status
            </Label>
            <div className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30">
                <Switch 
                id="isActive" 
                name="isActive" 
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-describedby="isActive-error"
                />
                <span className={isActive ? "text-green-600 font-medium" : "text-muted-foreground"}>
                 {isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            {state.errors?.isActive && (
              <p id="isActive-error" className="text-sm text-destructive mt-1">
                {state.errors.isActive.join(', ')}
              </p>
            )}
          </div>

          {state.message && (
            <p className="text-sm text-destructive mt-2 text-center p-2 bg-destructive/10 rounded-md">{state.message}</p>
          )}
           {state.errors?._form && (
             <p className="text-sm text-destructive mt-2 text-center p-2 bg-destructive/10 rounded-md">{state.errors._form.join(', ')}</p>
          )}

        </CardContent>
        <CardFooter className="flex justify-end gap-4 border-t pt-6">
          <Button variant="outline" asChild>
            <Link href="/seasons">Cancel</Link>
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
