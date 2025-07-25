
'use client';

import * as React from 'react';
import type { Event, Player, BlindLevel, BlindStructureTemplate, EventResult } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Settings, List, Banknote, Cpu, Save, Loader2 } from "lucide-react";
import PokerTimerModal from '@/components/PokerTimerModal';
import BlindStructureManager from '@/components/BlindStructureManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LivePlayerTracking, { type ParticipantState } from '@/components/LivePlayerTracking';
import LivePrizePool from '@/components/LivePrizePool';
import { saveLiveResults } from '@/app/events/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


interface LiveTournamentClientProps {
    event: Event;
    players: Player[];
    initialBlindStructures: BlindStructureTemplate[];
}

const defaultBlindStructure: BlindLevel[] = [
    { level: 1, smallBlind: 10, bigBlind: 20, duration: 20, isBreak: false },
    { level: 2, smallBlind: 20, bigBlind: 40, duration: 20, isBreak: false },
];

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') return player.nickname;
  if (player.firstName) return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  if (player.lastName) return player.lastName;
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

const getInitialParticipants = (initialEvent: Event, allPlayers: Player[]): ParticipantState[] => {
    return initialEvent.participants.map(playerId => {
        const player = allPlayers.find(p => p.id === playerId);
        const result = initialEvent.results.find(r => r.playerId === playerId);
        return {
            id: playerId,
            name: getPlayerDisplayName(player),
            isGuest: player?.isGuest || false,
            rebuys: result?.rebuys || 0,
            eliminatedPosition: null, // Initially not eliminated
        };
    }).sort((a,b) => a.name.localeCompare(b.name));
};


export default function LiveTournamentClient({ event: initialEvent, players: allPlayers, initialBlindStructures }: LiveTournamentClientProps) {
  const [isTimerModalOpen, setIsTimerModalOpen] = React.useState(false);
  const [isStructureManagerOpen, setIsStructureManagerOpen] = React.useState(false);
  const [blindStructures, setBlindStructures] = React.useState<BlindStructureTemplate[]>(initialBlindStructures);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const storageKey = `live-event-state-${initialEvent.id}`;

  const [event, setEvent] = React.useState<Event>(initialEvent);
  const [participants, setParticipants] = React.useState<ParticipantState[]>(() => getInitialParticipants(initialEvent, allPlayers));
  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
  const [activeStructureId, setActiveStructureId] = React.useState<string>(initialEvent.blindStructureId || (initialBlindStructures.length > 0 ? initialBlindStructures[0].id : 'custom'));
  const [activeStructure, setActiveStructure] = React.useState<BlindLevel[]>(() => {
    if (activeStructureId !== 'custom') {
        const found = initialBlindStructures.find(bs => bs.id === activeStructureId);
        if (found) return found.levels;
    }
    return initialEvent.blindStructure || defaultBlindStructure;
  });

  // State to track if hydration is complete
  const [hydrated, setHydrated] = React.useState(false);


  React.useEffect(() => {
    // This effect runs only on the client, after the initial render.
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        const savedState = JSON.parse(item);
        if (savedState.participants) setParticipants(savedState.participants);
        if (savedState.activeStructureId) setActiveStructureId(savedState.activeStructureId);
        if (savedState.activeStructure) setActiveStructure(savedState.activeStructure);
        if (savedState.startingStack) setEvent(prev => ({ ...prev, startingStack: savedState.startingStack }));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${storageKey}”:`, error);
    }
    setHydrated(true); // Mark hydration as complete
  }, [storageKey]);


  React.useEffect(() => {
    // This effect saves to localStorage, but only after hydration is complete.
    if (!hydrated) return; // Don't save on the initial server render
    
    try {
      const stateToSave = {
        participants,
        activeStructureId,
        activeStructure,
        startingStack: event.startingStack,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }, [participants, activeStructureId, activeStructure, event.startingStack, storageKey, hydrated]);


  React.useEffect(() => {
    const participantIds = new Set(participants.map(p => p.id));
    const currentAvailablePlayers = allPlayers
        .filter(p => !participantIds.has(p.id))
        .sort(sortPlayersWithGuestsLast);
    setAvailablePlayers(currentAvailablePlayers);
  }, [participants, allPlayers]);


  const handleApplyStructure = (newLevels: BlindLevel[], newStructureId: string) => {
      setActiveStructure(newLevels);
      setActiveStructureId(newStructureId);
      const selectedStructureTemplate = blindStructures.find(bs => bs.id === newStructureId);
      if (selectedStructureTemplate && selectedStructureTemplate.startingStack) {
        setEvent(prevEvent => ({...prevEvent, startingStack: selectedStructureTemplate.startingStack}));
      }
  };

  const handleSelectStructure = (structureId: string) => {
    if (structureId === 'custom') return;
    const selected = blindStructures.find(s => s.id === structureId);
    if(selected) {
        setActiveStructureId(selected.id);
        setActiveStructure(selected.levels);
        if (selected.startingStack) {
           setEvent(prevEvent => ({...prevEvent, startingStack: selected.startingStack}));
        }
    }
  }

  const handleRebuyChange = (playerId: string, delta: number) => {
      setParticipants(prevParticipants => 
          prevParticipants.map(p => 
              p.id === playerId ? { ...p, rebuys: Math.max(0, p.rebuys + delta) } : p
          )
      );
  };
  
  const addParticipant = (player: Player) => {
      setParticipants(prev => [...prev, {
          id: player.id,
          name: getPlayerDisplayName(player),
          isGuest: player.isGuest || false,
          rebuys: 0,
          eliminatedPosition: null,
      }].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const removeParticipant = (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
  };
  
  const handleEliminatePlayer = (playerId: string) => {
    setParticipants(prev => {
      const activePlayersCount = prev.filter(p => p.eliminatedPosition === null).length;
      const finishingPosition = activePlayersCount;
      return prev.map(p => p.id === playerId ? { ...p, eliminatedPosition: finishingPosition } : p);
    });
  };

  const handleUndoLastElimination = () => {
    setParticipants(prev => {
        const eliminatedPlayers = prev.filter(p => p.eliminatedPosition !== null);
        if (eliminatedPlayers.length === 0) return prev;
        
        const lastEliminated = eliminatedPlayers.reduce((last, current) => 
            (current.eliminatedPosition || 0) < (last.eliminatedPosition || 0) ? current : last
        );

        return prev.map(p => p.id === lastEliminated.id ? { ...p, eliminatedPosition: null } : p);
    });
  };

  const { totalPrizePool, payoutStructure } = React.useMemo(() => {
    const numParticipants = participants.length;
    const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);

    const calculatedPrizePool = (numParticipants * (event.buyIn || 0)) + (totalRebuys * (event.rebuyPrice || 0));
    
    const structure: {position: number, prize: number}[] = [];

    if (numParticipants > 0 && calculatedPrizePool > 0) {
        if (numParticipants < 14) {
            if (numParticipants >= 3) {
                structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
                structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
                structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
            } else if (numParticipants === 2) {
                structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.65) });
                structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.35) });
            } else {
                structure.push({ position: 1, prize: calculatedPrizePool });
            }
        } else {
            const fourthPrize = event.buyIn || 0;
            if (calculatedPrizePool > fourthPrize) {
                const remainingPool = calculatedPrizePool - fourthPrize;
                structure.push({ position: 1, prize: Math.round(remainingPool * 0.50) });
                structure.push({ position: 2, prize: Math.round(remainingPool * 0.30) });
                structure.push({ position: 3, prize: Math.round(remainingPool * 0.20) });
                structure.push({ position: 4, prize: fourthPrize });
            } else {
                structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
                structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
                structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
            }
        }
    }
    
    return { totalPrizePool: calculatedPrizePool, payoutStructure: structure.sort((a,b) => a.position - b.position) };
  }, [participants, event.buyIn, event.rebuyPrice]);


  const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);
  const totalChips = (participants.length + totalRebuys) * (event.startingStack || 0);
  const activeParticipantsCount = participants.filter(p => p.eliminatedPosition === null).length;
  const avgStack = activeParticipantsCount > 0 ? Math.floor(totalChips / activeParticipantsCount) : 0;
  
  const isTournamentFinished = activeParticipantsCount <= 1 && participants.length > 0;

  const handleSaveResults = async () => {
      if (!isTournamentFinished) return;
      setIsSaving(true);
      
      const winner = participants.find(p => p.eliminatedPosition === null);
      
      const finalResults: EventResult[] = participants.map(p => {
          const prizeInfo = payoutStructure.find(ps => ps.position === p.eliminatedPosition);
          return {
              playerId: p.id,
              position: p.id === winner?.id ? 1 : (p.eliminatedPosition as number),
              prize: p.id === winner?.id ? (payoutStructure.find(ps => ps.position === 1)?.prize || 0) : (prizeInfo?.prize || 0),
              rebuys: p.rebuys,
          };
      }).sort((a,b) => a.position - b.position);

      const result = await saveLiveResults(initialEvent.id, finalResults, totalPrizePool);
      
      setIsSaving(false);
      
      if(result.success) {
          toast({ title: 'Success', description: 'Event results have been saved successfully.'});
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(storageKey);
          }
          router.push(`/events/${initialEvent.id}`);
      } else {
          toast({ title: 'Error', description: result.message || 'Failed to save event results.', variant: 'destructive'});
      }
  };


  return (
    <div className="container mx-auto p-4 space-y-6">
        <PokerTimerModal 
            isOpen={isTimerModalOpen}
            onOpenChange={setIsTimerModalOpen}
            event={event} 
            participants={participants}
            totalPrizePool={totalPrizePool}
            payoutStructure={payoutStructure}
            activeStructure={activeStructure} 
            allPlayers={allPlayers}
            availablePlayers={availablePlayers}
            onAddParticipant={addParticipant}
            onRemoveParticipant={removeParticipant}
            onRebuyChange={handleRebuyChange}
            onEliminatePlayer={handleEliminatePlayer}
            onUndoLastElimination={handleUndoLastElimination}
        />
        {isStructureManagerOpen && (
            <BlindStructureManager
                isOpen={isStructureManagerOpen}
                onClose={() => setIsStructureManagerOpen(false)}
                structures={blindStructures}
                activeStructure={activeStructure}
                onApplyStructure={handleApplyStructure}
            />
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-grow">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/events/${event.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold mt-1">{event.name} - Live</h1>
            </div>
             <div className="flex gap-2">
                {isTournamentFinished && (
                    <Button onClick={handleSaveResults} disabled={isSaving} size="lg" className="bg-green-600 hover:bg-green-700">
                        {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        {isSaving ? 'Saving...' : 'Save Results'}
                    </Button>
                )}
                 <Button onClick={() => setIsTimerModalOpen(true)} size="lg">
                    <Clock className="mr-2 h-5 w-5" /> Open Timer
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                    <CardTitle className="flex items-center text-lg"><List className="mr-2"/>Blind Structure</CardTitle>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsStructureManagerOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Manage
                    </Button>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="space-y-3">
                        <div>
                            <Select value={activeStructureId} onValueChange={handleSelectStructure}>
                                <SelectTrigger id="structure-select" className="h-9">
                                    <SelectValue placeholder="Select a structure..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {blindStructures.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                    {activeStructureId === 'custom' && (
                                        <SelectItem value="custom" disabled>Custom</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <ScrollArea className="h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="p-2">Lvl</TableHead>
                                        <TableHead className="p-2">Blinds</TableHead>
                                        <TableHead className="p-2">Ante</TableHead>
                                        <TableHead className="p-2 text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeStructure.map((level, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium p-2">{level.isBreak ? <Badge variant="secondary">Break</Badge> : level.level}</TableCell>
                                            <TableCell className="p-2">{level.isBreak ? '-' : `${level.smallBlind}/${level.bigBlind}`}</TableCell>
                                            <TableCell className="p-2">{level.ante || '-'}</TableCell>
                                            <TableCell className="p-2 text-right">{level.duration} min</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                    <Banknote className="h-5 w-5 text-primary"/>
                    Live Prize Pool
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                    <LivePrizePool 
                        participants={participants}
                        buyIn={event.buyIn || 0}
                        rebuyPrice={event.rebuyPrice}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Cpu className="h-5 w-5 text-primary"/>
                        Live Chip Counts
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                        <div className="space-y-3">
                        <div className="text-center bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Chips in Play</p>
                            <p className="text-2xl font-bold font-headline text-primary">
                                {totalChips.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-center bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Average Stack</p>
                            <p className="text-2xl font-bold font-headline text-primary">
                                {avgStack.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader className="pb-4">
                <CardTitle>Player Tracking</CardTitle>
            </CardHeader>
            <CardContent>
                <LivePlayerTracking 
                    allPlayers={allPlayers}
                    participants={participants}
                    availablePlayers={availablePlayers}
                    onAddParticipant={addParticipant}
                    onRemoveParticipant={removeParticipant}
                    onRebuyChange={handleRebuyChange}
                    onEliminatePlayer={handleEliminatePlayer}
                    onUndoLastElimination={handleUndoLastElimination}
                />
            </CardContent>
        </Card>
    </div>
  );
}

    