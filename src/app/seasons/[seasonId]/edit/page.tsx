
import SeasonForm from '@/app/seasons/SeasonForm';
import { updateSeason } from '@/app/seasons/actions';
import { getSeasons, getEvents } from '@/lib/data-service';
import type { Season, Event as EventType } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit3, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getSeason(id: string): Promise<Season | undefined> {
  const seasons = await getSeasons();
  return seasons.find(s => s.id === id);
}

export default async function EditSeasonPage({ params }: { params: { seasonId: string } }) {
  const season = await getSeason(params.seasonId);
  const allEvents: EventType[] = await getEvents();

  if (!season) {
    return (
      <div className="space-y-6 text-center">
         <Button variant="outline" asChild className="mb-6 mr-auto">
          <Link href="/seasons">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons List
          </Link>
        </Button>
        <Card className="max-w-md mx-auto">
          <CardHeader>
             <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="font-headline text-destructive">Season Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The season you are trying to edit does not exist.</p>
             <Button asChild className="mt-6">
                <Link href="/seasons">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Seasons
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
        <Link href={`/seasons`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons List
        </Link>
      </Button>
      <SeasonForm
        season={season}
        allEvents={allEvents}
        action={updateSeason}
        formTitle={`Edit Season: ${season.name}`}
        formDescription="Modify the details for this season and manage associated events."
        submitButtonText="Save Changes"
      />
    </div>
  );
}
