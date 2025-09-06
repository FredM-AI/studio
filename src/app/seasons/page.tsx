
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getSeasons, getEvents, getPlayers } from "@/lib/data-service"; 
import { calculateSeasonStats } from "@/lib/stats-service";
import type { Season, Event as EventType, Player, LeaderboardEntry } from "@/lib/definitions"; 
import { BarChart3, PlusCircle, CalendarRange, Edit, Eye, CheckCircle, XCircle, ListTree, Crown, Award, Trophy } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cookies } from 'next/headers';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { parseISO, isPast } from 'date-fns';
import { cn } from "@/lib/utils";

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

const SeasonCard = ({ season, associatedEvents, leaderboard, isAuthenticated }: { season: Season, associatedEvents: EventType[], leaderboard: LeaderboardEntry[], isAuthenticated: boolean }) => {
    
    const podium = leaderboard.filter(p => !p.isGuest).slice(0, 3);
    
    return (
        <Card className={cn(
            "group perspective-1000 flex flex-col h-full",
            "transition-all duration-300 ease-in-out hover:shadow-2xl hover:shadow-primary/20"
        )}>
            <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-2 group-hover:rotate-x-[-2deg] group-hover:rotate-y-[2deg] transform-style-3d backface-hidden flex flex-col h-full bg-card rounded-lg">
                <CardHeader className="text-left w-full">
                    <CardTitle className="font-headline text-xl">{season.name}</CardTitle>
                    <CardDescription className="flex items-center text-sm">
                        <CalendarRange className="mr-2 h-4 w-4 text-muted-foreground" />
                        {new Date(season.startDate).toLocaleDateString()} - {season.endDate ? new Date(season.endDate).toLocaleDateString() : 'Ongoing'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4 pt-0">
                    <div className="flex items-center gap-2">
                        <Badge variant={season.isActive ? "default" : "outline"} className={cn(season.isActive && "bg-green-500 hover:bg-green-600 text-primary-foreground", !season.isActive && "border-destructive text-destructive")}>
                            {season.isActive ? <CheckCircle className="mr-1 h-3 w-3"/> : <XCircle className="mr-1 h-3 w-3"/>}
                            {season.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">{associatedEvents.length} Events</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                        <h4 className="font-medium text-sm flex items-center"><Trophy className="mr-2 h-4 w-4 text-primary" />Podium</h4>
                        {podium.length > 0 ? (
                            <ul className="space-y-1 text-sm">
                                {podium.map((entry, index) => (
                                    <li key={entry.playerId} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 truncate">
                                            {index === 0 && <Crown className="h-4 w-4 text-yellow-500 shrink-0"/>}
                                            {index === 1 && <Award className="h-4 w-4 text-gray-400 shrink-0"/>}
                                            {index === 2 && <Trophy className="h-4 w-4 text-orange-400 shrink-0"/>}
                                            <span className="truncate">{entry.playerName}</span>
                                        </div>
                                        <span className={cn("font-semibold", entry.totalFinalResult > 0 && "text-green-600", entry.totalFinalResult < 0 && "text-red-600")}>
                                            €{entry.totalFinalResult.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground">No leaderboard data yet.</p>
                        )}
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
            </div>
        </Card>
    )
};

export default async function SeasonsPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const seasons = await getSeasons();
  const allEvents = await getEvents(); 
  const allPlayers = await getPlayers();

  const sortedSeasons = seasons.sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  
  const seasonData = await Promise.all(sortedSeasons.map(async season => {
      const stats = await calculateSeasonStats(season, allEvents, allPlayers);
      const associatedEvents = allEvents.filter(event => event.seasonId === season.id);
      return {
          ...season,
          leaderboard: stats.leaderboard,
          associatedEvents,
      }
  }));

  // Find the index of the last completed season
  let initialIndex = 0;
  if(sortedSeasons.length > 0) {
    const activeSeasonIndex = sortedSeasons.findIndex(s => s.isActive);
    if (activeSeasonIndex !== -1) {
        initialIndex = activeSeasonIndex;
    } else {
        const completedSeasons = sortedSeasons.filter(s => s.endDate && isPast(parseISO(s.endDate)));
        if (completedSeasons.length > 0) {
            const lastCompletedSeason = completedSeasons[completedSeasons.length - 1];
            initialIndex = sortedSeasons.findIndex(s => s.id === lastCompletedSeason.id);
        }
    }
  }


  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="font-headline text-3xl font-bold">Seasons & Leaderboards</h1>
        {isAuthenticated && (
          <Button asChild>
            <Link href="/seasons/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Season
            </Link>
          </Button>
        )}
      </div>

      <div className="flex-grow flex items-center justify-center">
        {sortedSeasons.length === 0 ? (
          <Card className="w-full max-w-lg">
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
              className="w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl"
            >
              <CarouselContent className="-ml-4">
                {seasonData.map((season) => {
                  return (
                    <CarouselItem key={season.id} className="md:basis-1/2 xl:basis-1/3 pl-4">
                      <div className="p-1 h-full">
                        <SeasonCard 
                            season={season} 
                            associatedEvents={season.associatedEvents} 
                            leaderboard={season.leaderboard}
                            isAuthenticated={isAuthenticated} 
                        />
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <CarouselPrevious className="ml-[-50px]" />
              <CarouselNext className="mr-[-50px]" />
            </Carousel>
        )}
      </div>
    </div>
  );
}
