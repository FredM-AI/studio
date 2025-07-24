
'use client';

import * as React from 'react';
import type { Event, Player, BlindLevel, BlindStructureTemplate } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock, Settings, List } from "lucide-react";
import PokerTimerModal from '@/components/PokerTimerModal';
import BlindStructureManager from '@/components/BlindStructureManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import LivePlayerTracking from '@/components/LivePlayerTracking';

interface LiveTournamentClientProps {
    event: Event;
    players: Player[];
    initialBlindStructures: BlindStructureTemplate[];
}

const defaultBlindStructure: BlindLevel[] = [
    { level: 1, smallBlind: 10, bigBlind: 20, duration: 20, isBreak: false },
    { level: 2, smallBlind: 20, bigBlind: 40, duration: 20, isBreak: false },
];

export default function LiveTournamentClient({ event: initialEvent, players, initialBlindStructures }: LiveTournamentClientProps) {
  const [event, setEvent] = React.useState<Event>(initialEvent);
  const [isTimerModalOpen, setIsTimerModalOpen] = React.useState(false);
  const [isStructureManagerOpen, setIsStructureManagerOpen] = React.useState(false);
  const [blindStructures, setBlindStructures] = React.useState<BlindStructureTemplate[]>(initialBlindStructures);

  const [activeStructureId, setActiveStructureId] = React.useState<string>(() => {
    return event.blindStructureId || (initialBlindStructures.length > 0 ? initialBlindStructures[0].id : 'custom');
  });
  
  const [activeStructure, setActiveStructure] = React.useState<BlindLevel[]>(() => {
    if (event.blindStructure && event.blindStructure.length > 0) {
      return event.blindStructure;
    }
    if (activeStructureId) {
        const found = initialBlindStructures.find(bs => bs.id === activeStructureId);
        if (found) return found.levels;
    }
    return defaultBlindStructure;
  });

  const handleApplyStructure = (newLevels: BlindLevel[], newStructureId: string) => {
      setActiveStructure(newLevels);
      setActiveStructureId(newStructureId);
      console.log(`Applied new structure "${newStructureId}" to live event state.`);
  };

  const handleSelectStructure = (structureId: string) => {
    const selected = blindStructures.find(s => s.id === structureId);
    if(selected) {
        setActiveStructureId(selected.id);
        setActiveStructure(selected.levels);
    }
  }


  return (
    <div className="container mx-auto p-4 space-y-8">
        {isTimerModalOpen && (
            <PokerTimerModal 
                event={event} 
                blindStructures={blindStructures} 
                onClose={() => setIsTimerModalOpen(false)} 
                activeStructure={activeStructure} 
                setActiveStructure={(newStructure) => {
                    setActiveStructure(newStructure);
                    setActiveStructureId('custom');
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
                                        {!blindStructures.some(bs => bs.id === activeStructureId) && activeStructureId === 'custom' && (
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
                        <LivePlayerTracking event={event} allPlayers={players} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Live Prize Pool</CardTitle>
                        <CardDescription>Real-time calculation of prizes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center py-12">Live prize pool and payout distribution will be here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
