
import { getSeasons, getEvents, getPlayers } from "@/lib/data-service";
import type { Season, Event as EventType, Player } from "@/lib/definitions";
import { calculateSeasonStats, type SeasonStats } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, CalendarDays, TrendingUp, Edit, PlusCircle, Info } from 'lucide-react';
import SeasonDetailsCalendar from './seasons/[seasonId]/SeasonDetailsCalendar';
import SeasonLeaderboardTable from './seasons/[seasonId]/SeasonLeaderboardTable';
import SeasonPlayerProgressChart from './seasons/[seasonId]/SeasonPlayerProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getCurrentSeasonData(): Promise<{ currentSeason?: Season; allEvents: EventType[]; allPlayers: Player[]; seasonStats?: SeasonStats, seasonEvents: EventType[] }> {
  const allSeasons = await getSeasons();
  const allEvents = await getEvents();
  const allPlayers = await getPlayers();

  const activeSeasons = allSeasons
    .filter(s => s.isActive)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const currentSeason = activeSeasons.length > 0 ? activeSeasons[0] : undefined;
  
  let seasonStats: SeasonStats | undefined = undefined;
  let seasonEvents: EventType[] = [];

  if (currentSeason) {
    seasonStats = await calculateSeasonStats(currentSeason, allEvents, allPlayers);
    seasonEvents = allEvents.filter(event => event.seasonId === currentSeason.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  return { currentSeason, allEvents, allPlayers, seasonStats, seasonEvents };
}

export default async function DashboardPage() {
  const { currentSeason, allPlayers, seasonStats, seasonEvents } = await getCurrentSeasonData();

  if (!currentSeason || !seasonStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="max-w-lg text-center">
          <CardHeader>
            <Info className="mx-auto h-12 w-12 text-primary mb-3" />
            <CardTitle className="font-headline text-2xl">No Active Season Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              There is no active season currently running. Please create a new season or activate an existing one to see the dashboard.
            </p>
            <Button asChild>
              <Link href="/seasons">
                <CalendarDays className="mr-2 h-4 w-4" /> Manage Seasons
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
          <h1 className="font-headline text-3xl font-bold">Current Season: {currentSeason.name}</h1>
          <p className="text-muted-foreground">
            {new Date(currentSeason.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - 
            {currentSeason.endDate ? new Date(currentSeason.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Ongoing'}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/seasons/${currentSeason.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Current Season
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="leaderboard"><BarChart3 className="mr-2 h-4 w-4" />Leaderboard</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="mr-2 h-4 w-4" />Events Calendar</TabsTrigger>
          <TabsTrigger value="progress"><TrendingUp className="mr-2 h-4 w-4" />Player Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboard" className="mt-6">
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

        <TabsContent value="calendar" className="mt-6">
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

        <TabsContent value="progress" className="mt-6">
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
    </div>
  );
}
