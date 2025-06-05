
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getSeasons, getEvents } from "@/lib/data-service"; 
import type { Season, Event as EventType } from "@/lib/definitions"; 
import { BarChart3, PlusCircle, CalendarRange, Edit, Eye, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const SeasonCard = ({ season, eventCount }: { season: Season, eventCount: number }) => (
  <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
    <CardHeader>
      <CardTitle className="font-headline text-xl">{season.name}</CardTitle>
      <CardDescription className="flex items-center text-sm">
        <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
        {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing'}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex-grow space-y-3">
      <div className="flex items-center">
        <Badge variant={season.isActive ? "default" : "outline"} className={season.isActive ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : "border-destructive text-destructive"}>
          {season.isActive ? <CheckCircle className="mr-1 h-3 w-3"/> : <XCircle className="mr-1 h-3 w-3"/>}
          {season.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
       <div className="text-sm text-muted-foreground">
        Associated Events: {eventCount}
      </div>
       <div className="text-sm text-muted-foreground">
        Leaderboard Entries: {season.leaderboard.length} 
      </div>
    </CardContent>
    <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-auto">
      <Button variant="default" size="sm" asChild title="View Season Details">
        <Link href={`/seasons/${season.id}`}>
          <Eye className="mr-1 h-4 w-4" /> View
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild title="Edit Season">
        <Link href={`/seasons/${season.id}/edit`}>
          <Edit className="mr-1 h-4 w-4" /> Edit
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  const allEvents = await getEvents(); 
  const sortedSeasons = seasons.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Seasons & Leaderboards</h1>
        <Button asChild>
          <Link href="/seasons/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Season
          </Link>
        </Button>
      </div>

      {sortedSeasons.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Seasons Found</CardTitle>
            <CardDescription>Get started by creating your first poker season.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-20">
            <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-xl">No seasons created yet.</p>
            <p className="mt-2">Track player performance over time by organizing events into seasons.</p>
            <Button asChild className="mt-6">
              <Link href="/seasons/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Season
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSeasons.map((season) => {
            const eventCount = allEvents.filter(event => event.seasonId === season.id).length;
            return <SeasonCard key={season.id} season={season} eventCount={eventCount} />;
          })}
        </div>
      )}
    </div>
  );
}
