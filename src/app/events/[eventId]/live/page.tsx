
import * as React from 'react';
import { getEvents, getPlayers } from "@/lib/data-service";
import type { Event, Player } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import LiveTournamentClient from './LiveTournamentClient'; // Import the new client component

async function getEventDetails(id: string): Promise<{ event?: Event, players: Player[] }> {
    const events = await getEvents();
    const event = events.find(e => e.id === id);
    const players = await getPlayers();
    return { event, players };
}

export default async function LiveTournamentPage({ params }: { params: { eventId: string } }) {
  const { event, players } = await getEventDetails(params.eventId);

  if (!event || event.status !== 'active') {
    return (
      <div className="space-y-6 text-center">
         <Button variant="outline" asChild className="mb-6 mr-auto">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
          </Link>
        </Button>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="font-headline text-destructive">Live Management Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
                This event cannot be managed live. It might not exist or is not currently active.
            </p>
             <Button asChild className="mt-6">
                <Link href="/events">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Events
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pass the server-fetched data to the client component
  return <LiveTournamentClient event={event} players={players} />;
}
