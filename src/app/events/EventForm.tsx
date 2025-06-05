
'use client';

import type { Event, Player, EventStatus, ServerEventFormState } from '@/lib/definitions';
import * as React from 'react';
import { useActionState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

type PositionalResultEntry = {
  position: number;
  playerId: string | null;
  prize: string;
  rebuys: string;
};

const NO_PLAYER_SELECTED_VALUE = "_internal_no_player_selected_";


export default function EventForm({ event, allPlayers, action, formTitle, formDescription, submitButtonText }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>(event?.status || 'draft');
  
  const [buyInValue, setBuyInValue] = React.useState<string>(event?.buyIn?.toString() || '');
  const [rebuyPrice, setRebuyPrice] = React.useState<string>(event?.rebuyPrice?.toString() || '');
  const [totalPrizePoolValue, setTotalPrizePoolValue] = React.useState<string>(event?.prizePool.total?.toString() || '0');


  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [currentParticipants, setCurrentParticipants] = React.useState<Player[]>([]);

  const [positionalResults, setPositionalResults] = React.useState<PositionalResultEntry[]>([]);

  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    // Initialize to undefined to prevent hydration mismatch
    setSelectedDate(undefined);
    // Then, set the actual date on the client side after hydration
    if (event?.date) {
      const parsedDate = new Date(event.date);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      }
    }
  }, [event?.date, event?.id]);

  React.useEffect(() => {
    const initialParticipantIds = event?.participants || [];
    const initialParticipants = allPlayers.filter(p => initialParticipantIds.includes(p.id));
    const initialAvailable = allPlayers.filter(p => !initialParticipantIds.includes(p.id));

    setCurrentParticipants(initialParticipants.sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(initialAvailable.sort((a,b) => a.firstName.localeCompare(b.firstName)));

  }, [allPlayers, event?.participants]);


  React.useEffect(() => {
    const numPositions = currentParticipants.length;
    const participantIdsSet = new Set(currentParticipants.map(p => p.id));

    setPositionalResults(prevPositionalResults => {
      const newTableData: PositionalResultEntry[] = [];
      for (let i = 1; i <= numPositions; i++) {
        const existingRowInPrevState = prevPositionalResults.find(row => row.position === i);
        const savedResultFromEventProp = event?.results.find(r => r.position === i);

        let playerIdToSet: string | null = null;
        let prizeToSet = '0'; // Default to '0'
        let rebuysToSet = '0';

        if (existingRowInPrevState) {
          if (existingRowInPrevState.playerId && participantIdsSet.has(existingRowInPrevState.playerId)) {
            playerIdToSet = existingRowInPrevState.playerId;
          } else {
            playerIdToSet = null;
          }
          prizeToSet = existingRowInPrevState.prize || '0';
          rebuysToSet = existingRowInPrevState.rebuys || '0';
        }
        else if (savedResultFromEventProp) {
          if (participantIdsSet.has(savedResultFromEventProp.playerId)) {
            playerIdToSet = savedResultFromEventProp.playerId;
            prizeToSet = savedResultFromEventProp.prize?.toString() || '0';
            rebuysToSet = savedResultFromEventProp.rebuys?.toString() || '0';
          }
        }

        if (playerIdToSet && !participantIdsSet.has(playerIdToSet)) {
            playerIdToSet = null;
        }
        
        // Ensure prize is always a string, default to '0' if it becomes undefined/null
        if (playerIdToSet === null) prizeToSet = '0';


        newTableData.push({
          position: i,
          playerId: playerIdToSet,
          prize: prizeToSet,
          rebuys: rebuysToSet,
        });
      }
      return newTableData;
    });
  }, [currentParticipants, event?.results, event?.id]);

  // Calculate Prize Pool
  React.useEffect(() => {
    const numParticipants = currentParticipants.length;
    const currentBuyInNum = parseFloat(buyInValue);
    const currentRebuyPriceNum = parseFloat(rebuyPrice);
  
    let calculatedTotal = 0;
  
    if (!isNaN(currentBuyInNum) && currentBuyInNum > 0) {
      calculatedTotal += numParticipants * currentBuyInNum;
    }
  
    if (!isNaN(currentRebuyPriceNum) && currentRebuyPriceNum > 0) {
      positionalResults.forEach(result => {
        if (result.playerId && result.playerId !== NO_PLAYER_SELECTED_VALUE) {
          const rebuys = parseInt(result.rebuys);
          if (!isNaN(rebuys) && rebuys > 0) {
            calculatedTotal += rebuys * currentRebuyPriceNum;
          }
        }
      });
    }
  
    setTotalPrizePoolValue(calculatedTotal.toFixed(2));
  
  }, [currentParticipants.length, buyInValue, rebuyPrice, positionalResults]);

  // Auto-distribute prizes
  React.useEffect(() => {
    const prizePoolNum = parseFloat(totalPrizePoolValue);
    const buyInNum = parseFloat(buyInValue);
    const numParticipants = currentParticipants.length;

    setPositionalResults(prevResults => {
      const newDistributedResults = prevResults.map(pr => ({ ...pr, prize: '0.00' }));

      if (isNaN(prizePoolNum) || prizePoolNum <= 0 || numParticipants === 0) {
        return newDistributedResults; 
      }

      let firstPrize = 0;
      let secondPrize = 0;
      let thirdPrize = 0;
      let fourthPrize = 0;

      if (numParticipants < 14) {
        if (numParticipants >= 1) firstPrize = prizePoolNum * 0.50;
        if (numParticipants >= 2) secondPrize = prizePoolNum * 0.30;
        if (numParticipants >= 3) thirdPrize = prizePoolNum * 0.20;
      } else { // numParticipants >= 14
        if (!isNaN(buyInNum) && buyInNum > 0) {
          if (prizePoolNum >= buyInNum) {
            fourthPrize = buyInNum;
            const remainingPool = prizePoolNum - fourthPrize;
            if (remainingPool > 0) {
              firstPrize = remainingPool * 0.50;
              secondPrize = remainingPool * 0.30;
              thirdPrize = remainingPool * 0.20;
            }
          } else { // prizePoolNum < buyInNum
            fourthPrize = prizePoolNum; // 4th takes the entire (small) pool
          }
        } else { // buyIn is invalid or zero, revert to <14 distribution for 1st-3rd using full pool
          if (numParticipants >= 1) firstPrize = prizePoolNum * 0.50;
          if (numParticipants >= 2) secondPrize = prizePoolNum * 0.30;
          if (numParticipants >= 3) thirdPrize = prizePoolNum * 0.20;
        }
      }
      
      const assignPrize = (pos: number, amount: number) => {
        const index = newDistributedResults.findIndex(r => r.position === pos);
        if (index !== -1 && amount > 0) {
          newDistributedResults[index].prize = amount.toFixed(2);
        } else if (index !== -1) {
          newDistributedResults[index].prize = '0.00';
        }
      };
      
      if (numParticipants >= 1) assignPrize(1, firstPrize); else assignPrize(1,0);
      if (numParticipants >= 2) assignPrize(2, secondPrize); else assignPrize(2,0);
      if (numParticipants >= 3) assignPrize(3, thirdPrize); else assignPrize(3,0);
      if (numParticipants >= 4 && fourthPrize > 0) assignPrize(4, fourthPrize); else assignPrize(4,0);

      // Ensure any positions beyond the distributed ones have prize '0.00'
      // This is already handled by the initial map: const newDistributedResults = prevResults.map(pr => ({ ...pr, prize: '0.00' }));

      return newDistributedResults;
    });
  }, [totalPrizePoolValue, currentParticipants.length, buyInValue]);


  const handleAddPlayer = (player: Player) => {
    setCurrentParticipants(prev => [...prev, player].sort((a,b) => a.firstName.localeCompare(b.firstName)));
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (player: Player) => {
    setAvailablePlayers(prev => [...prev, player].sort((a, b) => a.firstName.localeCompare(b.firstName)));
    setCurrentParticipants(prev => prev.filter(p => p.id !== player.id));
  };

  const handlePositionalResultChange = (position: number, field: 'playerId' | 'prize' | 'rebuys', value: string | null) => {
    setPositionalResults(prev =>
      prev.map(row =>
        row.position === position ? { ...row, [field]: value === NO_PLAYER_SELECTED_VALUE ? null : value } : row
      )
    );
  };

  const filteredAvailablePlayers = availablePlayers.filter(player =>
    `${player.firstName} ${player.lastName} ${player.nickname || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hiddenParticipantIds = currentParticipants.map(p => p.id).join(',');

  const finalResultsForJson = positionalResults
    .filter(row => row.playerId && row.playerId !== NO_PLAYER_SELECTED_VALUE)
    .map(row => ({
      playerId: row.playerId!,
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
        <CardContent className="space-y-6">
          {event?.id && <input type="hidden" name="id" defaultValue={event.id} />}
          <input type="hidden" name="resultsJson" value={resultsJson} />

          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" defaultValue={event?.name} required aria-describedby="name-error" className="h-9"/>
                {state.errors?.name && <p id="name-error" className="text-sm text-destructive mt-1">{state.errors.name.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <DatePicker date={selectedDate} setDate={setSelectedDate} className="w-full h-9" />
                <input type="hidden" name="date" value={selectedDate ? selectedDate.toISOString() : ''} aria-describedby="date-error" />
                {state.errors?.date && <p id="date-error" className="text-sm text-destructive mt-1">{state.errors.date.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="status">Event Status</Label>
                <Select name="status" value={currentStatus} onValueChange={(value) => setCurrentStatus(value as EventStatus)}>
                  <SelectTrigger id="status" aria-describedby="status-error" className="h-9">
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

          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
             <h3 className="font-headline text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Event Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="buyIn">Buy-in ($)</Label>
                <Input 
                  id="buyIn" 
                  name="buyIn" 
                  type="number" 
                  step="0.01" 
                  value={buyInValue}
                  onChange={(e) => setBuyInValue(e.target.value)}
                  required 
                  aria-describedby="buyIn-error" 
                  className="h-9"
                />
                {state.errors?.buyIn && <p id="buyIn-error" className="text-sm text-destructive mt-1">{state.errors.buyIn.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="rebuyPrice">Rebuy Price ($)</Label>
                <Input
                    id="rebuyPrice"
                    name="rebuyPrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 20.00"
                    value={rebuyPrice}
                    onChange={(e) => setRebuyPrice(e.target.value)}
                    aria-describedby="rebuyPrice-error"
                    className="h-9"
                />
                {state.errors?.rebuyPrice && <p id="rebuyPrice-error" className="text-sm text-destructive mt-1">{state.errors.rebuyPrice.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="prizePoolTotal">Total Prize Pool ($)</Label>
                <Input 
                  id="prizePoolTotal" 
                  name="prizePoolTotal" 
                  type="number" 
                  step="0.01" 
                  value={totalPrizePoolValue}
                  onChange={(e) => setTotalPrizePoolValue(e.target.value)}
                  required 
                  aria-describedby="prizePoolTotal-error" 
                  className="h-9"
                />
                {state.errors?.prizePoolTotal && <p id="prizePoolTotal-error" className="text-sm text-destructive mt-1">{state.errors.prizePoolTotal.join(', ')}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Participants ({currentParticipants.length})</h3>
             {state.errors?.participantIds && <p className="text-sm text-destructive mt-1">{state.errors.participantIds.join(', ')}</p>}
            <input type="hidden" name="participantIds" value={hiddenParticipantIds} />
            
            <div className="mb-3">
              <Label htmlFor="searchPlayers">Search Available Players</Label>
              <Input
                  id="searchPlayers"
                  placeholder="Search by name or nickname..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Available Players</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-2">
                  {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md">
                      <span>{player.firstName} {player.lastName} {player.nickname ? `(${player.nickname})` : ''}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddPlayer(player)} title="Add player"
                        disabled={currentParticipants.some(p => p.id === player.id)}>
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
                    <div key={player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md">
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
            <div className="space-y-4 p-4 border rounded-lg shadow-sm">
              <h3 className="font-headline text-lg flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Event Results</h3>
              {state.errors?.results && <p className="text-sm text-destructive mt-1">{state.errors.results.join(', ')}</p>}
              {state.errors?.resultsJson && <p className="text-sm text-destructive mt-1">{typeof state.errors.resultsJson === 'string' ? state.errors.resultsJson : state.errors.resultsJson.join(', ')}</p>}
              <ScrollArea className="max-h-56 w-full rounded-md border overflow-y-auto">
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
                        <TableCell className="font-medium py-1 text-center">{row.position}</TableCell>
                        <TableCell className="py-1">
                          <Select
                            value={row.playerId || NO_PLAYER_SELECTED_VALUE}
                            onValueChange={(value) => handlePositionalResultChange(row.position, 'playerId', value)}
                          >
                            <SelectTrigger className="w-full h-9">
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
                        <TableCell className="py-1">
                          <Input
                            id={`rebuys-pos-${row.position}`}
                            type="number"
                            min="0"
                            placeholder="e.g., 0"
                            value={row.rebuys}
                            onChange={(e) => handlePositionalResultChange(row.position, 'rebuys', e.target.value)}
                            className="text-center h-9"
                            disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE || !(parseFloat(rebuyPrice) > 0)}
                          />
                        </TableCell>
                        <TableCell className="py-1">
                          <Input
                            id={`prize-pos-${row.position}`}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 100.00"
                            value={row.prize} // This will now be auto-calculated primarily
                            onChange={(e) => handlePositionalResultChange(row.position, 'prize', e.target.value)}
                            className="text-right h-9"
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

