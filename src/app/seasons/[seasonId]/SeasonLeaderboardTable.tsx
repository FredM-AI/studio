'use client';

import type { LeaderboardEntry } from '@/lib/stats-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Crown, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldX, BarChart2 } from 'lucide-react';

interface SeasonLeaderboardTableProps {
  leaderboardData: LeaderboardEntry[];
}

export default function SeasonLeaderboardTable({ leaderboardData }: SeasonLeaderboardTableProps) {
  if (!leaderboardData || leaderboardData.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No leaderboard data available for this season yet.</p>;
  }

  return (
    <div className="rounded-md border"> {/* Removed overflow-x-auto as Table component now handles it */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center px-2 py-3">Rank</TableHead>
            <TableHead className="min-w-[150px] px-4 py-3">Player</TableHead> {/* Added min-w for Player column */}
            <TableHead className="w-[100px] text-center px-2 py-3">Events</TableHead>
            <TableHead className="w-[80px] text-center px-2 py-3">Wins</TableHead>
            <TableHead className="w-[120px] text-center px-2 py-3">Final Tables</TableHead>
            <TableHead className="min-w-[150px] w-[150px] text-right px-4 py-3">Total Net ($)</TableHead> {/* Ensured Total Net also has min-width */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.map((entry, index) => (
            <TableRow key={entry.playerId} className={index < 3 ? 'bg-card hover:bg-muted/80' : 'hover:bg-muted/50'}>
              <TableCell className="text-center font-medium px-2 py-2.5">
                {index === 0 && <Crown className="inline-block h-5 w-5 text-yellow-400 mr-1" />}
                {index === 1 && <ShieldCheck className="inline-block h-5 w-5 text-gray-400 mr-1" />}
                {index === 2 && <BarChart2 className="inline-block h-5 w-5 text-orange-400 mr-1" />}
                {index > 2 && entry.totalFinalResult <=0 && <ShieldX className="inline-block h-5 w-5 text-destructive mr-1 opacity-50"/>}
                {index + 1}
              </TableCell>
              <TableCell className="px-4 py-2.5">
                <Link href={`/players/${entry.playerId}`} className="hover:underline font-medium text-primary hover:text-primary/80">
                  {entry.playerName}
                </Link>
              </TableCell>
              <TableCell className="text-center px-2 py-2.5">{entry.eventsPlayed}</TableCell>
              <TableCell className="text-center px-2 py-2.5">{entry.wins}</TableCell>
              <TableCell className="text-center px-2 py-2.5">{entry.finalTables}</TableCell>
              <TableCell className={`text-right font-semibold px-4 py-2.5 ${entry.totalFinalResult > 0 ? 'text-green-600 dark:text-green-500' : entry.totalFinalResult < 0 ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'}`}>
                {entry.totalFinalResult > 0 && <TrendingUp className="inline-block h-4 w-4 mr-1"/>}
                {entry.totalFinalResult < 0 && <TrendingDown className="inline-block h-4 w-4 mr-1"/>}
                {entry.totalFinalResult === 0 && <Minus className="inline-block h-4 w-4 mr-1"/>}
                {entry.totalFinalResult.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
