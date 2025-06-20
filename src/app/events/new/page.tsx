
import EventForm from '@/app/events/EventForm';
import { createEvent } from '@/app/events/actions';
import { getPlayers, getSeasons } from '@/lib/data-service'; // Added getSeasons
import type { Player, Season } from '@/lib/definitions'; // Added Season
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewEventPage() {
  const allPlayers: Player[] = await getPlayers();
  const allSeasons: Season[] = await getSeasons(); // Fetch all seasons

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Link>
      </Button>
      <EventForm
        allPlayers={allPlayers}
        allSeasons={allSeasons} // Pass seasons to the form
        action={createEvent}
        formTitle="Create New Event"
        formDescription="Fill in the details to schedule a new poker event."
        submitButtonText="Create Event"
      />
    </div>
  );
}
