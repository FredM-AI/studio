
'use client';

import * as React from 'react';
import type { Event, Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, UserPlus, Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface LivePlayerTrackingProps {
    event: Event;
    allPlayers: Player[];
    // onUpdate: (updatedEvent: Event) => void; // We will add this later for persistence
}

interface ParticipantState {
    id: string;
    name: string;
    isGuest: boolean;
    rebuys: number;
}

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

export default function LivePlayerTracking({ event, allPlayers }: LivePlayerTrackingProps) {
    const [participants, setParticipants] = React.useState<ParticipantState[]>([]);
    const [availablePlayers, setAvailablePlayers] = React.useState<Player[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    React.useEffect(() => {
        const participantIds = new Set(event.participants);
        
        const initialParticipants = event.participants.map(playerId => {
            const player = allPlayers.find(p => p.id === playerId);
            const result = event.results.find(r => r.playerId === playerId);
            return {
                id: playerId,
                name: getPlayerDisplayName(player),
                isGuest: player?.isGuest || false,
                rebuys: result?.rebuys || 0,
            };
        }).sort((a,b) => a.name.localeCompare(b.name));

        const initialAvailablePlayers = allPlayers
            .filter(p => !participantIds.has(p.id))
            .sort(sortPlayersWithGuestsLast);

        setParticipants(initialParticipants);
        setAvailablePlayers(initialAvailablePlayers);
    }, [event, allPlayers]);
    
    const filteredAvailablePlayers = availablePlayers.filter(player =>
        getPlayerDisplayName(player).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRebuyChange = (playerId: string, delta: number) => {
        setParticipants(prevParticipants => 
            prevParticipants.map(p => 
                p.id === playerId ? { ...p, rebuys: Math.max(0, p.rebuys + delta) } : p
            )
        );
        // onUpdate will be called here in the future
    };
    
    const addParticipant = (player: Player) => {
        setParticipants(prev => [...prev, {
            id: player.id,
            name: getPlayerDisplayName(player),
            isGuest: player.isGuest || false,
            rebuys: 0,
        }].sort((a,b) => a.name.localeCompare(b.name)));
        
        setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
        // onUpdate will be called here in the future
    };

    const removeParticipant = (participantId: string) => {
        const playerToRemove = allPlayers.find(p => p.id === participantId);
        if (playerToRemove) {
            setAvailablePlayers(prev => [...prev, playerToRemove].sort(sortPlayersWithGuestsLast));
        }
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        // onUpdate will be called here in the future
    };


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
                                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => addParticipant(p)}>
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
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRebuyChange(p.id, -1)}>
                                                    <MinusCircle className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold text-lg w-8 text-center">{p.rebuys}</span>
                                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleRebuyChange(p.id, 1)}>
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeParticipant(p.id)}>
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

