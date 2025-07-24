
'use client';

import * as React from 'react';
import { getEvents, getPlayers } from "@/lib/data-service";
import type { Event, Player } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, PlayCircle, Clock } from "lucide-react";
import PokerTimerModal from '@/components/PokerTimerModal';

async function getEventDetails(id: string): Promise<{ event?: Event, players: Player[] }> {
  // This function would ideally fetch data, but we'll use mock data for now
  // on the client-side, or it should be moved to a server component parent.
  return { event: undefined, players: [] };
}


export default function LiveTournamentPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = React.useState<Event | undefined>(undefined);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isTimerModalOpen, setIsTimerModalOpen] = React.useState(false);

  React.useEffect(() => {
    // Since we cannot use async functions for data fetching directly in a 'use client' component's
    // main body for the initial render, we fetch data inside useEffect.
    const fetchEventData = async () => {
        try {
            const eventData = (await getEvents()).find(e => e.id === params.eventId);
            if (eventData && eventData.status === 'active') {
                setEvent(eventData);
                const allPlayers = await getPlayers();
                setPlayers(allPlayers);
            } else {
                setEvent(undefined);
            }
        } catch (error) {
            console.error("Failed to fetch event data:", error);
            setEvent(undefined);
        } finally {
            setLoading(false);
        }
    };
    fetchEventData();
  }, [params.eventId]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <p>Loading event data...</p>
        </div>
    );
  }

  if (!event) {
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

  return (
    <div className="container mx-auto p-4 space-y-8">
        {isTimerModalOpen && <PokerTimerModal event={event} onClose={() => setIsTimerModalOpen(false)} />}
        <div className="flex justify-between items-center">
            <div>
                <Button variant="outline" asChild>
                    <Link href={`/events/${event.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
                    </Link>
                </Button>
                <h1 className="font-headline text-4xl font-bold mt-2">{event.name} - Live</h1>
                <p className="text-muted-foreground">Managing the tournament in real-time.</p>
            </div>
             <Button onClick={() => setIsTimerModalOpen(true)} size="lg">
                <Clock className="mr-2 h-5 w-5" /> Open Poker Timer
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Timer and Blinds */}
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Blind Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center py-12">Blind structure display will be here.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Players and Payouts */}
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Player Tracking</CardTitle>
                        <CardDescription>Manage buy-ins, rebuys, and add-ons.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-muted-foreground text-center py-12">Player payment tracking table will be here.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Live Prize Pool</CardTitle>
                        <CardDescription>Real-time calculation of prizes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center py-12">Live prize pool and payout distribution will be here.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
