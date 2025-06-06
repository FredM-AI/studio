
'use client';

import type { Season, SeasonFormState, Event } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { CalendarDays, Info, ToggleLeft, ToggleRight, ListChecks, PlusCircle, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SeasonFormProps {
  season?: Season;
  allEvents: Event[];
  action: (prevState: SeasonFormState, formData: FormData) => Promise<SeasonFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function SeasonForm({ season, allEvents, action, formTitle, formDescription, submitButtonText }: SeasonFormProps) {
  const initialState: SeasonFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined);
  const [isActive, setIsActive] = React.useState<boolean>(true); // Default, will be set by useEffect for existing season

  const [associatedEventIds, setAssociatedEventIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (season) {
      setStartDate(season.startDate ? new Date(season.startDate) : undefined);
      setEndDate(season.endDate ? new Date(season.endDate) : undefined);
      setIsActive(season.isActive);
      
      const currentlyAssociated = allEvents.filter(event => event.seasonId === season.id).map(event => event.id);
      setAssociatedEventIds(currentlyAssociated);
    } else {
      // For new seasons
      setStartDate(undefined);
      setEndDate(undefined);
      setIsActive(true); // Default for new season form
      setAssociatedEventIds([]);
    }
  }, [season, allEvents]);

  const availableEvents = allEvents.filter(
    event => !event.seasonId || event.seasonId === season?.id
  ).filter(event => !associatedEventIds.includes(event.id));
  
  const currentAssociatedEventsFull = allEvents.filter(event => associatedEventIds.includes(event.id));

  const handleAddEvent = (eventId: string) => {
    setAssociatedEventIds(prev => [...prev, eventId]);
  };

  const handleRemoveEvent = (eventId: string) => {
    setAssociatedEventIds(prev => prev.filter(id => id !== eventId));
  };
  
  const hiddenAssociatedEventIds = associatedEventIds.join(',');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-6">
          {season?.id && <input type="hidden" name="id" defaultValue={season.id} />}
          <input type="hidden" name="eventIdsToAssociate" value={hiddenAssociatedEventIds} />
          
          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Season Details</h3>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">Season Name</Label>
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
          </div>

          {season && ( // Only show event association for existing seasons
            <div className="space-y-4 p-4 border rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-lg flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" />Manage Associated Events</h3>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/events/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Event
                  </Link>
                </Button>
              </div>
              {state.errors?.eventIdsToAssociate && <p className="text-sm text-destructive mt-1">{state.errors.eventIdsToAssociate.join(', ')}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <Label>Available Events ({availableEvents.length})</Label>
                  <ScrollArea className="h-60 w-full rounded-md border p-1.5">
                    {availableEvents.length > 0 ? availableEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md text-sm">
                        <span>{event.name} ({new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })})</span>
                        <Button type="button" variant="outline" size="icon-sm" onClick={() => handleAddEvent(event.id)} title="Add to season">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )) : <p className="text-muted-foreground p-2 text-sm">No unassigned events available.</p>}
                  </ScrollArea>
                </div>
                <div>
                  <Label>Events in this Season ({currentAssociatedEventsFull.length})</Label>
                  <ScrollArea className="h-60 w-full rounded-md border p-1.5">
                    {currentAssociatedEventsFull.length > 0 ? currentAssociatedEventsFull.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md text-sm">
                        <span>{event.name} ({new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })})</span>
                        <Button type="button" variant="outline" size="icon-sm" onClick={() => handleRemoveEvent(event.id)} title="Remove from season">
                           <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )) : <p className="text-muted-foreground p-2 text-sm">No events currently in this season.</p>}
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}


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
