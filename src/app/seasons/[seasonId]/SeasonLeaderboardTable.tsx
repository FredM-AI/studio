
'use client';

import type { LeaderboardEntry } from '@/lib/stats-service';
import type { Event as EventType } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Crown, TrendingUp, TrendingDown, Minus, ShieldCheck, BarChart2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";

interface SeasonLeaderboardTableProps {
  leaderboardData: LeaderboardEntry[];
  seasonEvents: EventType[]; // Événements complétés de la saison, triés par date
}

export default function SeasonLeaderboardTable({ leaderboardData, seasonEvents }: SeasonLeaderboardTableProps) {
  if (!leaderboardData || leaderboardData.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No leaderboard data available for this season yet.</p>;
  }

  if (!seasonEvents || seasonEvents.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No completed events in this season to display results for.</p>;
  }

  let regularPlayerRank = 0;

  return (
    <div className="rounded-md border"> 
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center px-2 py-3 sticky left-0 bg-card z-10">Rank</TableHead>
            <TableHead className="min-w-[150px] px-4 py-3 sticky left-[60px] bg-card z-10">Player</TableHead>
            {seasonEvents.map(event => (
              <TableHead 
                key={event.id} 
                className="min-w-[100px] w-[100px] text-center px-2 py-3"
                title={event.name}
              >
                <div className="flex flex-col items-center">
                  <CalendarDays className="h-4 w-4 mb-0.5 text-muted-foreground/80"/>
                  <span className="text-xs">{format(new Date(event.date), 'dd/MM')}</span>
                </div>
              </TableHead>
            ))}
            <TableHead className="min-w-[150px] w-[150px] text-right px-4 py-3 sticky right-0 bg-card z-10">Total Net (€)</TableHead> 
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboardData.map((entry) => {
            if (!entry.isGuest) {
              regularPlayerRank++;
            }
            const rank = entry.isGuest ? '-' : regularPlayerRank;
            const isTopThree = !entry.isGuest && regularPlayerRank <= 3;

            return (
              <TableRow key={entry.playerId} className={isTopThree ? 'bg-card hover:bg-muted/80' : 'hover:bg-muted/50'}>
                <TableCell className="text-center font-medium px-2 py-2.5 sticky left-0 bg-card z-10">
                  {rank === 1 && <Crown className="inline-block h-5 w-5 text-yellow-400 mr-1" />}
                  {rank === 2 && <ShieldCheck className="inline-block h-5 w-5 text-gray-400 mr-1" />}
                  {rank === 3 && <BarChart2 className="inline-block h-5 w-5 text-orange-400 mr-1" />}
                  {rank}
                </TableCell>
                <TableCell className="px-4 py-2.5 sticky left-[60px] bg-card z-10">
                  <div className="flex items-center gap-2">
                    <Link href={`/players/${entry.playerId}`} className="hover:underline font-medium text-primary hover:text-primary/80">
                      {entry.playerName}
                    </Link>
                    {entry.isGuest && <Badge variant="secondary" className="text-xs font-normal">Guest</Badge>}
                  </div>
                </TableCell>
                {seasonEvents.map(event => {
                  const result = entry.eventResults[event.id];
                  const resultDisplay = result !== undefined ? result.toString() : '-';
                  return (
                    <TableCell 
                      key={`${entry.playerId}-${event.id}`} 
                      className={`text-center px-2 py-2.5 font-medium ${
                        result !== undefined && result > 0 ? 'text-green-600 dark:text-green-500' : 
                        result !== undefined && result < 0 ? 'text-red-600 dark:text-red-500' : 
                        'text-muted-foreground'
                      }`}
                    >
                      {resultDisplay}
                    </TableCell>
                  );
                })}
                <TableCell className={`text-right font-semibold px-4 py-2.5 sticky right-0 bg-card z-10 ${entry.totalFinalResult > 0 ? 'text-green-600 dark:text-green-500' : entry.totalFinalResult < 0 ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'}`}>
                  {entry.totalFinalResult > 0 && <TrendingUp className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult < 0 && <TrendingDown className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult === 0 && <Minus className="inline-block h-4 w-4 mr-1"/>}
                  {entry.totalFinalResult}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
