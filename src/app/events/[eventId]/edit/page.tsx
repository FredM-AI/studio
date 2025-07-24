
import EventForm from '@/app/events/EventForm';
import { updateEvent } from '@/app/events/actions';
import { getEvents, getPlayers, getSeasons, getBlindStructures } from '@/lib/data-service';
import type { Event, Player, Season, BlindStructureTemplate } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


async function getEvent(id: string): Promise<Event | undefined> {
  const events = await getEvents();
  return events.find(e => e.id === id);
}

export default async function EditEventPage({ params }: { params: { eventId: string } }) {
  const event = await getEvent(params.eventId);
  const allPlayers: Player[] = await getPlayers();
  const allSeasons: Season[] = await getSeasons();
  const blindStructures: BlindStructureTemplate[] = await getBlindStructures();

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
            <CardTitle className="font-headline text-destructive">Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The event you are trying to edit does not exist.</p>
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
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href={`/events/${event.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Details
        </Link>
      </Button>
      <EventForm
        event={event}
        allPlayers={allPlayers}
        allSeasons={allSeasons}
        blindStructures={blindStructures}
        action={updateEvent}
        formTitle={`Edit Event: ${event.name}`}
        formDescription="Modify the details and results for this poker event."
        submitButtonText="Save Changes"
      />
    </div>
  );
}
