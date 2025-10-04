
'use client';

import * as React from 'react';
import type { Player } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle, UserPlus, Search, UserX, UserCheck, Trash2, Undo, Star, Gift } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

export interface ParticipantState {
    id: string;
    name: string;
    isGuest: boolean;
    rebuys: number;
    bountiesWon: number; 
    mysteryKoWon: number; 
    eliminatedPosition: number | null;
}

interface LivePlayerTrackingProps {
    participants: ParticipantState[];
    availablePlayers: Player[];
    onAddParticipant: (player: Player) => void;
    onRemoveParticipant: (playerId: string) => void;
    onRebuyChange: (playerId: string, delta: number) => void;
    onBountyChange: (playerId: string, value: number) => void; 
    onMysteryKoChange: (playerId: string, value: number) => void; 
    onEliminatePlayer: (playerId: string) => void;
    onUndoLastElimination: () => void;
    isModalLayout?: boolean;
    eventBountyValue?: number;
    eventMysteryKoValue?: number;
}

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
  if (player.nickname && player.nickname.trim() !== '') return player.nickname;
  if (player.firstName) return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  if (player.lastName) return player.lastName;
  return "Unnamed";
};

export default function LivePlayerTracking({ 
    participants, 
    availablePlayers,
    onAddParticipant,
    onRemoveParticipant,
    onRebuyChange,
    onBountyChange,
    onMysteryKoChange,
    onEliminatePlayer,
    onUndoLastElimination,
    isModalLayout = false,
    eventBountyValue = 0,
    eventMysteryKoValue = 0,
}: LivePlayerTrackingProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    
    const filteredAvailablePlayers = availablePlayers.filter(player =>
        getPlayerDisplayName(player).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeParticipants = participants.filter(p => p.eliminatedPosition === null);
    const eliminatedParticipants = participants
        .filter(p => p.eliminatedPosition !== null)
        .sort((a, b) => (a.eliminatedPosition || 0) - (b.eliminatedPosition || 0));

    const lastEliminatedId = React.useMemo(() => {
        if (eliminatedParticipants.length === 0) return null;
        const lastEliminated = eliminatedParticipants.reduce((last, current) => 
            (current.eliminatedPosition || 0) < (last.eliminatedPosition || 0) ? current : last
        );
        return lastEliminated.id;
    }, [eliminatedParticipants]);


    const showBounties = eventBountyValue > 0;
    const showMysteryKo = eventMysteryKoValue > 0;
    const showExtras = showBounties || showMysteryKo;


    return (
        <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-4"
        )}>
            {/* Column 1: Available Players */}
            <div className="space-y-2 flex flex-col">
                <h4 className="font-medium flex items-center gap-2 text-sm"><UserPlus className="h-4 w-4 text-primary"/>Available Players ({filteredAvailablePlayers.length})</h4>
                 <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9"
                    />
                </div>
                <ScrollArea className={cn(isModalLayout ? "h-[26rem]" : "h-[30rem]", "border rounded-md flex-grow")}>
                    <Table>
                        <TableBody>
                            {filteredAvailablePlayers.length > 0 ? filteredAvailablePlayers.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="p-2">
                                        <span className="text-sm">{getPlayerDisplayName(p)}</span>
                                        {p.isGuest && <Badge variant="secondary" className="ml-2 text-xs">Guest</Badge>}
                                    </TableCell>
                                    <TableCell className="p-2 text-right">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onAddParticipant(p)}>
                                            <PlusCircle className="h-4 w-4 text-green-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground text-sm p-2">
                                        No players available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            
            {/* Column 2: Active Players */}
            <div className="space-y-2 flex flex-col">
                 <h4 className="font-medium flex items-center gap-2 text-sm"><UserCheck className="h-4 w-4 text-green-500" />Active Players ({activeParticipants.length})</h4>
                <ScrollArea className={cn(isModalLayout ? "h-[28.5rem]" : "h-[32.5rem]", "border rounded-md flex-grow")}>
                    <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead className="p-2">Player</TableHead>
                                <TableHead className={cn("text-center p-2", showExtras ? "w-[180px]" : "w-[90px]")}>Rebuys {showExtras && '& Extras'}</TableHead>
                                <TableHead className="w-[80px] text-right p-2">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activeParticipants.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium p-2 text-sm">
                                        {p.name}
                                        {p.isGuest && <Badge variant="secondary" className="ml-2 text-xs">Guest</Badge>}
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <div className="flex items-center justify-center gap-2">
                                            {showBounties && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Label htmlFor={`bounty-${p.id}`} className="flex items-center text-xs"><Star className="h-3 w-3 mr-1 text-yellow-500"/> B</Label>
                                                    <Input id={`bounty-${p.id}`} type="number" min="0" value={p.bountiesWon} onChange={e => onBountyChange(p.id, parseInt(e.target.value) || 0)} className="h-7 w-14 text-center"/>
                                                </div>
                                            )}
                                            {showMysteryKo && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Label htmlFor={`mko-${p.id}`} className="flex items-center text-xs"><Gift className="h-3 w-3 mr-1 text-purple-500"/> M</Label>
                                                    <Input id={`mko-${p.id}`} type="number" min="0" value={p.mysteryKoWon} onChange={e => onMysteryKoChange(p.id, parseInt(e.target.value) || 0)} className="h-7 w-14 text-center"/>
                                                </div>
                                            )}
                                             <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-0.5">
                                                    <Button size="icon" className="h-6 w-6 timer-rebuy-button" onClick={() => onRebuyChange(p.id, -1)}><MinusCircle className="h-3 w-3" /></Button>
                                                    <span className="font-bold text-sm w-5 text-center">{p.rebuys}</span>
                                                    <Button size="icon" className="h-6 w-6 timer-rebuy-button" onClick={() => onRebuyChange(p.id, 1)}><PlusCircle className="h-3 w-3" /></Button>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1 p-2">
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
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm p-2">
                                        No active players.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
            {/* Column 3: Ranking */}
            <div className="space-y-2 flex flex-col">
                <h4 className="font-medium flex items-center gap-2 text-sm">Ranking ({eliminatedParticipants.length})</h4>
                <ScrollArea className={cn(isModalLayout ? "h-[28.5rem]" : "h-[32.5rem]", "border rounded-md flex-grow")}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] p-2">Pos.</TableHead>
                                <TableHead className="p-2">Player</TableHead>
                                <TableHead className="w-[50px] text-right p-2"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eliminatedParticipants.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-bold p-2 text-sm">{p.eliminatedPosition}</TableCell>
                                    <TableCell className="p-2 text-sm">{p.name}</TableCell>
                                    <TableCell className="text-right p-2">
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
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm p-2">
                                        No players eliminated.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}

    

    