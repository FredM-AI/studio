
import { getSeasons, getEvents, getPlayers } from "@/lib/data-service";
import type { Season, Event as EventType, Player } from "@/lib/definitions";
import { calculateSeasonStats, type SeasonStats } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, CalendarDays, TrendingUp, Edit, PlusCircle, Info, LogIn } from 'lucide-react';
import SeasonDetailsCalendar from '@/app/seasons/[seasonId]/SeasonDetailsCalendar';
import SeasonLeaderboardTable from '@/app/seasons/[seasonId]/SeasonLeaderboardTable';
import SeasonPlayerProgressChart from '@/app/seasons/[seasonId]/SeasonPlayerProgressChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'app_session_active';

async function getCurrentSeasonData(): Promise<{ currentSeason?: Season; allEvents: EventType[]; allPlayers: Player[]; seasonStats?: SeasonStats, seasonEvents: EventType[] }> {
  const allSeasons = await getSeasons();
  const allEvents = await getEvents();
  const allPlayers = await getPlayers();

  const activeSeasons = allSeasons
    .filter(s => s.isActive)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const currentSeason = activeSeasons.length > 0 ? activeSeasons[0] : undefined;
  
  let seasonStats: SeasonStats | undefined = undefined;
  let seasonEvents: EventType[] = []; // Tous les événements de la saison (draft, active, completed)

  if (currentSeason) {
    seasonStats = await calculateSeasonStats(currentSeason, allEvents, allPlayers);
    seasonEvents = allEvents.filter(event => event.seasonId === currentSeason.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  return { currentSeason, allEvents, allPlayers, seasonStats, seasonEvents };
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';

  const { currentSeason, allPlayers, seasonStats, seasonEvents } = await getCurrentSeasonData();

  if (!currentSeason) { // Modification: seulement vérifier currentSeason ici, seasonStats peut être undefined.
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
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/seasons">
                  <CalendarDays className="mr-2 h-4 w-4" /> Manage Seasons
                </Link>
              </Button>
            ) : (
               // No login button here, header handles it for guests
               null
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // completedSeasonEvents sera passé à SeasonLeaderboardTable et SeasonPlayerProgressChart
  const completedSeasonEvents = seasonStats?.completedSeasonEvents || [];

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
        {isAuthenticated && (
          <Button asChild variant="outline">
            <Link href={`/seasons/${currentSeason.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Current Season
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
                <SeasonDetailsCalendar events={seasonEvents} /> {/* Utilise tous les événements de la saison pour le calendrier */}
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
              {seasonStats && Object.keys(seasonStats.playerProgress).length > 0 && completedSeasonEvents.length > 0 ? (
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
