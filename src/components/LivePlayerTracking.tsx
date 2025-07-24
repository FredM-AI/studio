
'use client';

import * as React from 'react';
import type { Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

export interface ParticipantState {
    id: string;
    name: string;
    isGuest: boolean;
    rebuys: number;
}

interface LivePlayerTrackingProps {
    allPlayers: Player[];
    participants: ParticipantState[];
    availablePlayers: Player[];
    onAddParticipant: (player: Player) => void;
    onRemoveParticipant: (playerId: string) => void;
    onRebuyChange: (playerId: string, delta: number) => void;
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
}: LivePlayerTrackingProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const filteredAvailablePlayers = availablePlayers.filter(player =>
        getPlayerDisplayName(player).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (allPlayers.length === 0) {
        return <p className="text-muted-foreground text-center py-12">No players found in the system.</p>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* PARTICIPANTS */}
            <div className="space-y-3">
                 <h4 className="font-medium">Participants ({participants.length})</h4>
                <ScrollArea className="h-[450px] border rounded-md">
                    {participants.length > 0 ? (
                        <Table>
                             <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="w-[150px] text-center">Rebuys</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.map(p => (
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
                                         <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemoveParticipant(p.id)}>
                                                <MinusCircle className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No participants in this event yet.</p>
                         </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
}
