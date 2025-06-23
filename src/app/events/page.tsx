
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEvents, getSeasons, getPlayers } from "@/lib/data-service"; 
import type { Event, Player, Season } from "@/lib/definitions"; 
import { PlusCircle, CalendarDays, Users, DollarSign, Edit, Eye, BarChart3, FolderOpen, Trophy } from "lucide-react";
import Link from "next/link";
import { cookies } from 'next/headers';
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const AUTH_COOKIE_NAME = 'app_session_active';

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

const EventTableRow = ({ event, isAuthenticated, allPlayers }: { event: Event, isAuthenticated: boolean, allPlayers: Player[] }) => {
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
      <TableCell className="font-medium">{event.name}</TableCell>
      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
      <TableCell>€{event.buyIn}</TableCell>
      <TableCell>{event.participants.length}</TableCell>
      <TableCell>
        {winnerName !== "N/A" ? (
          <span className="flex items-center">
            <Trophy className="h-4 w-4 mr-1.5 text-yellow-500" />
            {winnerName}
          </span>
        ) : (
          <span className="text-muted-foreground">{winnerName}</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant={
            event.status === 'completed' ? 'default' :
            event.status === 'active' ? 'secondary' :
            event.status === 'cancelled' ? 'destructive' :
            'outline'
          }
          className={
            event.status === 'active' ? 'bg-green-500 text-white' : 
            event.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
            event.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100' :
            event.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
            ''
          }
        >
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </Badge>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="outline" size="icon" asChild title="View Event">
          <Link href={`/events/${event.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        {isAuthenticated && (
          <Button variant="outline" size="icon" asChild title="Edit Event">
            <Link href={`/events/${event.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

const EventTable = ({ events, isAuthenticated, allPlayers }: { events: Event[], isAuthenticated: boolean, allPlayers: Player[] }) => {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No events in this category.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Buy-in</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead>Winner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <EventTableRow key={event.id} event={event} isAuthenticated={isAuthenticated} allPlayers={allPlayers} />
        ))}
      </TableBody>
    </Table>
  );
};

export default async function EventsPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const allEvents: Event[] = (await getEvents()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allSeasons: Season[] = (await getSeasons()).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const allPlayers: Player[] = await getPlayers();

  const eventsBySeason: Map<string, Event[]> = new Map();
  const unassignedEvents: Event[] = [];

  allEvents.forEach(event => {
    if (event.seasonId) {
      if (!eventsBySeason.has(event.seasonId)) {
        eventsBySeason.set(event.seasonId, []);
      }
      eventsBySeason.get(event.seasonId)!.push(event);
    } else {
      unassignedEvents.push(event);
    }
  });

  const activeSeasonIds = allSeasons.filter(season => season.isActive).map(season => season.id);

  return (
    <div className="space-y-8">
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
        <Accordion type="multiple" defaultValue={activeSeasonIds} className="w-full space-y-6">
          {allSeasons.map(season => {
            const seasonEvents = eventsBySeason.get(season.id) || [];
            // if (seasonEvents.length === 0 && !isAuthenticated) return null; // Keep this line if you want to hide empty seasons for guests
            
            return (
              <AccordionItem value={season.id} key={season.id} className="border rounded-lg overflow-hidden">
                <Card className="border-none rounded-none shadow-none">
                  <AccordionTrigger className="p-0 hover:no-underline">
                    <CardHeader className="w-full text-left">
                      <CardTitle className="font-headline text-2xl flex items-center">
                        <BarChart3 className="mr-3 h-6 w-6 text-primary"/>
                        Season: {season.name}
                        {season.isActive && <Badge className="ml-3 bg-green-500 text-white">Active</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing'}
                      </CardDescription>
                    </CardHeader>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="pt-0">
                      {seasonEvents.length > 0 ? (
                        <EventTable events={seasonEvents} isAuthenticated={isAuthenticated} allPlayers={allPlayers} />
                      ) : (
                        <p className="text-muted-foreground text-sm py-4 text-center">No events scheduled for this season yet.</p>
                      )}
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}

          {unassignedEvents.length > 0 && (
            <AccordionItem value="unassigned-events" className="border rounded-lg overflow-hidden">
              <Card className="border-none rounded-none shadow-none">
                <AccordionTrigger className="p-0 hover:no-underline">
                  <CardHeader className="w-full text-left">
                    <CardTitle className="font-headline text-2xl flex items-center">
                        <FolderOpen className="mr-3 h-6 w-6 text-primary"/>
                        Other Events
                    </CardTitle>
                    <CardDescription>Events not currently assigned to a specific season.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="pt-0">
                    <EventTable events={unassignedEvents} isAuthenticated={isAuthenticated} allPlayers={allPlayers}/>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  );
}

