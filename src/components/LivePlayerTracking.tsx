
'use client';

import * as React from 'react';
import type { Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, UserPlus, Search, Skull, RotateCcw } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export interface ParticipantState {
    id: string;
    name: string;
    isGuest: boolean;
    rebuys: number;
    eliminatedPosition: number | null;
}

interface LivePlayerTrackingProps {
    allPlayers: Player[];
    participants: ParticipantState[];
    availablePlayers: Player[];
    onAddParticipant: (player: Player) => void;
    onRemoveParticipant: (playerId: string) => void;
    onRebuyChange: (playerId: string, delta: number) => void;
    onEliminatePlayer: (playerId: string) => void;
    onUndoLastElimination: () => void;
}

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') return player.nickname;
  if (player.firstName) return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  if (player.lastName) return player.lastName;
  return "Unnamed";
};

export default function LivePlayerTracking({ 
    allPlayers,
    participants, 
    availablePlayers,
    onAddParticipant,
    onRemoveParticipant,
    onRebuyChange,
    onEliminatePlayer,
    onUndoLastElimination,
}: LivePlayerTrackingProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const filteredAvailablePlayers = availablePlayers.filter(player =>
        getPlayerDisplayName(player).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const activeParticipants = participants.filter(p => p.eliminatedPosition === null);
    const eliminatedParticipants = participants
      .filter(p => p.eliminatedPosition !== null)
      .sort((a, b) => (b.eliminatedPosition || 0) - (a.eliminatedPosition || 0));


    if (allPlayers.length === 0) {
        return <p className="text-muted-foreground text-center py-12">No players found in the system.</p>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN - AVAILABLE PLAYERS & RANKING */}
            <div className="space-y-4">
                {/* AVAILABLE PLAYERS */}
                <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary"/>Available Players ({filteredAvailablePlayers.length})</h4>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <ScrollArea className="h-[200px] border rounded-md">
                        <Table>
                            <TableBody>
                                {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            {getPlayerDisplayName(p)}
                                            {p.isGuest && <Badge variant="secondary" className="ml-2 text-xs">Guest</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => onAddParticipant(p)}>
                                                <PlusCircle className="h-4 w-4 text-green-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                            No players available or matching search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                 {/* ELIMINATED PLAYERS (RANKING) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium">Ranking ({eliminatedParticipants.length})</h4>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onUndoLastElimination}
                            disabled={eliminatedParticipants.length === 0}
                        >
                            <RotateCcw className="mr-2 h-3 w-3" /> Undo Last
                        </Button>
                    </div>
                    <ScrollArea className="h-[250px] border rounded-md">
                        {eliminatedParticipants.length > 0 ? (
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted z-10">
                                    <TableRow>
                                        <TableHead className="w-[60px]">Pos</TableHead>
                                        <TableHead>Player</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eliminatedParticipants.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-medium text-center">{p.eliminatedPosition}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                                <p>No players eliminated yet.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>


            {/* RIGHT COLUMN - ACTIVE PARTICIPANTS */}
            <div className="space-y-3">
                 <h4 className="font-medium">Active Players ({activeParticipants.length})</h4>
                <ScrollArea className="h-[510px] border rounded-md">
                    {activeParticipants.length > 0 ? (
                        <Table>
                             <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="w-[150px] text-center">Rebuys</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeParticipants.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">
                                            {p.name}
                                            {p.isGuest && <Badge variant="secondary" className="ml-2 text-xs">Guest</Badge>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onRebuyChange(p.id, -1)}>
                                                    <MinusCircle className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold text-lg w-8 text-center">{p.rebuys}</span>
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onRebuyChange(p.id, 1)}>
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                         <TableCell className="text-right space-x-1">
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onEliminatePlayer(p.id)} title="Eliminate Player">
                                                <Skull className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveParticipant(p.id)} title="Remove from event">
                                                <MinusCircle className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4">
                            <p>No active players in this event.</p>
                         </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
