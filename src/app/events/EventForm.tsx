
'use client';

import type { Event, Player, EventStatus, ServerEventFormState, Season, BlindStructureTemplate } from '@/lib/definitions'; 
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
import { Switch } from '@/components/ui/switch';
import { Trophy, PlusCircle, MinusCircle, Users, DollarSign, CalendarDays, Settings, Info, Repeat, Star, Gift, BarChart3, HelpCircle, Clock, Hash, PlayCircle } from 'lucide-react'; 
import Link from 'next/link';
import { eventStatuses } from '@/lib/definitions';
import DeleteEventButton from './[eventId]/DeleteEventButton';

interface EventFormProps {
  event?: Event;
  allPlayers: Player[];
  allSeasons: Season[]; 
  blindStructures: BlindStructureTemplate[];
  action: (prevState: ServerEventFormState, formData: FormData) => Promise<ServerEventFormState>;
  formTitle: string;
  formDescription: string;
  submitButtonText: string;
  defaultSeasonId?: string;
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


export default function EventForm({ event, allPlayers, allSeasons, blindStructures, action, formTitle, formDescription, submitButtonText, defaultSeasonId }: EventFormProps) {
  const initialState: ServerEventFormState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(action, initialState);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [currentStatus, setCurrentStatus] = React.useState<EventStatus>(event?.status || 'draft');
  
  const [selectedSeasonId, setSelectedSeasonId] = React.useState<string>(
     event?.seasonId || defaultSeasonId || NO_SEASON_SELECTED_VALUE
  );
  
  const [selectedBlindStructureId, setSelectedBlindStructureId] = React.useState<string>(
      event?.blindStructureId || (blindStructures.length > 0 ? blindStructures[0].id : 'NONE')
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
  const [startingStackValue, setStartingStackValue] = React.useState<string>(
    event?.startingStack?.toString() || '10000'
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
      setIncludeBounties(event.includeBountiesInNet ?? true); 
      setSelectedBlindStructureId(event.blindStructureId || (blindStructures.length > 0 ? blindStructures[0].id : 'NONE'));
    } else if (defaultSeasonId) { // Creating a new event with a default season
      setSelectedSeasonId(defaultSeasonId);
      setIncludeBounties(true); 
    } else { // Creating a new event without a default
      setSelectedSeasonId(NO_SEASON_SELECTED_VALUE);
      setIncludeBounties(true); 
    }
  }, [event, defaultSeasonId, blindStructures]);

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

    // An inactive player who participated should still be in the participant list,
    // but a new inactive player should not be in the "available" list.
    const initialAvailable = allPlayers
      .filter(p => p.isActive && !initialParticipantIds.has(p.id))
      .sort(sortPlayersWithGuestsLast);

    setEnrichedParticipants(initialEnriched);
    setAvailablePlayers(initialAvailable);

  }, [allPlayers, event?.participants, event?.results, event?.id]);


  React.useEffect(() => {
    const numPositions = enrichedParticipants.length;
    const participantIdsSet = new Set(enrichedParticipants.map(p => p.player.id));

    // Reset positionalResults completely whenever participants change.
    const newTableData: PositionalResultEntry[] = [];
    for (let i = 1; i <= numPositions; i++) {
        newTableData.push({
            position: i,
            playerId: null,
            prize: '0',
            bountiesWon: '0',
            mysteryKoWon: '0',
        });
    }

    // Try to populate with saved data if it exists for this participant set
    if (event?.results && event.results.length > 0) {
        event.results.forEach(savedResult => {
            const index = savedResult.position - 1;
            if (index >= 0 && index < newTableData.length) {
                if (participantIdsSet.has(savedResult.playerId)) {
                    newTableData[index] = {
                        position: savedResult.position,
                        playerId: savedResult.playerId,
                        prize: savedResult.prize.toString(),
                        bountiesWon: (savedResult.bountiesWon || 0).toString(),
                        mysteryKoWon: (savedResult.mysteryKoWon || 0).toString(),
                    };
                }
            }
        });
    }
    
    setPositionalResults(newTableData);
  }, [enrichedParticipants.length, event?.participants, event?.results]);


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
        const numParticipants = enrichedParticipants.length;

        // Only run calculation if we have a pool and participants
        if (prizePoolNum <= 0 || numParticipants === 0) {
            setPositionalResults(prev => prev.map(row => ({ ...row, prize: '0' })));
            return;
        }

        // Do not auto-calculate if there are manual entries
        const hasManualPrizes = positionalResults.some(r => parseInt(r.prize) > 0);
        const hasLoadedPrizes = event?.results && event.results.length > 0;
        if (hasManualPrizes && !hasLoadedPrizes) return;


        let prizes: { [key: number]: number } = {};
        
        if (numParticipants >= 15) {
            const fourthPrize = Math.round((prizePoolNum * 0.10) / 10) * 10;
            const remainingForTop3 = prizePoolNum - fourthPrize;
            if (remainingForTop3 > 0) {
                const thirdPrize = Math.round((remainingForTop3 * 0.20) / 10) * 10;
                const secondPrize = Math.round((remainingForTop3 * 0.30) / 10) * 10;
                const firstPrize = remainingForTop3 - secondPrize - thirdPrize;
                prizes = { 1: firstPrize, 2: secondPrize, 3: thirdPrize, 4: fourthPrize };
            } else { // Fallback if 4th prize is larger than pool
                 const thirdPrize = Math.round((prizePoolNum * 0.20) / 10) * 10;
                 const secondPrize = Math.round((prizePoolNum * 0.30) / 10) * 10;
                 prizes = { 1: prizePoolNum - secondPrize - thirdPrize, 2: secondPrize, 3: thirdPrize };
            }
        } else if (numParticipants >= 3) {
            const thirdPrize = Math.round((prizePoolNum * 0.20) / 10) * 10;
            const secondPrize = Math.round((prizePoolNum * 0.30) / 10) * 10;
            const firstPrize = prizePoolNum - secondPrize - thirdPrize;
            prizes = { 1: firstPrize, 2: secondPrize, 3: thirdPrize };
        } else if (numParticipants === 2) {
            const secondPrize = Math.round((prizePoolNum * 0.35) / 10) * 10;
            prizes = { 1: prizePoolNum - secondPrize, 2: secondPrize };
        } else if (numParticipants === 1) {
            prizes = { 1: prizePoolNum };
        }
        
        setPositionalResults(prevResults => {
            return prevResults.map(row => ({
                ...row,
                prize: prizes[row.position]?.toString() || '0'
            }));
        });
    }, [totalPrizePoolValue, enrichedParticipants.length]);


  // Effect to update starting stack when a blind structure is selected
  React.useEffect(() => {
      if (selectedBlindStructureId !== 'NONE') {
          const selected = blindStructures.find(bs => bs.id === selectedBlindStructureId);
          if (selected && selected.startingStack) {
              setStartingStackValue(selected.startingStack.toString());
          }
      }
  }, [selectedBlindStructureId, blindStructures]);


  const handleAddPlayer = (player: Player) => {
    setEnrichedParticipants(prev => [...prev, { player, rebuys: '0' }].sort((a,b) => getPlayerDisplayName(a.player).localeCompare(getPlayerDisplayName(b.player))));
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const handleRemovePlayer = (participantToRemove: EnrichedParticipant) => {
    if (participantToRemove.player.isActive) {
      setAvailablePlayers(prev => [...prev, participantToRemove.player].sort(sortPlayersWithGuestsLast));
    }
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


  const isCreating = !event?.id;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{formTitle}</CardTitle>
        <CardDescription>{formDescription}</CardDescription>
      </CardHeader>
      <form action={dispatch}>
        <CardContent className="space-y-4">
          {event?.id && <input type="hidden" name="id" defaultValue={event.id} />}
          <input type="hidden" name="resultsJson" value={resultsJson} />
          <input type="hidden" name="seasonId" value={selectedSeasonId === NO_SEASON_SELECTED_VALUE ? "" : selectedSeasonId} />
          <input type="hidden" name="blindStructureId" value={selectedBlindStructureId === 'NONE' ? "" : selectedBlindStructureId} />

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
               <div>
                    <Label htmlFor="startingStack" className="flex items-center"><Hash className="mr-1 h-4 w-4" />Starting Stack</Label>
                    <Input
                        id="startingStack"
                        name="startingStack"
                        type="number"
                        step="1000"
                        min="0"
                        placeholder="10000"
                        value={startingStackValue}
                        onChange={(e) => setStartingStackValue(e.target.value)}
                        aria-describedby="startingStack-error"
                        className="h-9"
                    />
                    {state.errors?.startingStack && <p id="startingStack-error" className="text-sm text-destructive mt-1">{state.errors.startingStack.join(', ')}</p>}
                </div>
              <div className="flex items-center space-x-2 pt-2 md:col-span-2">
                  <Switch
                      id="includeBountiesInNet"
                      name="includeBountiesInNet"
                      checked={includeBounties}
                      onCheckedChange={setIncludeBounties}
                  />
                  <div>
                    <Label htmlFor="includeBountiesInNet">Bounties in Net Calc</Label>
                    <p className="text-xs text-muted-foreground">If off, bounty/MSKO costs are not subtracted from player net results.</p>
                  </div>
              </div>
            </div>
             <div className="pt-2"> 
                <Label htmlFor="blindStructureId-select" className="flex items-center"><Clock className="mr-2 h-4 w-4 text-primary"/>Blind Structure</Label>
                <Select 
                    value={selectedBlindStructureId} 
                    onValueChange={setSelectedBlindStructureId}
                    name="blindStructureId"
                >
                  <SelectTrigger id="blindStructureId-select" aria-describedby="blindStructure-error" className="h-9">
                    <SelectValue placeholder="-- Select a Structure --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- No Structure --</SelectItem>
                    {blindStructures.sort((a,b) => a.name.localeCompare(b.name)).map(structure => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.errors?.blindStructureId && <p id="blindStructure-error" className="text-sm text-destructive mt-1">{state.errors.blindStructureId.join(', ')}</p>}
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
                <ScrollArea className="h-60 w-full rounded-md border p-1.5">
                  {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md text-sm">
                      <span>{getPlayerDisplayName(player)}</span>
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAddPlayer(player)} title="Add player"
                        disabled={enrichedParticipants.some(ep => ep.player.id === player.id)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2 text-sm">No players available or matching search.</p>}
                </ScrollArea>
              </div>
              <div className="md:col-span-3">
                <Label>Selected Participants ({enrichedParticipants.length})</Label>
                <ScrollArea className="h-60 w-full rounded-md border p-1.5">
                  {enrichedParticipants.length > 0 ? enrichedParticipants.map(ep => (
                    <div key={ep.player.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md gap-2 text-sm">
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
                      <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRemovePlayer(ep)} title="Remove player">
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : <p className="text-muted-foreground p-2 text-sm">No participants selected.</p>}
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
                      <TableHead className="w-[8%] text-center p-2">Pos</TableHead>
                      <TableHead className="w-[25%] p-2">Player</TableHead>
                      <TableHead className="w-[12%] text-center p-2">Rebuys</TableHead>
                      <TableHead className="w-[15%] text-right p-2">Prize (€)</TableHead>
                      <TableHead className="w-[15%] text-right p-2">Bounty (€)</TableHead>
                      <TableHead className="w-[15%] text-right p-2">MSKO (€)</TableHead>
                      <TableHead className="w-[15%] text-right p-2">Net (€)</TableHead>
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
                          <TableCell className="font-medium py-1 px-2 text-center">{row.position}</TableCell>
                          <TableCell className="py-1 px-2">
                            <Select
                              value={row.playerId || NO_PLAYER_SELECTED_VALUE}
                              onValueChange={(value) => handlePositionalResultChange(row.position, 'playerId', value)}
                            >
                              <SelectTrigger className="w-full h-8 text-xs">
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
                          <TableCell className="py-1 px-2 text-center">
                            <Input
                              type="text"
                              value={rebuysDisplay}
                              readOnly
                              className="h-8 text-center bg-muted/50 border-none"
                            />
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.prize}
                              onChange={(e) => handlePositionalResultChange(row.position, 'prize', e.target.value)}
                              className="text-right h-8"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.bountiesWon}
                              onChange={(e) => handlePositionalResultChange(row.position, 'bountiesWon', e.target.value)}
                              className="text-right h-8"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <Input
                              type="number"
                              step="1" min="0" placeholder="0"
                              value={row.mysteryKoWon}
                              onChange={(e) => handlePositionalResultChange(row.position, 'mysteryKoWon', e.target.value)}
                              className="text-right h-8"
                              disabled={!row.playerId || row.playerId === NO_PLAYER_SELECTED_VALUE}
                            />
                          </TableCell>
                          <TableCell className="py-1 px-2 text-right">
                             <Input
                              type="text"
                              value={finalResultDisplay}
                              readOnly
                              className="h-8 text-right bg-muted/50 border-none"
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
        <CardFooter className="flex justify-between items-center p-4 border-t">
          <div>
            {!isCreating && event && (
              <DeleteEventButton eventId={event.id} eventName={event.name} />
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href={event ? `/events/${event.id}` : "/events"}>Cancel</Link>
            </Button>
            <Button type="submit">
              {submitButtonText}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

    