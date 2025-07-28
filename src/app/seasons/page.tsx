
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getSeasons, getEvents } from "@/lib/data-service"; 
import type { Season, Event as EventType } from "@/lib/definitions"; 
import { BarChart3, PlusCircle, CalendarRange, Edit, Eye, CheckCircle, XCircle, ListTree, CalendarDays } from "lucide-react"; // Added ListTree, CalendarDays
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cookies } from 'next/headers';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const AUTH_COOKIE_NAME = 'app_session_active';

const SeasonCard = ({ season, associatedEvents, isAuthenticated }: { season: Season, associatedEvents: EventType[], isAuthenticated: boolean }) => (
  <AccordionItem value={season.id} className="border-b-0">
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <AccordionTrigger className="p-0 hover:no-underline">
        <CardHeader className="flex-grow text-left w-full">
          <CardTitle className="font-headline text-xl">{season.name}</CardTitle>
          <CardDescription className="flex items-center text-sm">
            <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
            {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing'}
          </CardDescription>
        </CardHeader>
      </AccordionTrigger>
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
        <div className="text-sm text-muted-foreground">
          Leaderboard Entries: {season.leaderboard.length} 
        </div>
      </CardContent>
      <AccordionContent className="px-6 pb-4">
        {associatedEvents.length > 0 ? (
          <div className="space-y-2 mt-2 border-t pt-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Events in this season:</h4>
            <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
              {associatedEvents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(event => (
                <li key={event.id} className="flex justify-between items-center p-1.5 hover:bg-muted/50 rounded-md">
                  <Link href={`/events/${event.id}`} className="hover:underline text-primary">
                    {event.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    <CalendarDays className="inline h-3 w-3 mr-1" />
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-2 border-t pt-3">No events associated with this season yet.</p>
        )}
      </AccordionContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
        <Button variant="default" size="sm" asChild title="View Season Details">
          <Link href={`/seasons/${season.id}`}>
            <Eye className="mr-1 h-4 w-4" /> View Full Details
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
  </AccordionItem>
);

export default async function SeasonsPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const seasons = await getSeasons();
  const allEvents = await getEvents(); 
  const sortedSeasons = seasons.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.date).getTime());

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
          <CardHeader>
            <CardTitle>No Seasons Found</CardTitle>
            <CardDescription>
              {isAuthenticated ? "Get started by creating your first poker season." : "No seasons have been created yet."}
            </CardDescription>
          </CardHeader>
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
         <Accordion type="multiple" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSeasons.map((season) => {
            const associatedEvents = allEvents.filter(event => event.seasonId === season.id);
            return <SeasonCard key={season.id} season={season} associatedEvents={associatedEvents} isAuthenticated={isAuthenticated} />;
          })}
        </Accordion>
      )}
    </div>
  );
}
