
'use client';

import * as React from 'react';
import type { Event, Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

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
    // We can add more fields like addons, paid status etc. later
}

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') return player.nickname;
  if (player.firstName) return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  if (player.lastName) return player.lastName;
  return "Unnamed";
};

export default function LivePlayerTracking({ event, allPlayers }: LivePlayerTrackingProps) {
    const [participants, setParticipants] = React.useState<ParticipantState[]>([]);

    React.useEffect(() => {
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

        setParticipants(initialParticipants);
    }, [event, allPlayers]);

    const handleRebuyChange = (playerId: string, delta: number) => {
        setParticipants(prevParticipants => {
            const newParticipants = prevParticipants.map(p => {
                if (p.id === playerId) {
                    const newRebuys = Math.max(0, p.rebuys + delta);
                    return { ...p, rebuys: newRebuys };
                }
                return p;
            });
            // onUpdate could be called here in the future
            return newParticipants;
        });
    };

    if (participants.length === 0) {
        return <p className="text-muted-foreground text-center py-12">No players have been added to this event.</p>
    }

    return (
        <ScrollArea className="h-[450px]">
            <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead className="w-[150px] text-center">Rebuys</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {participants.map(p => (
                        <TableRow key={p.id}>
                            <TableCell className="font-medium">
                                {p.name}
                                {p.isGuest && <Badge variant="secondary" className="ml-2">Guest</Badge>}
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
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}

