
import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEvents, getSeasons, getPlayers } from "@/lib/data-service"; 
import type { Event, Player, Season } from "@/lib/definitions"; 
import { PlusCircle, CalendarDays, Users, FolderOpen, Trophy, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { cookies } from 'next/headers';
import EventTableRowClient from './EventTableRowClient';

const AUTH_COOKIE_NAME = 'app_session_active';

const EventTable = ({ events, isAuthenticated, allPlayers }: { events: Event[], isAuthenticated: boolean, allPlayers: Player[] }) => {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No events in this category.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-2 px-3">Name</TableHead>
          <TableHead className="py-2 px-3">Date</TableHead>
          <TableHead className="py-2 px-3">Buy-in</TableHead>
          <TableHead className="py-2 px-3">Participants</TableHead>
          <TableHead className="py-2 px-3">Winner</TableHead>
          <TableHead className="py-2 px-3">Status</TableHead>
          <TableHead className="text-right py-2 px-3">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <EventTableRowClient key={event.id} event={event} isAuthenticated={isAuthenticated} allPlayers={allPlayers} />
        ))}
      </TableBody>
    </Table>
  );
};

export default async function EventsPage() {
    const cookieStore = cookies();
    const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';

    const allEvents = (await getEvents()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allSeasons = (await getSeasons()).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const allPlayers = await getPlayers();
    
    const eventsBySeasonMap: Map<string, Event[]> = new Map();
    const unassignedEvents: Event[] = [];

    allEvents.forEach(event => {
        if (event.seasonId) {
        if (!eventsBySeasonMap.has(event.seasonId)) {
            eventsBySeasonMap.set(event.seasonId, []);
        }
        eventsBySeasonMap.get(event.seasonId)!.push(event);
        } else {
        unassignedEvents.push(event);
        }
    });

    let initialIndex = 0;
    if(allSeasons.length > 0) {
        const activeSeasonIndex = allSeasons.findIndex(s => s.isActive);
        if(activeSeasonIndex !== -1) {
            initialIndex = activeSeasonIndex;
        } else {
            const completedSeasons = allSeasons.filter(s => s.endDate && isPast(parseISO(s.endDate)));
            if(completedSeasons.length > 0) {
                const lastCompleted = completedSeasons[completedSeasons.length - 1];
                initialIndex = allSeasons.findIndex(s => s.id === lastCompleted.id);
            }
        }
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Events</h1>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/events/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Event
            </Link>
          </Button>
        )}
      </div>

      {allEvents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <CalendarDays className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-xl">No events scheduled yet.</p>
            <p className="mt-2">
              {isAuthenticated ? "Create your first event to get started." : "Check back later for scheduled events."}
            </p>
            {isAuthenticated && (
             <Button asChild className="mt-6">
              <Link href="/events/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Event
              </Link>
            </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Carousel
            opts={{
              align: "start",
              loop: false,
              startIndex: initialIndex,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {allSeasons.map(season => {
                const seasonEvents = eventsBySeasonMap.get(season.id) || [];
                return (
                  <CarouselItem key={season.id} className="pl-4">
                    <Card className="border-none rounded-none shadow-none">
                       <CardHeader className="w-full text-left p-4">
                         <CardTitle className="font-headline text-xl flex items-center">
                           <Users className="mr-3 h-5 w-5 text-primary"/>
                           SEASON: {season.name}
                           {season.isActive && <Badge className="ml-3 bg-green-500 text-white">Active</Badge>}
                         </CardTitle>
                         <CardDescription>
                           {format(parseISO(season.startDate), 'MM/dd/yyyy')} - {season.endDate ? format(parseISO(season.endDate), 'MM/dd/yyyy') : 'Ongoing'}
                         </CardDescription>
                       </CardHeader>
                       <CardContent className="pt-0">
                         {seasonEvents.length > 0 ? (
                           <EventTable events={seasonEvents} isAuthenticated={isAuthenticated} allPlayers={allPlayers} />
                         ) : (
                           <p className="text-muted-foreground text-sm py-4 text-center">No events scheduled for this season yet.</p>
                         )}
                       </CardContent>
                     </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
             <CarouselPrevious className="ml-[-10px] sm:ml-[-50px]" />
             <CarouselNext className="mr-[-10px] sm:mr-[-50px]" />
          </Carousel>

          {unassignedEvents.length > 0 && (
            <div className="pt-8">
              <Accordion type="single" collapsible className="w-full border rounded-lg overflow-hidden">
                <AccordionItem value="unassigned-events">
                  <Card className="border-none rounded-none shadow-none">
                    <AccordionTrigger className="p-0 hover:no-underline">
                      <CardHeader className="w-full text-left p-4">
                        <CardTitle className="font-headline text-xl flex items-center">
                            <FolderOpen className="mr-3 h-5 w-5 text-primary"/>
                            Other Events
                        </CardTitle>
                        <CardDescription>Events not currently assigned to a specific season.</CardDescription>
                      </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <CardContent className="pt-0">
                        <EventTable events={unassignedEvents} isAuthenticated={isAuthenticated} allPlayers={allPlayers}/>
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </>
      )}
    </div>
  );
}
