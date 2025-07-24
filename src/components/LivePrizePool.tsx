
'use client';

import * as React from 'react';
import type { ParticipantState } from './LivePlayerTracking';

interface LivePrizePoolProps {
    participants: ParticipantState[];
    buyIn: number;
    rebuyPrice?: number;
}

export default function LivePrizePool({ participants, buyIn, rebuyPrice }: LivePrizePoolProps) {
    const { totalPrizePool, payoutStructure } = React.useMemo(() => {
        const numParticipants = participants.length;
        const totalRebuys = participants.reduce((sum, p) => sum + p.rebuys, 0);

        const calculatedPrizePool = (numParticipants * (buyIn || 0)) + (totalRebuys * (rebuyPrice || 0));
        
        const structure = [];

        if (numParticipants > 0 && calculatedPrizePool > 0) {
            if (numParticipants < 14) {
                // Logic for less than 14 players
                if (numParticipants >= 3) {
                    structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
                    structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
                    structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
                } else if (numParticipants === 2) {
                    // Custom logic for 2 players if needed, e.g., 65/35
                    structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.65) });
                    structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.35) });
                } else { // 1 player
                    structure.push({ position: 1, prize: calculatedPrizePool });
                }
            } else {
                // Logic for 14 or more players
                const fourthPrize = buyIn || 0;
                if (calculatedPrizePool > fourthPrize) {
                    const remainingPool = calculatedPrizePool - fourthPrize;
                    structure.push({ position: 1, prize: Math.round(remainingPool * 0.50) });
                    structure.push({ position: 2, prize: Math.round(remainingPool * 0.30) });
                    structure.push({ position: 3, prize: Math.round(remainingPool * 0.20) });
                    structure.push({ position: 4, prize: fourthPrize });
                } else {
                    // Not enough for 4th place prize, revert to 3-place structure
                    structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.50) });
                    structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.30) });
                    structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.20) });
                }
            }
        }
        
        return { totalPrizePool: calculatedPrizePool, payoutStructure: structure.sort((a,b) => a.position - b.position) };
    }, [participants, buyIn, rebuyPrice]);

    return (
        <div className="space-y-4">
            <div className="text-center bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Prize Pool</p>
                <p className="text-3xl font-bold font-headline text-primary">
                    €{totalPrizePool.toLocaleString()}
                </p>
            </div>
            <div>
                <h4 className="font-medium text-center mb-2">Estimated Payouts</h4>
                 {payoutStructure.length > 0 ? (
                    <ul className="space-y-2">
                        {payoutStructure.map(({ position, prize }) => (
                            <li key={position} className="flex justify-between items-center text-md bg-card p-2 rounded-md shadow-sm">
                                <span className="font-semibold text-muted-foreground">{position}.</span>
                                <span className="font-bold">€{prize.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4 text-sm">
                        Not enough participants to determine payout structure.
                    </p>
                )}
            </div>
        </div>
    );
}
