
'use client';

import type { Event, Player, EventStatus, eventStatuses, EventResultInput as FormEventResultInput } from '@/lib/definitions';
import type { EventFormState as ServerEventFormState } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, PlusCircle, MinusCircle, Users, DollarSign, CalendarDays, Settings, ListChecks, Info } from 'lucide-react';
import Link from 'next/link';

interface EventFormProps {
  event?: Event;
  allPlayers: Player[];
  action: (prevState: ServerEventFormState, formData: FormData) => Promise<ServerEventFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

export default function EventForm({ event, allPlayers, action, formTitle, formDescription, submitButtonText }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    event ? new Date(event.date) : undefined
  );
  const [rebuyAllowed, setRebuyAllowed] = React.useState<boolean>(event?.rebuyAllowed || false);
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>(event?.status || 'draft');

  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [currentParticipants, setCurrentParticipants] = React.useState<Player[]>([]);
  const [eventResultsInput, setEventResultsInput] = React.useState<FormEventResultInput[]>([]);
  
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const initialParticipantIds = event?.participants || [];
    const initialParticipants = allPlayers.filter(p => initialParticipantIds.includes(p.id));
    const initialAvailable = allPlayers.filter(p => !initialParticipantIds.includes(p.id));
    
    setCurrentParticipants(initialParticipants.sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(initialAvailable.sort((a,b) => a.firstName.localeCompare(b.firstName)));

    if (event?.results) {
      const resultsWithNames = event.results.map(result => {
        const player = allPlayers.find(p => p.id === result.playerId);
        return {
          playerId: result.playerId,
          playerName: player ? `${player.firstName} ${player.lastName}` : 'Unknown Player',
          position: result.position.toString(),
          prize: result.prize.toString(),
        };
      });
      setEventResultsInput(resultsWithNames);
    } else {
       // Initialize empty results for current participants if no results exist yet
      const emptyResults = initialParticipants.map(p => ({
        playerId: p.id,
        playerName: `${p.firstName} ${p.lastName}`,
        position: '',
        prize: '',
      }));
      setEventResultsInput(emptyResults);
    }
  }, [allPlayers, event]);

  // Update eventResultsInput when currentParticipants changes
  React.useEffect(() => {
    setEventResultsInput(prevResults => {
      const newResults: FormEventResultInput[] = currentParticipants.map(participant => {
        const existingResult = prevResults.find(r => r.playerId === participant.id);
        return existingResult || {
          playerId: participant.id,
          playerName: `${participant.firstName} ${participant.lastName}`,
          position: '',
          prize: '',
        };
      });
      return newResults.sort((a,b) => a.playerName.localeCompare(b.playerName));
    });
  }, [currentParticipants]);


  const handleAddPlayer = (player: Player) => {
    setCurrentParticipants(prev => [...prev, player].sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (player: Player) => {
    setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    setCurrentParticipants(prev => prev.filter(p => p.id !== player.id));
  };

  const handleResultChange = (playerId: string, field: 'position' | 'prize', value: string) => {
    setEventResultsInput(prev => 
      prev.map(result => 
        result.playerId === playerId ? { ...result, [field]: value } : result
      )
    );
  };

  const filteredAvailablePlayers = availablePlayers.filter(player =>
    `${player.firstName} ${player.lastName} ${player.nickname || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const hiddenParticipantIds = currentParticipants.map(p => p.id).join(',');
  const resultsJson = JSON.stringify(
    eventResultsInput
      .filter(r => currentParticipants.some(p => p.id === r.playerId)) // Only include results for current participants
      .map(r => ({
        playerId: r.playerId,
        position: parseInt(r.position) || 0, // Default to 0 if NaN
        prize: parseFloat(r.prize) || 0,   // Default to 0 if NaN
      }))
  );

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-8">
          {event?.id && <input type="hidden" name="id" defaultValue={event.id} />}
          <input type="hidden" name="resultsJson" value={resultsJson} />
          
          <div className="space-y-6 p-6 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" defaultValue={event?.name} required aria-describedby="name-error"/>
                {state.errors?.name && <p id="name-error" className="text-sm text-destructive mt-1">{state.errors.name.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full" />
                <input type="hidden" name="date" value={selectedDate ? selectedDate.toISOString() : ''} aria-describedby="date-error" />
                {state.errors?.date && <p id="date-error" className="text-sm text-destructive mt-1">{state.errors.date.join(', ')}</p>}
              </div>
            </div>
             <div>
                <Label htmlFor="status">Event Status</Label>
                <Select name="status" defaultValue={currentStatus} onValueChange={(value) => setCurrentStatus(value as EventStatus)}>
                  <SelectTrigger id="status" aria-describedby="status-error">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventStatuses.map(s => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.status && <p id="status-error" className="text-sm text-destructive mt-1">{state.errors.status.join(', ')}</p>}
              </div>
          </div>

          <div className="space-y-6 p-6 border rounded-lg shadow-sm">
             <h3 className="font-headline text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Event Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="buyIn">Buy-in ($)</Label>
                <Input id="buyIn" name="buyIn" type="number" step="0.01" defaultValue={event?.buyIn} required aria-describedby="buyIn-error"/>
                {state.errors?.buyIn && <p id="buyIn-error" className="text-sm text-destructive mt-1">{state.errors.buyIn.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input id="maxPlayers" name="maxPlayers" type="number" defaultValue={event?.maxPlayers} required aria-describedby="maxPlayers-error"/>
                {state.errors?.maxPlayers && <p id="maxPlayers-error" className="text-sm text-destructive mt-1">{state.errors.maxPlayers.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="prizePoolTotal">Total Prize Pool ($)</Label>
                <Input id="prizePoolTotal" name="prizePoolTotal" type="number" step="0.01" defaultValue={event?.prizePool.total} required aria-describedby="prizePoolTotal-error"/>
                {state.errors?.prizePoolTotal && <p id="prizePoolTotal-error" className="text-sm text-destructive mt-1">{state.errors.prizePoolTotal.join(', ')}</p>}
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
                    <Input id="rebuyPrice" name="rebuyPrice" type="number" step="0.01" defaultValue={event?.rebuyPrice} aria-describedby="rebuyPrice-error"/>
                    {state.errors?.rebuyPrice && <p id="rebuyPrice-error" className="text-sm text-destructive mt-1">{state.errors.rebuyPrice.join(', ')}</p>}
                </div>
                )}
            </div>
             {state.errors?.rebuyAllowed && <p className="text-sm text-destructive mt-1">{state.errors.rebuyAllowed.join(', ')}</p>}
          </div>
          
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
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddPlayer(player)} title="Add player" disabled={currentParticipants.length >= (event?.maxPlayers || Infinity)}>
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

          {/* Results Section - only if editing and participants exist */}
          {currentParticipants.length > 0 && (
            <div className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="font-headline text-lg flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Event Results</h3>
              {state.errors?.results && <p className="text-sm text-destructive mt-1">{state.errors.results.join(', ')}</p>}
              {state.errors?.resultsJson && <p className="text-sm text-destructive mt-1">{state.errors.resultsJson.join(', ')}</p>}
              <ScrollArea className="h-96 w-full rounded-md border">
                <div className="p-4 space-y-4">
                {eventResultsInput.map((resultItem) => (
                  <div key={resultItem.playerId} className="p-3 border rounded-md shadow-sm bg-muted/20">
                    <p className="font-medium text-md mb-2">{resultItem.playerName}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`position-${resultItem.playerId}`}>Position</Label>
                        <Input
                          id={`position-${resultItem.playerId}`}
                          name={`results[${resultItem.playerId}][position]`} // Name not strictly needed if using resultsJson
                          type="number"
                          placeholder="e.g., 1"
                          value={resultItem.position}
                          onChange={(e) => handleResultChange(resultItem.playerId, 'position', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`prize-${resultItem.playerId}`}>Prize ($)</Label>
                        <Input
                          id={`prize-${resultItem.playerId}`}
                          name={`results[${resultItem.playerId}][prize]`} // Name not strictly needed
                          type="number"
                          step="0.01"
                          placeholder="e.g., 100.00"
                          value={resultItem.prize}
                          onChange={(e) => handleResultChange(resultItem.playerId, 'prize', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </ScrollArea>
            </div>
          )}


          {state.message && <p className="text-sm text-destructive mt-2 text-center p-2 bg-destructive/10 rounded-md">{state.message}</p>}
          {state.errors?._form && <p className="text-sm text-destructive mt-2 text-center p-2 bg-destructive/10 rounded-md">{state.errors._form.join(', ')}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-4 p-6 border-t">
          <Button variant="outline" asChild>
            <Link href={event ? `/events/${event.id}` : "/events"}>Cancel</Link>
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
