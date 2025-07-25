
import EventForm from '@/app/events/EventForm';
import { createEvent } from '@/app/events/actions';
import { getPlayers, getSeasons, getBlindStructures } from '@/lib/data-service'; 
import type { Player, Season, BlindStructureTemplate } from '@/lib/definitions'; 
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface NewEventPageProps {
  searchParams?: {
    seasonId?: string;
  };
}

export default async function NewEventPage({ searchParams }: NewEventPageProps) {
  const allPlayers: Player[] = (await getPlayers()).filter(p => p.isActive);
  const allSeasons: Season[] = await getSeasons(); 
  const blindStructures: BlindStructureTemplate[] = await getBlindStructures();
  const defaultSeasonId = searchParams?.seasonId;

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/events">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
        </Link>
      </Button>
      <EventForm
        allPlayers={allPlayers}
        allSeasons={allSeasons}
        blindStructures={blindStructures}
        action={createEvent}
        formTitle="Create New Event"
        formDescription="Fill in the details to schedule a new poker event."
        submitButtonText="Create Event"
        defaultSeasonId={defaultSeasonId}
      />
    </div>
  );
}
