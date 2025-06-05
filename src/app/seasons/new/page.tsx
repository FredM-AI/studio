
import SeasonForm from '@/app/seasons/SeasonForm';
import { createSeason } from '@/app/seasons/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getEvents } from '@/lib/data-service';
import type { Event } from '@/lib/definitions';

export default async function NewSeasonPage() {
  const allEvents: Event[] = await getEvents(); // Fetch events, though not used directly for new season UI

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/seasons">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons
        </Link>
      </Button>
      <SeasonForm
        allEvents={allEvents} // Pass allEvents, though event association UI is hidden for new seasons
        action={createSeason}
        formTitle="Create New Season"
        formDescription="Define a new poker season and its parameters."
        submitButtonText="Create Season"
      />
    </div>
  );
}
