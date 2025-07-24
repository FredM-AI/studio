
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
        
        // Simple payout structure logic (can be customized)
        const structure = [];
        if (numParticipants >= 1 && calculatedPrizePool > 0) {
            if (numParticipants >= 4 && calculatedPrizePool >= (buyIn || 0) * 4) { // Payout for 4th if at least 4 players and enough pool
                const remainingPool = calculatedPrizePool - (buyIn || 0);
                structure.push({ position: 1, prize: Math.round(remainingPool * 0.5) });
                structure.push({ position: 2, prize: Math.round(remainingPool * 0.3) });
                structure.push({ position: 3, prize: Math.round(remainingPool * 0.2) });
                structure.push({ position: 4, prize: (buyIn || 0) });
            } else if (numParticipants === 3) {
                 structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.6) });
                 structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.4) });
            } else if (numParticipants >= 2) {
                 structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.65) });
                 structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.35) });
            } else { // 1 player
                structure.push({ position: 1, prize: calculatedPrizePool });
            }
        }
        
        // Fallback for simple 3-way split
        if (structure.length === 0 && numParticipants >= 3) {
            structure.push({ position: 1, prize: Math.round(calculatedPrizePool * 0.5) });
            structure.push({ position: 2, prize: Math.round(calculatedPrizePool * 0.3) });
            structure.push({ position: 3, prize: Math.round(calculatedPrizePool * 0.2) });
        }


        return { totalPrizePool: calculatedPrizePool, payoutStructure: structure };
    }, [participants, buyIn, rebuyPrice]);

    return (
        <div className="space-y-4">
            <div className="text-center bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Total Prize Pool</p>
                <p className="text-4xl font-bold font-headline text-primary">
                    €{totalPrizePool.toLocaleString()}
                </p>
            </div>
            <div>
                <h4 className="font-medium text-center mb-2">Estimated Payouts</h4>
                 {payoutStructure.length > 0 ? (
                    <ul className="space-y-2">
                        {payoutStructure.map(({ position, prize }) => (
                            <li key={position} className="flex justify-between items-center text-lg bg-card p-3 rounded-md shadow-sm">
                                <span className="font-semibold text-muted-foreground">{position}.</span>
                                <span className="font-bold">€{prize.toLocaleString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">
                        Not enough participants to determine payout structure.
                    </p>
                )}
            </div>
        </div>
    );
}

