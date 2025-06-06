
import { getSeasons, getEvents, getPlayers } from '@/lib/data-service';
import type { Season, Event as EventType, Player } from '@/lib/definitions';
import { calculateSeasonStats, type SeasonStats } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, BarChart3, TrendingUp, AlertTriangle, Edit } from 'lucide-react';
import SeasonDetailsCalendar from './SeasonDetailsCalendar';
import SeasonLeaderboardTable from './SeasonLeaderboardTable';
import SeasonPlayerProgressChart from './SeasonPlayerProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'app_session_active';

async function getSeasonData(seasonId: string): Promise<{ season?: Season; allEvents: EventType[]; allPlayers: Player[]; seasonStats?: SeasonStats, seasonEvents: EventType[] }> {
  const season = (await getSeasons()).find(s => s.id === seasonId);
  const allEvents = await getEvents();
  const allPlayers = await getPlayers();
  
  let seasonStats: SeasonStats | undefined = undefined;
  let seasonEvents: EventType[] = [];

  if (season) {
    seasonStats = await calculateSeasonStats(season, allEvents, allPlayers);
    seasonEvents = allEvents.filter(event => event.seasonId === season.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  return { season, allEvents, allPlayers, seasonStats, seasonEvents };
}


export default async function SeasonDetailsPage({ params }: { params: { seasonId: string } }) {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const { seasonId } = params;
  const { season, allPlayers, seasonStats, seasonEvents } = await getSeasonData(seasonId);

  if (!season) {
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

  const completedSeasonEvents = seasonEvents.filter(e => e.status === 'completed');

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
            {new Date(season.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - 
            {season.endDate ? new Date(season.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ongoing'}
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
                <SeasonLeaderboardTable leaderboardData={seasonStats.leaderboard} />
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
              <CardDescription>Overview of all events scheduled for this season.</CardDescription>
            </CardHeader>
            <CardContent>
                <SeasonDetailsCalendar events={seasonEvents} />
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
              {seasonStats && Object.keys(seasonStats.playerProgress).length > 0 ? (
                <SeasonPlayerProgressChart
                  playerProgressData={seasonStats.playerProgress}
                  players={allPlayers}
                  seasonEvents={completedSeasonEvents} 
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">No player progress data available. This appears after completed events with results.</p>
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
