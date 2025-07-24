
'use client';

import * as React from 'react';
import type { Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, UserPlus, Search, UserX, UserCheck, Trash2, Undo } from 'lucide-react';
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

    const lastEliminatedId = React.useMemo(() => {
        if (eliminatedParticipants.length === 0) return null;
        const lastEliminated = eliminatedParticipants.reduce((last, current) => 
            (current.eliminatedPosition || 0) < (last.eliminatedPosition || 0) ? current : last
        );
        return lastEliminated.id;
    }, [eliminatedParticipants]);

    if (allPlayers.length === 0) {
        return <p className="text-muted-foreground text-center py-12">No players found in the system.</p>
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Available Players Column */}
            <div className="lg:col-span-2 space-y-3">
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
                <ScrollArea className="h-[400px] border rounded-md">
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
            
            {/* Active & Eliminated Players Column */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Players */}
                <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2"><UserCheck className="h-5 w-5 text-green-500" />Active Players ({activeParticipants.length})</h4>
                    <ScrollArea className="h-[452px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="w-[120px] text-center">Rebuys</TableHead>
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
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onRebuyChange(p.id, -1)}>
                                                    <MinusCircle className="h-3 w-3" />
                                                </Button>
                                                <span className="font-bold text-md w-6 text-center">{p.rebuys}</span>
                                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => onRebuyChange(p.id, 1)}>
                                                    <PlusCircle className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                             <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => onEliminatePlayer(p.id)} title="Eliminate Player">
                                                <UserX className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemoveParticipant(p.id)} title="Remove from Event">
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {activeParticipants.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No active players.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
                {/* Ranking */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-medium flex items-center gap-2">Ranking ({eliminatedParticipants.length})</h4>
                    </div>
                     <ScrollArea className="h-[452px] border rounded-md">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Pos.</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="w-[50px] text-right"> </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {eliminatedParticipants.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-bold">{p.eliminatedPosition}</TableCell>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell className="text-right">
                                            {p.id === lastEliminatedId && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUndoLastElimination} title="Undo Elimination">
                                                    <Undo className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {eliminatedParticipants.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No players eliminated yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     </ScrollArea>
                </div>
            </div>
        </div>
    );
}
