
'use client';

import * as React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import type { Event, Player } from "@/lib/definitions"; 
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Trophy, Eye, Edit } from "lucide-react";

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "N/A";
  if (player.nickname && player.nickname.trim() !== '') {
    return player.nickname;
  }
  if (player.firstName) {
    return `${player.firstName}${player.lastName ? ' ' + player.lastName.charAt(0) + '.' : ''}`;
  }
  if (player.lastName) {
    return player.lastName;
  }
  return "Unnamed";
};

interface EventTableRowClientProps {
    event: Event;
    isAuthenticated: boolean;
    allPlayers: Player[];
}

export default function EventTableRowClient({ event, isAuthenticated, allPlayers }: EventTableRowClientProps) {
  const [displayDate, setDisplayDate] = React.useState('Loading...');

  React.useEffect(() => {
    // Formatting is done on the client to avoid hydration mismatch
    setDisplayDate(format(parseISO(event.date), 'PPP'));
  }, [event.date]);

  let winnerName = "N/A";
  if (event.status === 'completed' && event.results && event.results.length > 0) {
    const winnerResult = event.results.find(r => r.position === 1);
    if (winnerResult) {
      const winnerPlayer = allPlayers.find(p => p.id === winnerResult.playerId);
      winnerName = getPlayerDisplayName(winnerPlayer);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium py-2 px-3">{event.name}</TableCell>
      <TableCell className="py-2 px-3">{displayDate}</TableCell>
      <TableCell className="py-2 px-3">€{event.buyIn}</TableCell>
      <TableCell className="py-2 px-3">{event.participants.length}</TableCell>
      <TableCell className="py-2 px-3">
        {winnerName !== "N/A" ? (
          <span className="flex items-center">
            <Trophy className="h-4 w-4 mr-1.5 text-yellow-500" />
            {winnerName}
          </span>
        ) : (
          <span className="text-muted-foreground">{winnerName}</span>
        )}
      </TableCell>
      <TableCell className="py-2 px-3">
        <Badge
          className={cn(
            'text-xs font-semibold border-transparent',
             event.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/20' : 
             event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/20' :
             event.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/20' :
             event.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/20' :
             'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/20'
          )}
        >
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2 py-2 px-3">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild title="View Event">
          <Link href={`/events/${event.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {isAuthenticated && (
          <Button variant="outline" size="icon" className="h-8 w-8" asChild title="Edit Event">
            <Link href={`/events/${event.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};
