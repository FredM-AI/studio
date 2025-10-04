
'use client';

import * as React from 'react';
import type { ParticipantState } from './LivePlayerTracking';
import { Crown } from 'lucide-react';
import { CardTitle } from './ui/card';

interface LivePrizePoolProps {
    participants: ParticipantState[];
    buyIn: number;
    rebuyPrice?: number;
}

export default function LivePrizePool({ participants, buyIn, rebuyPrice }: LivePrizePoolProps) {
    const [hydrated, setHydrated] = React.useState(false);

    const { totalPrizePool, payoutStructure } = React.useMemo(() => {
        const numParticipants = participants.length;
        const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);

        const calculatedPrizePool = (numParticipants * (buyIn || 0)) + (totalRebuys * (rebuyPrice || 0));
        
        const structure: { position: number, prize: number }[] = [];

        if (numParticipants > 0 && calculatedPrizePool > 0) {
            if (numParticipants < 15) { // Changed from 14 to 15
                if (numParticipants >= 3) {
                    structure.push({ position: 1, prize: Math.round((calculatedPrizePool * 0.50)/10) * 10 });
                    structure.push({ position: 2, prize: Math.round((calculatedPrizePool * 0.30)/10) * 10 });
                    structure.push({ position: 3, prize: Math.round((calculatedPrizePool * 0.20)/10) * 10 });
                } else if (numParticipants === 2) {
                    structure.push({ position: 1, prize: Math.round((calculatedPrizePool * 0.65)/10) * 10 });
                    structure.push({ position: 2, prize: Math.round((calculatedPrizePool * 0.35)/10) * 10 });
                } else {
                    structure.push({ position: 1, prize: calculatedPrizePool });
                }
            } else {
                const fourthPrize = Math.round((buyIn || 0) / 10) * 10;
                if (calculatedPrizePool > fourthPrize) {
                    const remainingPool = calculatedPrizePool - fourthPrize;
                    structure.push({ position: 1, prize: Math.round((remainingPool * 0.50)/10) * 10 });
                    structure.push({ position: 2, prize: Math.round((remainingPool * 0.30)/10) * 10 });
                    structure.push({ position: 3, prize: Math.round((remainingPool * 0.20)/10) * 10 });
                    structure.push({ position: 4, prize: fourthPrize });
                } else {
                    structure.push({ position: 1, prize: Math.round((calculatedPrizePool * 0.50)/10) * 10 });
                    structure.push({ position: 2, prize: Math.round((calculatedPrizePool * 0.30)/10) * 10 });
                    structure.push({ position: 3, prize: Math.round((calculatedPrizePool * 0.20)/10) * 10 });
                }
            }
        }
        
        return { totalPrizePool: calculatedPrizePool, payoutStructure: structure.sort((a,b) => a.position - b.position) };
    }, [participants, buyIn, rebuyPrice]);

    React.useEffect(() => {
        setHydrated(true);
    }, []);

    const findPlacingPlayerName = (position: number) => {
        // Find the player who finished at this exact position
        const eliminatedPlayer = participants.find(p => p.eliminatedPosition === position);
        if (eliminatedPlayer) return eliminatedPlayer.name;

        // Special case for winner (has not been eliminated yet)
        if (position === 1) {
             const activePlayers = participants.filter(p => p.eliminatedPosition === null);
             const eliminatedCount = participants.length - activePlayers.length;
             // If there's only one active player left, they are the winner.
             if (activePlayers.length === 1 && eliminatedCount === participants.length - 1) {
                 return activePlayers[0].name;
             }
        }
        
        return '...';
    };


    return (
        <div className="space-y-4">
            <div className="text-center bg-muted/50 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Prize Pool</p>
                <p className="text-2xl font-bold font-headline text-primary">
                    €{hydrated ? totalPrizePool.toLocaleString() : '...'}
                </p>
            </div>
            <div>
                <h4 className="font-medium text-center text-xs mb-1">Estimated Payouts</h4>
                 {payoutStructure.length > 0 ? (
                    <ul className="space-y-1">
                        {payoutStructure.map(({ position, prize }) => {
                            const playerName = findPlacingPlayerName(position);
                            return (
                                <li key={position} className="flex justify-between items-center text-sm p-1 rounded-md">
                                    <span className="font-semibold text-muted-foreground flex items-center">
                                      {position === 1 && <Crown className="h-4 w-4 mr-1 text-yellow-400" />}
                                      {position}.
                                    </span>
                                    <span className="text-xs font-medium truncate text-right flex-1 mx-2">{playerName}</span>
                                    <span className="font-bold text-sm">€{hydrated ? prize.toLocaleString() : '...'}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-2 text-xs">
                        Not enough participants to determine payout structure.
                    </p>
                )}
            </div>
        </div>
    );
}
