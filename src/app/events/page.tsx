
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getEvents, getSeasons } from "@/lib/data-service"; // Added getSeasons
import type { Event, Season } from "@/lib/definitions"; // Added Season
import { PlusCircle, CalendarDays, Users, DollarSign, Edit, Eye, BarChart3 } from "lucide-react"; // Added BarChart3
import Link from "next/link";
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'app_session_active';

const EventCard = ({ event, isAuthenticated, seasonName }: { event: Event, isAuthenticated: boolean, seasonName?: string }) => (
  <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
    <CardHeader>
      <CardTitle className="font-headline text-xl">{event.name}</CardTitle>
      <CardDescription>{new Date(event.date).toLocaleDateString()}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2 flex-grow">
      <div className="flex items-center text-sm text-muted-foreground">
        <DollarSign className="mr-2 h-4 w-4" />
        Buy-in: ${event.buyIn}
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        Participants: {event.participants.length}
      </div>
      {seasonName && (
        <div className="flex items-center text-sm text-muted-foreground">
          <BarChart3 className="mr-2 h-4 w-4" />
          Season: {seasonName}
        </div>
      )}
       <div className="flex items-center text-sm pt-1">
        <span className={`px-2 py-1 text-xs rounded-full ${
            event.status === 'active' ? 'bg-green-100 text-green-700' :
            event.status === 'completed' ? 'bg-blue-100 text-blue-700' :
            event.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'}`}>
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
      </div>
    </CardContent>
    <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
      <Button variant="outline" size="sm" asChild title="View Event">
        <Link href={`/events/${event.id}`}>
          <Eye className="mr-1 h-4 w-4" /> View
        </Link>
      </Button>
      {isAuthenticated && (
        <Button variant="outline" size="sm" asChild title="Edit Event">
          <Link href={`/events/${event.id}/edit`}>
            <Edit className="mr-1 h-4 w-4" /> Edit
          </Link>
        </Button>
      )}
    </CardFooter>
  </Card>
);


export default async function EventsPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const events: Event[] = (await getEvents()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const seasons: Season[] = await getSeasons();
  const seasonsMap = new Map(seasons.map(s => [s.id, s.name]));


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

      {events.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const seasonName = event.seasonId ? seasonsMap.get(event.seasonId) : undefined;
            return <EventCard key={event.id} event={event} isAuthenticated={isAuthenticated} seasonName={seasonName}/>;
          })}
        </div>
      )}
    </div>
  );
}
