
'use client';

import * as React from 'react';
import { Crown } from 'lucide-react';
import { ParticipantState } from './LivePlayerTracking';

interface LivePrizePoolProps {
    totalPrizePool: number;
    payoutStructure: { position: number, prize: number }[];
    participants: ParticipantState[];
}

export default function LivePrizePool({ totalPrizePool, payoutStructure, participants }: LivePrizePoolProps) {
    const [hydrated, setHydrated] = React.useState(false);

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
            <div className="timer-stats-title flex justify-between items-baseline">
                <h4>Prize Pool</h4>
                <span className="font-bold text-lg">€{hydrated ? totalPrizePool.toLocaleString() : '...'}</span>
            </div>
            <div className="space-y-1">
                {payoutStructure.length > 0 ? (
                    payoutStructure.map(({ position, prize }) => {
                        const playerName = findPlacingPlayerName(position);
                        return (
                            <div key={position} className="timer-stats-row text-xs">
                                <span className="font-semibold flex items-center">
                                  {position === 1 && <Crown className="h-4 w-4 mr-1 text-yellow-400" />}
                                  {position} :
                                </span>
                                <span className="text-xs font-medium truncate flex-1 mx-2 text-right">{playerName}</span>
                                <span className="font-bold">€{hydrated ? prize.toLocaleString() : '...'}</span>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-center text-xs opacity-70">Not enough players.</p>
                )}
            </div>
        </div>
    );
}
