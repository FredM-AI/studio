
'use client';

import * as React from 'react';
import type { Event, Player } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import PokerTimerModal from '@/components/PokerTimerModal';

interface LiveTournamentClientProps {
    event: Event;
    players: Player[];
}

export default function LiveTournamentClient({ event, players }: LiveTournamentClientProps) {
  const [isTimerModalOpen, setIsTimerModalOpen] = React.useState(false);

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
