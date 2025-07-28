
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getSeasons, getEvents } from "@/lib/data-service"; 
import type { Season, Event as EventType } from "@/lib/definitions"; 
import { BarChart3, PlusCircle, CalendarRange, Edit, Eye, CheckCircle, XCircle, ListTree, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cookies } from 'next/headers';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { parseISO, isPast } from 'date-fns';

const AUTH_COOKIE_NAME = 'app_session_active';

const SeasonCard = ({ season, associatedEvents, isAuthenticated }: { season: Season, associatedEvents: EventType[], isAuthenticated: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <CardHeader className="flex-grow text-left w-full">
            <CardTitle className="font-headline text-xl">{season.name}</CardTitle>
            <CardDescription className="flex items-center text-sm">
                <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
                {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing'}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 pt-0">
            <div className="flex items-center">
            <Badge variant={season.isActive ? "default" : "outline"} className={season.isActive ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : "border-destructive text-destructive"}>
                {season.isActive ? <CheckCircle className="mr-1 h-3 w-3"/> : <XCircle className="mr-1 h-3 w-3"/>}
                {season.isActive ? "Active" : "Inactive"}
            </Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
            <ListTree className="mr-2 h-4 w-4" /> Associated Events: {associatedEvents.length}
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
            <Button variant="default" size="sm" asChild title="View Season Details">
            <Link href={`/seasons/${season.id}`}>
                <Eye className="mr-1 h-4 w-4" /> View Details
            </Link>
            </Button>
            {isAuthenticated && (
            <Button variant="outline" size="sm" asChild title="Edit Season">
                <Link href={`/seasons/${season.id}/edit`}>
                <Edit className="mr-1 h-4 w-4" /> Edit
                </Link>
            </Button>
            )}
        </CardFooter>
    </Card>
);

export default async function SeasonsPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const seasons = await getSeasons();
  const allEvents = await getEvents(); 

  const sortedSeasons = seasons.sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

  // Find the index of the last completed season
  let initialIndex = 0;
  const completedSeasons = sortedSeasons.filter(s => s.endDate && isPast(parseISO(s.endDate)));
  if (completedSeasons.length > 0) {
      const lastCompletedSeason = completedSeasons[completedSeasons.length - 1];
      initialIndex = sortedSeasons.findIndex(s => s.id === lastCompletedSeason.id);
  } else {
    // If no season is completed, find the first active one
    const activeSeasonIndex = sortedSeasons.findIndex(s => s.isActive);
    if(activeSeasonIndex !== -1) {
      initialIndex = activeSeasonIndex;
    }
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Seasons & Leaderboards</h1>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/seasons/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Season
            </Link>
          </Button>
        )}
      </div>

      {sortedSeasons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-20">
            <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-xl">No seasons created yet.</p>
            <p className="mt-2">Track player performance over time by organizing events into seasons.</p>
            {isAuthenticated && (
              <Button asChild className="mt-6">
                <Link href="/seasons/new">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create Season
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
         <Carousel
            opts={{
              align: "start",
              loop: false,
              startIndex: initialIndex,
            }}
            className="w-full"
          >
            <CarouselContent>
              {sortedSeasons.map((season) => {
                const associatedEvents = allEvents.filter(event => event.seasonId === season.id);
                return (
                  <CarouselItem key={season.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <SeasonCard season={season} associatedEvents={associatedEvents} isAuthenticated={isAuthenticated} />
                    </div>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
      )}
    </div>
  );
}
