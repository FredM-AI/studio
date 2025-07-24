
'use client';

import * as React from 'react';
import type { Event, Player, BlindLevel, BlindStructureTemplate } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Settings, List, Banknote } from "lucide-react";
import PokerTimerModal from '@/components/PokerTimerModal';
import BlindStructureManager from '@/components/BlindStructureManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LivePlayerTracking, { type ParticipantState } from '@/components/LivePlayerTracking';
import LivePrizePool from '@/components/LivePrizePool';

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


export default function LiveTournamentClient({ event: initialEvent, players: allPlayers, initialBlindStructures }: LiveTournamentClientProps) {
  const [isTimerModalOpen, setIsTimerModalOpen] = React.useState(false);
  const [isStructureManagerOpen, setIsStructureManagerOpen] = React.useState(false);
  const [blindStructures, setBlindStructures] = React.useState<BlindStructureTemplate[]>(initialBlindStructures);
  
  const storageKey = `live-event-state-${initialEvent.id}`;

  const getInitialState = <T,>(key: string, initialValue: T): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(storageKey);
      if (item) {
        const parsedItem = JSON.parse(item);
        return parsedItem[key] !== undefined ? parsedItem[key] : initialValue;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
    }
    return initialValue;
  };
  
  const [event, setEvent] = React.useState<Event>(() => {
    const savedStartingStack = getInitialState('startingStack', initialEvent.startingStack);
    return { ...initialEvent, startingStack: savedStartingStack };
  });

  const [participants, setParticipants] = React.useState<ParticipantState[]>(() => {
    const savedParticipants = getInitialState<ParticipantState[] | null>('participants', null);
    if (savedParticipants) {
        return savedParticipants;
    }
    // If nothing in localStorage, initialize from event data
    return initialEvent.participants.map(playerId => {
        const player = allPlayers.find(p => p.id === playerId);
        const result = initialEvent.results.find(r => r.playerId === playerId);
        return {
            id: playerId,
            name: getPlayerDisplayName(player),
            isGuest: player?.isGuest || false,
            rebuys: result?.rebuys || 0,
        };
    }).sort((a,b) => a.name.localeCompare(b.name));
  });
  
  const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);

  const [activeStructureId, setActiveStructureId] = React.useState<string>(() => {
    const savedId = getInitialState('activeStructureId', null);
    if (savedId) return savedId;
    return event.blindStructureId || (initialBlindStructures.length > 0 ? initialBlindStructures[0].id : 'custom');
  });
  
  const [activeStructure, setActiveStructure] = React.useState<BlindLevel[]>(() => {
    const savedStructure = getInitialState('activeStructure', null);
    if(savedStructure) return savedStructure;
    
    if (event.blindStructure && event.blindStructure.length > 0) {
      return event.blindStructure;
    }
    if (activeStructureId !== 'custom') {
        const found = initialBlindStructures.find(bs => bs.id === activeStructureId);
        if (found) return found.levels;
    }
    return defaultBlindStructure;
  });

  // Save state to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
  }, [participants, activeStructureId, activeStructure, event.startingStack, storageKey]);


  React.useEffect(() => {
    // This effect now simply syncs the available players list based on the current participants.
    // The initialization of participants is handled in the useState initializer.
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
      console.log(`Applied new structure "${newStructureId}" to live event state.`);
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
      }].sort((a,b) => a.name.localeCompare(b.name)));
      
      setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const removeParticipant = (participantId: string) => {
      const playerToRemove = allPlayers.find(p => p.id === participantId);
      if (playerToRemove) {
          setAvailablePlayers(prev => [...prev, playerToRemove].sort(sortPlayersWithGuestsLast));
      }
      setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const { totalPrizePool, payoutStructure } = React.useMemo(() => {
    const numParticipants = participants.length;
    const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);
    const calculatedPrizePool = (numParticipants * (event.buyIn || 0)) + (totalRebuys * (event.rebuyPrice || 0));
    const structure = [];

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

  return (
    <div className="container mx-auto p-4 space-y-8">
        {isTimerModalOpen && (
            <PokerTimerModal 
                event={event} 
                participants={participants}
                totalPrizePool={totalPrizePool}
                payoutStructure={payoutStructure}
                blindStructures={blindStructures} 
                onClose={() => setIsTimerModalOpen(false)} 
                activeStructure={activeStructure} 
                setActiveStructure={(newStructure, newStructureId) => {
                  setActiveStructure(newStructure);
                  setActiveStructureId(newStructureId);
                }}
            />
        )}
        {isStructureManagerOpen && (
            <BlindStructureManager
                isOpen={isStructureManagerOpen}
                onClose={() => setIsStructureManagerOpen(false)}
                structures={blindStructures}
                activeStructure={activeStructure}
                onApplyStructure={handleApplyStructure}
            />
        )}
        <div className="flex justify-between items-center">
            <div>
                <Button variant="outline" asChild>
                    <Link href={`/events/${event.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
                    </Link>
                </Button>
                <h1 className="font-headline text-4xl font-bold mt-2">{event.name} - Live</h1>
                <p className="text-muted-foreground">Managing the tournament in real-time.</p>
            </div>
             <Button onClick={() => setIsTimerModalOpen(true)} size="lg">
                <Clock className="mr-2 h-5 w-5" /> Open Poker Timer
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                      <div>
                        <CardTitle className="flex items-center"><List className="mr-2"/>Blind Structure</CardTitle>
                        <CardDescription>The blinds for the event.</CardDescription>
                      </div>
                       <Button variant="outline" size="sm" onClick={() => setIsStructureManagerOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" /> Manage
                       </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="structure-select">Select Structure</Label>
                                <Select value={activeStructureId} onValueChange={handleSelectStructure}>
                                    <SelectTrigger id="structure-select">
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
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lvl</TableHead>
                                            <TableHead>Blinds</TableHead>
                                            <TableHead>Ante</TableHead>
                                            <TableHead>Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeStructure.map((level, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{level.isBreak ? <Badge variant="secondary">Break</Badge> : level.level}</TableCell>
                                                <TableCell>{level.isBreak ? '-' : `${level.smallBlind}/${level.bigBlind}`}</TableCell>
                                                <TableCell>{level.ante || '-'}</TableCell>
                                                <TableCell>{level.duration} min</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Player Tracking</CardTitle>
                        <CardDescription>Manage buy-ins, rebuys, and add-ons.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LivePlayerTracking 
                          allPlayers={allPlayers}
                          participants={participants}
                          availablePlayers={availablePlayers}
                          onAddParticipant={addParticipant}
                          onRemoveParticipant={removeParticipant}
                          onRebuyChange={handleRebuyChange}
                        />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Banknote className="h-6 w-6 text-primary"/>
                          Live Prize Pool
                        </CardTitle>
                        <CardDescription>Real-time calculation of prizes based on entries and rebuys.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LivePrizePool 
                           participants={participants}
                           buyIn={event.buyIn}
                           rebuyPrice={event.rebuyPrice}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
