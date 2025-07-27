
'use client';

import type { LeaderboardEntry } from '@/lib/stats-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SimpleLeaderboardTableProps {
  leaderboardData: LeaderboardEntry[];
}

export default function SimpleLeaderboardTable({ leaderboardData }: SimpleLeaderboardTableProps) {
  if (!leaderboardData || leaderboardData.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No leaderboard data available.</p>;
  }

  let rank = 0;

  return (
    <div className="rounded-md border"> 
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center px-2 py-3">Rank</TableHead>
            <TableHead className="min-w-[150px] px-4 py-3">Player</TableHead>
            <TableHead className="text-right px-4 py-3">Total Net (€)</TableHead> 
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.map((entry) => {
            if (!entry.isGuest) {
              rank++;
            }
            const displayRank = entry.isGuest ? '-' : rank;

            return (
              <TableRow key={entry.playerId} className="hover:bg-muted/50">
                <TableCell className="text-center font-medium px-2 py-2.5">
                  {displayRank === 1 && <Crown className="inline-block h-5 w-5 text-yellow-400 mr-1" />}
                  {displayRank}
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  <Link href={`/players/${entry.playerId}`} className="hover:underline font-medium text-primary hover:text-primary/80">
                    {entry.playerName}
                  </Link>
                </TableCell>
                <TableCell className={`text-right font-semibold px-4 py-2.5 ${entry.totalFinalResult > 0 ? 'text-green-600' : entry.totalFinalResult < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {entry.totalFinalResult > 0 && <TrendingUp className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult < 0 && <TrendingDown className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult === 0 && <Minus className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
