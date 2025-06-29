
'use client';

import type { Event, Player, EventStatus, ServerEventFormState, Season } from '@/lib/definitions'; 
import * as React from 'react';
import { useFormState } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from '@/components/ui/switch';
import { Trophy, PlusCircle, MinusCircle, Users, DollarSign, CalendarDays, Settings, Info, Repeat, Star, Gift, BarChart3, HelpCircle } from 'lucide-react'; 
import Link from 'next/link';
import { eventStatuses } from '@/lib/definitions';

interface EventFormProps {
  event?: Event;
  allPlayers: Player[];
  allSeasons: Season[]; 
  action: (prevState: ServerEventFormState, formData: FormData) => Promise<ServerEventFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultSeasonId?: string; // New prop for default season selection
}

type PositionalResultEntry = {
  position: number;
  playerId: string | null;
  prize: string;
  bountiesWon: string;
  mysteryKoWon: string;
};

interface EnrichedParticipant {
  player: Player;
  rebuys: string;
}

const NO_PLAYER_SELECTED_VALUE = "_internal_no_player_selected_";
const NO_SEASON_SELECTED_VALUE = "NONE"; 

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') {
    return player.nickname;
  }
  if (player.firstName) {
    return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  }
  if (player.lastName) {
    return player.lastName;
  }
  return "Unnamed";
};

const sortPlayersWithGuestsLast = (a: Player, b: Player): number => {
    const aIsGuest = a.isGuest || false;
    const bIsGuest = b.isGuest || false;
    if (aIsGuest !== bIsGuest) {
      return aIsGuest ? 1 : -1;
    }
    return getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b));
};


export default function EventForm({ event, allPlayers, allSeasons, action, formTitle, formDescription, submitButtonText, defaultSeasonId }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(action, initialState);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>(event?.status || 'draft');
  
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<string>(
     event?.seasonId || defaultSeasonId || NO_SEASON_SELECTED_VALUE
  );

  const [includeBounties, setIncludeBounties] = React.useState<boolean>(true);


  const [buyInValue, setBuyInValue] = React.useState<string>(
    event ? (event.buyIn?.toString() ?? '0') : '20'
  );
  const [rebuyPrice, setRebuyPrice] = React.useState<string>(
    event ? (event.rebuyPrice?.toString() ?? '0') : '20'
  );
  const [bountiesValue, setBountiesValue] = React.useState<string>(
    event?.bounties?.toString() || '0'
  );
  const [mysteryKoValue, setMysteryKoValue] = React.useState<string>(
    event?.mysteryKo?.toString() || '0'
  );
  const [totalPrizePoolValue, setTotalPrizePoolValue] = React.useState<string>(
    event?.prizePool.total?.toString() || '0'
  );

  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [enrichedParticipants, setEnrichedParticipants] = React.useState<EnrichedParticipant[]>([]);

  const [positionalResults, setPositionalResults] = React.useState<PositionalResultEntry[]>([]);

  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (event?.date) {
      const parsedDate = new Date(event.date);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
      } else {
        setSelectedDate(undefined);
      }
    } else {
      setSelectedDate(undefined);
    }
    
    if (event?.id) { // Editing an existing event
      setSelectedSeasonId(event.seasonId || NO_SEASON_SELECTED_VALUE);
      setIncludeBounties(event.includeBountiesInNet ?? true); // Set from event, default to true for old events
    } else if (defaultSeasonId) { // Creating a new event with a default season
      setSelectedSeasonId(defaultSeasonId);
      setIncludeBounties(true); // Default ON
    } else { // Creating a new event without a default
      setSelectedSeasonId(NO_SEASON_SELECTED_VALUE);
      setIncludeBounties(true); // Default ON
    }
  }, [event, defaultSeasonId]);

  React.useEffect(() => {
    const initialParticipantIds = new Set(event?.participants || []);
    const initialEnriched: EnrichedParticipant[] = allPlayers
      .filter(p => initialParticipantIds.has(p.id))
      .map(p => {
        const resultForPlayer = event?.results.find(r => r.playerId === p.id);
        return {
          player: p,
          rebuys: resultForPlayer?.rebuys?.toString() || '0',
        };
      })
      .sort((a, b) => getPlayerDisplayName(a.player).localeCompare(getPlayerDisplayName(b.player)));

    const initialAvailable = allPlayers
      .filter(p => !initialParticipantIds.has(p.id))
      .sort(sortPlayersWithGuestsLast);

    setEnrichedParticipants(initialEnriched);
    setAvailablePlayers(initialAvailable);

  }, [allPlayers, event?.participants, event?.results, event?.id]);


  React.useEffect(() => {
    const numPositions = enrichedParticipants.length;
    const participantIdsSet = new Set(enrichedParticipants.map(p => p.player.id));

    setPositionalResults(prevPositionalResults => {
      const newTableData: PositionalResultEntry[] = [];
      for (let i = 1; i <= numPositions; i++) {
        const existingRowInPrevState = prevPositionalResults.find(row => row.position === i);
        // Correctly find the saved result for the current position
        const savedResultFromEventProp = event?.results.find(r => r.position === i);

        let playerIdToSet: string | null = null;
        let prizeToSet = '0';
        let bountiesWonToSet = '0';
        let mysteryKoWonToSet = '0';

        if (existingRowInPrevState) {
          if (existingRowInPrevState.playerId && participantIdsSet.has(existingRowInPrevState.playerId)) {
            playerIdToSet = existingRowInPrevState.playerId;
          } else {
            playerIdToSet = null;
          }
          prizeToSet = existingRowInPrevState.prize || '0';
          bountiesWonToSet = existingRowInPrevState.bountiesWon || '0';
          mysteryKoWonToSet = existingRowInPrevState.mysteryKoWon || '0';
        } else if (savedResultFromEventProp) {
          if (participantIdsSet.has(savedResultFromEventProp.playerId)) {
            playerIdToSet = savedResultFromEventProp.playerId;
            prizeToSet = savedResultFromEventProp.prize?.toString() || '0';
            bountiesWonToSet = savedResultFromEventProp.bountiesWon?.toString() || '0';
            mysteryKoWonToSet = savedResultFromEventProp.mysteryKoWon?.toString() || '0';
          }
        }

        if (playerIdToSet && !participantIdsSet.has(playerIdToSet)) {
            playerIdToSet = null;
        }

        if (playerIdToSet === null) {
            prizeToSet = '0';
            bountiesWonToSet = '0';
            mysteryKoWonToSet = '0';
        }

        newTableData.push({
          position: i,
          playerId: playerIdToSet,
          prize: prizeToSet,
          bountiesWon: bountiesWonToSet,
          mysteryKoWon: mysteryKoWonToSet,
        });
      }
      return newTableData;
    });
  }, [enrichedParticipants, event?.results, event?.id]);

  React.useEffect(() => {
    const numParticipants = enrichedParticipants.length;
    const currentBuyInNum = parseInt(buyInValue) || 0;
    const currentRebuyPriceNum = parseInt(rebuyPrice) || 0;

    let calculatedTotal = 0;

    if (currentBuyInNum > 0) {
      calculatedTotal += numParticipants * currentBuyInNum;
    }

    if (currentRebuyPriceNum > 0) {
      enrichedParticipants.forEach(participant => {
        const rebuys = parseInt(participant.rebuys) || 0;
        if (rebuys > 0) {
          calculatedTotal += rebuys * currentRebuyPriceNum;
        }
      });
    }
    setTotalPrizePoolValue(calculatedTotal.toString());
  }, [enrichedParticipants, buyInValue, rebuyPrice]);

  React.useEffect(() => {
    const prizePoolNum = parseInt(totalPrizePoolValue) || 0;
    const buyInNum = parseInt(buyInValue) || 0;
    const numParticipants = enrichedParticipants.length;

    setPositionalResults(prevResults => {
      const newDistributedResults = prevResults.map(pr => ({ ...pr, prize: '0' }));

      if (prizePoolNum <= 0 || numParticipants === 0) {
        return newDistributedResults;
      }

      let firstPrize = 0;
      let secondPrize = 0;
      let thirdPrize = 0;
      let fourthPrize = 0;

      if (numParticipants < 14) {
        if (numParticipants >= 1) firstPrize = Math.round(prizePoolNum * 0.50);
        if (numParticipants >= 2) secondPrize = Math.round(prizePoolNum * 0.30);
        if (numParticipants >= 3) thirdPrize = Math.round(prizePoolNum * 0.20);
      } else {
        if (buyInNum > 0) {
          if (prizePoolNum >= buyInNum) {
            fourthPrize = buyInNum;
            const remainingPool = prizePoolNum - fourthPrize;
            if (remainingPool > 0) {
              firstPrize = Math.round(remainingPool * 0.50);
              secondPrize = Math.round(remainingPool * 0.30);
              thirdPrize = Math.round(remainingPool * 0.20);
            }
          } else {
            fourthPrize = prizePoolNum;
          }
        } else {
          if (numParticipants >= 1) firstPrize = Math.round(prizePoolNum * 0.50);
          if (numParticipants >= 2) secondPrize = Math.round(prizePoolNum * 0.30);
          if (numParticipants >= 3) thirdPrize = Math.round(prizePoolNum * 0.20);
        }
      }

      const assignPrize = (pos: number, amount: number) => {
        const index = newDistributedResults.findIndex(r => r.position === pos);
        if (index !== -1 && amount > 0) {
          newDistributedResults[index].prize = amount.toString();
        } else if (index !== -1) {
          newDistributedResults[index].prize = '0';
        }
      };

      if (numParticipants >= 1) assignPrize(1, firstPrize); else assignPrize(1,0);
      if (numParticipants >= 2) assignPrize(2, secondPrize); else assignPrize(2,0);
      if (numParticipants >= 3) assignPrize(3, thirdPrize); else assignPrize(3,0);
      if (numParticipants >= 4 && fourthPrize > 0) assignPrize(4, fourthPrize); else assignPrize(4,0);


      return newDistributedResults;
    });
  }, [totalPrizePoolValue, enrichedParticipants.length, buyInValue]);


  const handleAddPlayer = (player: Player) => {
    setEnrichedParticipants(prev => [...prev, { player, rebuys: '0' }].sort((a,b) => getPlayerDisplayName(a.player).localeCompare(getPlayerDisplayName(b.player))));
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (participantToRemove: EnrichedParticipant) => {
    setAvailablePlayers(prev => [...prev, participantToRemove.player].sort(sortPlayersWithGuestsLast));
    setEnrichedParticipants(prev => prev.filter(p => p.player.id !== participantToRemove.player.id));
    setPositionalResults(prev => prev.map(pr => pr.playerId === participantToRemove.player.id ? {...pr, playerId: null, prize: '0', bountiesWon: '0', mysteryKoWon: '0'} : pr ));
  };

  const handleParticipantRebuyChange = (playerId: string, rebuyValue: string) => {
    setEnrichedParticipants(prev =>
      prev.map(ep =>
        ep.player.id === playerId ? { ...ep, rebuys: rebuyValue } : ep
      )
    );
  };

  const handlePositionalResultChange = (position: number, field: 'playerId' | 'prize' | 'bountiesWon' | 'mysteryKoWon', value: string | null) => {
    setPositionalResults(prev =>
      prev.map(row =>
        row.position === position ? { ...row, [field]: value === NO_PLAYER_SELECTED_VALUE ? null : value } : row
      )
    );
  };

  const filteredAvailablePlayers = availablePlayers.filter(player =>
    `${getPlayerDisplayName(player)} ${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hiddenParticipantIds = enrichedParticipants.map(ep => ep.player.id).join(',');

  const finalResultsForJson = positionalResults
    .filter(row => row.playerId && row.playerId !== NO_PLAYER_SELECTED_VALUE)
    .map(row => {
      const participant = enrichedParticipants.find(p => p.player.id === row.playerId);
      const rebuysCount = participant ? (parseInt(participant.rebuys) || 0) : 0;
      return {
        playerId: row.playerId!,
        position: row.position,
        prize: parseInt(row.prize) || 0,
        rebuys: rebuysCount,
        bountiesWon: parseInt(row.bountiesWon) || 0,
        mysteryKoWon: parseInt(row.mysteryKoWon) || 0,
      };
    });
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
          <input type="hidden" name="seasonId" value={selectedSeasonId === NO_SEASON_SELECTED_VALUE ? "" : selectedSeasonId} />


          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary" />Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" defaultValue={event?.name} required aria-describedby="name-error" className="h-9"/>
                {state.errors?.name && <p id="name-error" className="text-sm text-destructive mt-1">{state.errors.name.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <DatePicker date={selectedDate} setDate={setSelectedDate} className="h-9 w-full" />
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
             <div className="pt-2"> 
                <Label htmlFor="seasonId-select" className="flex items-center"><BarChart3 className="mr-2 h-4 w-4 text-primary"/>Link to Season (Optional)</Label>
                <Select 
                    value={selectedSeasonId} 
                    onValueChange={setSelectedSeasonId}
                >
                  <SelectTrigger id="seasonId-select" aria-describedby="seasonId-error" className="h-9">
                    <SelectValue placeholder="-- Select a Season --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SEASON_SELECTED_VALUE}>-- No Season --</SelectItem>
                    {allSeasons.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(season => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.name} ({new Date(season.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short'})} - {season.endDate ? new Date(season.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short'}) : 'Ongoing'}) {season.isActive ? '(Active)' : '(Inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.seasonId && <p id="seasonId-error" className="text-sm text-destructive mt-1">{state.errors.seasonId.join(', ')}</p>}
              </div>
          </div>


          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
             <h3 className="font-headline text-lg flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Event Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="buyIn">Buy-in (Main Prize Pool) (€)</Label>
                <Input
                  id="buyIn"
                  name="buyIn"
                  type="number"
                  step="1"
                  min="0"
                  value={buyInValue}
                  onChange={(e) => setBuyInValue(e.target.value)}
                  required
                  aria-describedby="buyIn-error"
                  className="h-9"
                  placeholder="20"
                />
                {state.errors?.buyIn && <p id="buyIn-error" className="text-sm text-destructive mt-1">{state.errors.buyIn.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="rebuyPrice">Rebuy Price (to Prize Pool) (€)</Label>
                <Input
                    id="rebuyPrice"
                    name="rebuyPrice"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="20"
                    value={rebuyPrice}
                    onChange={(e) => setRebuyPrice(e.target.value)}
                    aria-describedby="rebuyPrice-error"
                    className="h-9"
                />
                {state.errors?.rebuyPrice && <p id="rebuyPrice-error" className="text-sm text-destructive mt-1">{state.errors.rebuyPrice.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="prizePoolTotal">Total Main Prize Pool (€)</Label>
                <Input
                  id="prizePoolTotal"
                  name="prizePoolTotal"
                  type="number"
                  step="1"
                  min="0"
                  value={totalPrizePoolValue}
                  onChange={(e) => setTotalPrizePoolValue(e.target.value)}
                  required
                  aria-describedby="prizePoolTotal-error"
                  className="h-9"
                  placeholder="Auto-calculé"
                  readOnly
                />
                {state.errors?.prizePoolTotal && <p id="prizePoolTotal-error" className="text-sm text-destructive mt-1">{state.errors.prizePoolTotal.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="bounties" className="flex items-center"><Star className="mr-1 h-4 w-4 text-yellow-500" />Bounty Value (€)</Label>
                <Input
                  id="bounties"
                  name="bounties"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={bountiesValue}
                  onChange={(e) => setBountiesValue(e.target.value)}
                  aria-describedby="bounties-error"
                  className="h-9"
                  title="Value of a single bounty."
                />
                {state.errors?.bounties && <p id="bounties-error" className="text-sm text-destructive mt-1">{state.errors.bounties.join(', ')}</p>}
              </div>
              <div>
                <Label htmlFor="mysteryKo" className="flex items-center"><Gift className="mr-1 h-4 w-4 text-purple-500" />Mystery KO Value (€)</Label>
                <Input
                  id="mysteryKo"
                  name="mysteryKo"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={mysteryKoValue}
                  onChange={(e) => setMysteryKoValue(e.target.value)}
                  aria-describedby="mysteryKo-error"
                  className="h-9"
                  title="Value of a single Mystery KO."
                />
                {state.errors?.mysteryKo && <p id="mysteryKo-error" className="text-sm text-destructive mt-1">{state.errors.mysteryKo.join(', ')}</p>}
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                 <Label htmlFor="includeBountiesInNet" className="flex items-center space-x-2 pt-2">
                    <Switch
                        id="includeBountiesInNet"
                        name="includeBountiesInNet"
                        checked={includeBounties}
                        onCheckedChange={setIncludeBounties}
                    />
                    <span>Include Bounties &amp; MSKO in Net Calculation</span>
                    {state.errors?.includeBountiesInNet && <p className="text-sm text-destructive">{state.errors.includeBountiesInNet.join(', ')}</p>}
                </Label>
                <p className="text-xs text-muted-foreground mt-1 ml-12">If disabled, bounty/MSKO costs are not subtracted from player net results for this event.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg shadow-sm">
            <h3 className="font-headline text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Participants ({enrichedParticipants.length})</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label>Available Players ({availablePlayers.length})</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-1.5">
                  {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md">
                      <span>{getPlayerDisplayName(player)}</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddPlayer(player)} title="Add player"
                        disabled={enrichedParticipants.some(ep => ep.player.id === player.id)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2">No players available or matching search.</p>}
                </ScrollArea>
              </div>
              <div className="md:col-span-3">
                <Label>Selected Participants ({enrichedParticipants.length})</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-1.5">
                  {enrichedParticipants.length > 0 ? enrichedParticipants.map(ep => (
                    <div key={ep.player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md gap-2">
                      <span className="flex-grow">{getPlayerDisplayName(ep.player)}</span>
                       <div className="flex items-center gap-1 w-28">
                         <Label htmlFor={`rebuy-${ep.player.id}`} className="sr-only">Rebuys</Label>
                         <Input
                            type="number"
                            id={`rebuy-${ep.player.id}`}
                            name={`rebuy-${ep.player.id}`}
                            min="0"
                            step="1"
                            value={ep.rebuys}
                            onChange={(e) => handleParticipantRebuyChange(ep.player.id, e.target.value)}
                            className="h-8 w-16 text-center"
                            placeholder="Rebuys"
                            disabled={!(parseInt(rebuyPrice) > 0 || (parseInt(bountiesValue) > 0 || parseInt(mysteryKoValue) > 0 || parseInt(rebuyPrice) > 0))}
                         />
                         <Repeat className="h-3 w-3 text-muted-foreground" />
                       </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleRemovePlayer(ep)} title="Remove player">
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2">No participants selected.</p>}
                </ScrollArea>
              </div>
            </div>
          </div>

          {enrichedParticipants.length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg shadow-sm">
              <h3 className="font-headline text-lg flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary" />Event Results</h3>
              {state.errors?.results && <p className="text-sm text-destructive mt-1">{state.errors.results.join(', ')}</p>}
              {state.errors?.resultsJson && <p className="text-sm text-destructive mt-1">{typeof state.errors.resultsJson === 'string' ? state.errors.resultsJson : state.errors.resultsJson.join(', ')}</p>}
              <ScrollArea className="max-h-96 w-full rounded-md border overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[8%] text-center">Pos</TableHead>
                      <TableHead className="w-[25%]">Player</TableHead>
                      <TableHead className="w-[12%] text-center">Rebuys</TableHead>
                      <TableHead className="w-[15%] text-right">Prize (€)</TableHead>
                      <TableHead className="w-[15%] text-right">Bounty (€)</TableHead>
                      <TableHead className="w-[15%] text-right">MSKO (€)</TableHead>
                      <TableHead className="w-[15%] text-right">Net (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionalResults.map((row) => {
                      const participant = enrichedParticipants.find(p => p.player.id === row.playerId);
                      const rebuysDisplay = participant ? participant.rebuys : '0';

                      const prizeNum = parseInt(row.prize) || 0;
                      const bountiesWonNum = parseInt(row.bountiesWon) || 0;
                      const mysteryKoWonNum = parseInt(row.mysteryKoWon) || 0;
                      
                      const mainBuyInNum = parseInt(buyInValue) || 0;
                      const eventBountyValueNum = parseInt(bountiesValue) || 0;
                      const eventMysteryKoValueNum = parseInt(mysteryKoValue) || 0;
                      const rebuysNum = participant ? (parseInt(participant.rebuys) || 0) : 0;
                      const rebuyPriceNum = parseInt(rebuyPrice) || 0;

                      let calculatedFinalResult = 0;
                      if (row.playerId && row.playerId !== NO_PLAYER_SELECTED_VALUE) {
                        const investmentInMainPot = mainBuyInNum + (rebuysNum * rebuyPriceNum);
                        if (includeBounties) {
                          const bountyAndMkoCostsPerEntry = eventBountyValueNum + eventMysteryKoValueNum;
                          const totalInvestmentInExtras = (1 + rebuysNum) * bountyAndMkoCostsPerEntry;
                          const totalInvestment = investmentInMainPot + totalInvestmentInExtras;
                          const totalWinnings = prizeNum + bountiesWonNum + mysteryKoWonNum;
                          calculatedFinalResult = totalWinnings - totalInvestment;
                        } else {
                          calculatedFinalResult = prizeNum - investmentInMainPot;
                        }
                      }
                      const finalResultDisplay = calculatedFinalResult.toString();

                      return (
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
                                {enrichedParticipants.map(ep => (
                                  <SelectItem key={ep.player.id} value={ep.player.id}
                                    disabled={positionalResults.some(pr => pr.playerId === ep.player.id && pr.position !== row.position)}
                                  >
                                    {getPlayerDisplayName(ep.player)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-1 text-center">
                            <Input
                              type="text"
                              value={rebuysDisplay}
                              readOnly
                              className="h-9 text-center bg-muted/50 border-none"
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.prize}
                              onChange={(e) => handlePositionalResultChange(row.position, 'prize', e.target.value)}
                              className="text-right h-9"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.bountiesWon}
                              onChange={(e) => handlePositionalResultChange(row.position, 'bountiesWon', e.target.value)}
                              className="text-right h-9"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.mysteryKoWon}
                              onChange={(e) => handlePositionalResultChange(row.position, 'mysteryKoWon', e.target.value)}
                              className="text-right h-9"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1 text-right">
                             <Input
                              type="text"
                              value={finalResultDisplay}
                              readOnly
                              className="h-9 text-right bg-muted/50 border-none"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

    

    