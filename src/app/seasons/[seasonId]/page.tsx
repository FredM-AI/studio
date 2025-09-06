'use client';

import * as React from 'react';
import { getSeasons, getEvents, getPlayers } from '@/lib/data-service';
import type { Season, Event as EventType, Player } from '@/lib/definitions';
import { calculateSeasonStats, type SeasonStats } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, BarChart3, TrendingUp, AlertTriangle, Edit, Loader2 } from 'lucide-react';
import SeasonDetailsCalendar from './SeasonDetailsCalendar';
import SeasonLeaderboardTable from './SeasonLeaderboardTable';
import SeasonPlayerProgressChart from './SeasonPlayerProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

// Client-side data fetching function
async function getSeasonData(seasonId: string): Promise<{ season?: Season; allPlayers: Player[]; seasonStats?: SeasonStats, seasonEvents: EventType[] }> {
  const season = (await getSeasons()).find(s => s.id === seasonId);
  const allEvents = await getEvents();
  const allPlayers = await getPlayers();
  
  let seasonStats: SeasonStats | undefined = undefined;
  let seasonEventsForCalendar: EventType[] = [];

  if (season) {
    seasonStats = await calculateSeasonStats(season, allEvents, allPlayers);
    seasonEventsForCalendar = allEvents.filter(event => event.seasonId === season.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  return { season, allPlayers, seasonStats, seasonEvents: seasonEventsForCalendar };
}

// Server-side cookie check is no longer possible here, so we'll fetch it on the client
const AUTH_COOKIE_NAME = 'app_session_active';

export default function SeasonDetailsPage() {
  const params = useParams();
  const seasonId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;

  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<{
    season?: Season;
    allPlayers: Player[];
    seasonStats?: SeasonStats;
    seasonEvents: EventType[];
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

   React.useEffect(() => {
    // Client-side cookie check
    const authCookie = document.cookie.split('; ').find(row => row.startsWith(AUTH_COOKIE_NAME + '='));
    setIsAuthenticated(authCookie ? authCookie.split('=')[1] === 'true' : false);

    async function fetchData() {
      if (!seasonId) return;
      setIsLoading(true);
      try {
        const fetchedData = await getSeasonData(seasonId as string);
        setData(fetchedData);
      } catch (error) {
        console.error("Failed to fetch season data:", error);
        setData(null); // Set to null or some error state
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [seasonId]);

  if (isLoading) {
    return (
       <div className="space-y-8">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Card>
            <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.season) {
    return (
      <div className="space-y-6 text-center">
        <Button variant="outline" asChild className="mb-6 mr-auto">
          <Link href="/seasons">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons
          </Link>
        </Button>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="font-headline text-destructive mt-4">Season Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The season you are looking for does not exist.</p>
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

  const { season, allPlayers, seasonStats, seasonEvents: seasonEventsForCalendar } = data;
  const completedSeasonEvents = seasonStats?.completedSeasonEvents || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button variant="outline" asChild className="mb-2 md:mb-0">
            <Link href="/seasons">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Seasons
            </Link>
          </Button>
          <h1 className="font-headline text-3xl font-bold mt-2">{season.name}</h1>
          <p className="text-muted-foreground">
            {new Date(season.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - 
            {season.endDate ? new Date(season.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
          </p>
        </div>
        {isAuthenticated && (
          <Button asChild>
            <Link href={`/seasons/${season.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Season
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="leaderboard"><BarChart3 className="mr-2 h-4 w-4" />Leaderboard</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" />Events Calendar</TabsTrigger>
          <TabsTrigger value="progress"><TrendingUp className="mr-2 h-4 w-4" />Player Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Season Leaderboard</CardTitle>
              <CardDescription>Ranking based on total net profit/loss from season events.</CardDescription>
            </CardHeader>
            <CardContent>
              {seasonStats && seasonStats.leaderboard.length > 0 ? (
                <SeasonLeaderboardTable 
                  leaderboardData={seasonStats.leaderboard} 
                  seasonEvents={completedSeasonEvents}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">No completed events with results in this season yet to generate a leaderboard.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Events Calendar</CardTitle>
              <CardDescription>Overview of all events scheduled for this season (includes draft, active, completed).</CardDescription>
            </CardHeader>
            <CardContent>
                <SeasonDetailsCalendar events={seasonEventsForCalendar} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Player Progress</CardTitle>
              <CardDescription>Cumulative net profit/loss over the season's completed events.</CardDescription>
            </CardHeader>
            <CardContent>
              {seasonStats && completedSeasonEvents.length > 1 ? (
                <SeasonPlayerProgressChart
                  playerProgressData={seasonStats.playerProgress}
                  players={allPlayers}
                  seasonEvents={completedSeasonEvents} 
                />
              ) : (
                 <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed">
                    <p className="text-muted-foreground text-center">
                        Player progress chart is available after two or more events have been completed.
                    </p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <CardFooter className="text-xs text-muted-foreground mt-4 border-t pt-4">
        Season created: {new Date(season.createdAt).toLocaleDateString()} | Last updated: {new Date(season.updatedAt).toLocaleDateString()}
      </CardFooter>
    </div>
  );
}
