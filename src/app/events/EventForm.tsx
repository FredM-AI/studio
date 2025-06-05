
'use client';

import type { Event, Player, EventStatus } from '@/lib/definitions';
import type { ServerEventFormState } from '@/lib/definitions';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, PlusCircle, MinusCircle, Users, DollarSign, CalendarDays, Settings, Info } from 'lucide-react';
import Link from 'next/link';
import { eventStatuses } from '@/lib/definitions';

interface EventFormProps {
  event?: Event;
  allPlayers: Player[];
  action: (prevState: ServerEventFormState, formData: FormData) => Promise<ServerEventFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
}

// Type for the internal state of the results table
type PositionalResultEntry = {
  position: number;
  playerId: string | null; // Can be null if no player assigned to this position
  prize: string;
  rebuys: string;
};

const NO_PLAYER_SELECTED_VALUE = "_internal_no_player_selected_";


export default function EventForm({ event, allPlayers, action, formTitle, formDescription, submitButtonText }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [rebuyAllowed, setRebuyAllowed] = React.useState<boolean>(event?.rebuyAllowed || false);
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>(event?.status || 'draft');

  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [currentParticipants, setCurrentParticipants] = React.useState<Player[]>([]);
  
  // State for the results table: array of objects, one per position
  const [positionalResults, setPositionalResults] = React.useState<PositionalResultEntry[]>([]);
  
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (event?.date) {
      const parsedDate = new Date(event.date);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    } else {
      setSelectedDate(undefined);
    }
  }, [event?.date]);

  React.useEffect(() => {
    const initialParticipantIds = event?.participants || [];
    const initialParticipants = allPlayers.filter(p => initialParticipantIds.includes(p.id));
    const initialAvailable = allPlayers.filter(p => !initialParticipantIds.includes(p.id));
    
    setCurrentParticipants(initialParticipants.sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(initialAvailable.sort((a,b) => a.firstName.localeCompare(b.firstName)));

  }, [allPlayers, event?.participants]);


  React.useEffect(() => {
    // Determine the number of positions based on the current number of participants.
    const numPositions = currentParticipants.length;
    const participantIdsSet = new Set(currentParticipants.map(p => p.id));

    setPositionalResults(prevPositionalResults => {
      const newTableData: PositionalResultEntry[] = [];
      // Create a row for each position, from 1 to the number of participants.
      for (let i = 1; i <= numPositions; i++) {
        const existingRowInPrevState = prevPositionalResults.find(row => row.position === i);
        const savedResultFromEventProp = event?.results.find(r => r.position === i);

        let playerIdToSet: string | null = null;
        let prizeToSet = '';
        let rebuysToSet = '0';

        // Prioritize data already in form state if participant list changes, and player is still valid
        if (existingRowInPrevState) {
          if (existingRowInPrevState.playerId && participantIdsSet.has(existingRowInPrevState.playerId)) {
            playerIdToSet = existingRowInPrevState.playerId;
          } else {
            playerIdToSet = null; // Player became invalid or was null
          }
          prizeToSet = existingRowInPrevState.prize; // Keep edits
          rebuysToSet = existingRowInPrevState.rebuys; // Keep edits
        } 
        // Fallback to event prop for initial load if no form state or player was invalid
        else if (savedResultFromEventProp) {
          if (participantIdsSet.has(savedResultFromEventProp.playerId)) {
            playerIdToSet = savedResultFromEventProp.playerId;
            prizeToSet = savedResultFromEventProp.prize.toString();
            rebuysToSet = savedResultFromEventProp.rebuys?.toString() || '0';
          }
        }
        
        // Final check: if playerIdToSet is somehow invalid after these checks, ensure it's null
        if (playerIdToSet && !participantIdsSet.has(playerIdToSet)) {
            playerIdToSet = null;
            // If player becomes invalid, we might want to clear their prize/rebuys or let user adjust
            // prizeToSet = ''; 
            // rebuysToSet = '0';
        }

        newTableData.push({
          position: i, // Assigns the current position number
          playerId: playerIdToSet,
          prize: prizeToSet,
          rebuys: rebuysToSet,
        });
      }
      // The newTableData will always have 'numPositions' (i.e., currentParticipants.length) entries.
      return newTableData;
    });
  }, [currentParticipants, event?.results, event?.id]); // Dependencies that trigger recalculation


  const handleAddPlayer = (player: Player) => {
    setCurrentParticipants(prev => [...prev, player].sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (player: Player) => {
    setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    setCurrentParticipants(prev => prev.filter(p => p.id !== player.id));
    // When a player is removed from participants, their assignment in positionalResults might become invalid.
    // The useEffect for positionalResults should handle cleaning this up by setting playerId to null if invalid.
  };

  const handlePositionalResultChange = (position: number, field: 'playerId' | 'prize' | 'rebuys', value: string | null) => {
    setPositionalResults(prev => 
      prev.map(row => 
        row.position === position ? { ...row, [field]: value } : row
      )
    );
  };

  const filteredAvailablePlayers = availablePlayers.filter(player =>
    `${player.firstName} ${player.lastName} ${player.nickname || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const hiddenParticipantIds = currentParticipants.map(p => p.id).join(',');
  
  const finalResultsForJson = positionalResults
    .filter(row => row.playerId && row.playerId !== NO_PLAYER_SELECTED_VALUE) // Only include rows where a player is assigned
    .map(row => ({
      playerId: row.playerId!, // playerID is confirmed to be non-null by filter
      position: row.position,
      prize: parseFloat(row.prize) || 0,
      rebuys: parseInt(row.rebuys) || 0,
    }));
  const resultsJson = JSON.stringify(finalResultsForJson);


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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div>
                <Label htmlFor="status">Event Status</Label>
                <Select name="status" value={currentStatus} onValueChange={(value) => setCurrentStatus(value as EventStatus)}>
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
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddPlayer(player)} title="Add player" 
                        disabled={(event?.maxPlayers !== undefined && typeof event.maxPlayers === 'number' && currentParticipants.length >= event.maxPlayers) || currentParticipants.some(p => p.id === player.id)}>
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

          {currentParticipants.length > 0 && (
            <div className="space-y-6 p-6 border rounded-lg shadow-sm">
              <h3 className="font-headline text-lg flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Event Results</h3>
              {state.errors?.results && <p className="text-sm text-destructive mt-1">{state.errors.results.join(', ')}</p>}
              {state.errors?.resultsJson && <p className="text-sm text-destructive mt-1">{typeof state.errors.resultsJson === 'string' ? state.errors.resultsJson : state.errors.resultsJson.join(', ')}</p>}
              <ScrollArea className="max-h-[500px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[10%] text-center">Position</TableHead>
                      <TableHead className="w-[40%]">Player</TableHead>
                      <TableHead className="w-[20%] text-center">Rebuys</TableHead>
                      <TableHead className="w-[30%] text-right">Prize ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionalResults.map((row) => (
                      <TableRow key={row.position}>
                        <TableCell className="font-medium py-3 text-center">{row.position}</TableCell>
                        <TableCell className="py-2">
                          <Select
                            value={row.playerId || NO_PLAYER_SELECTED_VALUE}
                            onValueChange={(value) => handlePositionalResultChange(row.position, 'playerId', value === NO_PLAYER_SELECTED_VALUE ? null : value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="-- Select Player --" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_PLAYER_SELECTED_VALUE}>-- None --</SelectItem>
                              {currentParticipants.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.firstName} {p.lastName} {p.nickname ? `(${p.nickname})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            id={`rebuys-pos-${row.position}`}
                            type="number"
                            min="0"
                            placeholder="e.g., 0"
                            value={row.rebuys}
                            onChange={(e) => handlePositionalResultChange(row.position, 'rebuys', e.target.value)}
                            className="text-center"
                            disabled={!rebuyAllowed || !row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE} 
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            id={`prize-pos-${row.position}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 100.00"
                            value={row.prize}
                            onChange={(e) => handlePositionalResultChange(row.position, 'prize', e.target.value)}
                            className="text-right"
                            disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {positionalResults.length === 0 && <p className="text-muted-foreground p-4 text-center">Add participants to enable result entry.</p>}
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

    

    