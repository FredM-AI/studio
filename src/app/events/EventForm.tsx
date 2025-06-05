
'use client';

import type { Event, Player, EventFormState as ServerEventFormState } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react'; // Updated import
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeftRight, PlusCircle, MinusCircle, Users, DollarSign, CalendarDays, Settings } from 'lucide-react';
import Link from 'next/link';

interface EventFormProps {
  event?: Event; // Optional: for editing
  allPlayers: Player[];
  action: (prevState: ServerEventFormState, formData: FormData) => Promise<ServerEventFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function EventForm({ event, allPlayers, action, formTitle, formDescription, submitButtonText }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState); // Renamed to useActionState

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    event ? new Date(event.date) : undefined
  );
  const [rebuyAllowed, setRebuyAllowed] = React.useState<boolean>(event?.rebuyAllowed || false);

  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [currentParticipants, setCurrentParticipants] = React.useState<Player[]>([]);
  
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const initialParticipantIds = event?.participants || [];
    const initialParticipants = allPlayers.filter(p => initialParticipantIds.includes(p.id));
    const initialAvailable = allPlayers.filter(p => !initialParticipantIds.includes(p.id));
    
    setCurrentParticipants(initialParticipants);
    setAvailablePlayers(initialAvailable);
  }, [allPlayers, event]);

  const handleAddPlayer = (player: Player) => {
    setCurrentParticipants(prev => [...prev, player]);
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (player: Player) => {
    setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    setCurrentParticipants(prev => prev.filter(p => p.id !== player.id));
  };

  const filteredAvailablePlayers = availablePlayers.filter(player =>
    `${player.firstName} ${player.lastName} ${player.nickname || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const hiddenParticipantIds = currentParticipants.map(p => p.id).join(',');

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-8">
          {event?.id && <input type="hidden" name="id" defaultValue={event.id} />}
          
          {/* Basic Info Section */}
          <div className="space-y-6 p-6 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" defaultValue={event?.name} required />
                {state.errors?.name && <p className="text-sm text-destructive mt-1">{state.errors.name.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full" />
                <input type="hidden" name="date" value={selectedDate ? selectedDate.toISOString() : ''} />
                {state.errors?.date && <p className="text-sm text-destructive mt-1">{state.errors.date.join(', ')}</p>}
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-6 p-6 border rounded-lg shadow-sm">
             <h3 className="font-headline text-lg flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" />Event Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="buyIn">Buy-in ($)</Label>
                <Input id="buyIn" name="buyIn" type="number" step="0.01" defaultValue={event?.buyIn} required />
                {state.errors?.buyIn && <p className="text-sm text-destructive mt-1">{state.errors.buyIn.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input id="maxPlayers" name="maxPlayers" type="number" defaultValue={event?.maxPlayers} required />
                {state.errors?.maxPlayers && <p className="text-sm text-destructive mt-1">{state.errors.maxPlayers.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="prizePoolTotal">Total Prize Pool ($)</Label>
                <Input id="prizePoolTotal" name="prizePoolTotal" type="number" step="0.01" defaultValue={event?.prizePool.total} required />
                {state.errors?.prizePoolTotal && <p className="text-sm text-destructive mt-1">{state.errors.prizePoolTotal.join(', ')}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="flex items-center space-x-2 pt-4">
                    <Switch id="rebuyAllowed" name="rebuyAllowed" checked={rebuyAllowed} onCheckedChange={setRebuyAllowed} />
                    <Label htmlFor="rebuyAllowed">Rebuys Allowed</Label>
                </div>
                {rebuyAllowed && (
                <div>
                    <Label htmlFor="rebuyPrice">Rebuy Price ($)</Label>
                    <Input id="rebuyPrice" name="rebuyPrice" type="number" step="0.01" defaultValue={event?.rebuyPrice} />
                    {state.errors?.rebuyPrice && <p className="text-sm text-destructive mt-1">{state.errors.rebuyPrice.join(', ')}</p>}
                </div>
                )}
            </div>
             {state.errors?.rebuyAllowed && <p className="text-sm text-destructive mt-1">{state.errors.rebuyAllowed.join(', ')}</p>}
          </div>
          
          {/* Participants Section */}
          <div className="space-y-4 p-6 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Participants ({currentParticipants.length} / {event?.maxPlayers || 'N/A'})</h3>
             {state.errors?.participantIds && <p className="text-sm text-destructive mt-1">{state.errors.participantIds.join(', ')}</p>}
            <input type="hidden" name="participantIds" value={hiddenParticipantIds} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="searchPlayers">Search Available Players</Label>
                 <Input 
                    id="searchPlayers"
                    placeholder="Search by name or nickname..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                />
                <ScrollArea className="h-72 w-full rounded-md border p-2">
                  {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                      <span>{player.firstName} {player.lastName} {player.nickname ? `(${player.nickname})` : ''}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddPlayer(player)} title="Add player">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2">No players available or matching search.</p>}
                </ScrollArea>
              </div>
              <div>
                <Label>Selected Participants</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-2">
                  {currentParticipants.length > 0 ? currentParticipants.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                      <span>{player.firstName} {player.lastName} {player.nickname ? `(${player.nickname})` : ''}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleRemovePlayer(player)} title="Remove player">
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2">No participants selected.</p>}
                </ScrollArea>
              </div>
            </div>
          </div>

          {state.message && <p className="text-sm text-destructive mt-2">{state.message}</p>}
          {state.errors?._form && <p className="text-sm text-destructive mt-2">{state.errors._form.join(', ')}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-4 p-6 border-t">
          <Button variant="outline" asChild>
            <Link href="/events">Cancel</Link>
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
