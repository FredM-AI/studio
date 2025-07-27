
import { getSeasons, getEvents, getPlayers } from "@/lib/data-service";
import type { Season, Event as EventType, Player } from "@/lib/definitions";
import { calculateSeasonStats, type SeasonStats, type LeaderboardEntry } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, CalendarDays, TrendingUp, Edit, PlusCircle, Info, LogIn, Trophy, Award, Users, DollarSign, ArrowRight } from 'lucide-react';
import SeasonLeaderboardTable from '@/app/seasons/[seasonId]/SeasonLeaderboardTable';
import { cookies } from 'next/headers';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AUTH_COOKIE_NAME = 'app_session_active';

const getPlayerDisplayName = (player: Player | undefined): string => {
  if (!player) return "Unknown Player";
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

const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};


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

const StatCard = ({ icon, title, value, footer, valueClassName }: { icon: React.ReactNode, title: string, value: string | number, footer: React.ReactNode, valueClassName?: string}) => (
    <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
            <p className="text-xs text-muted-foreground">{footer}</p>
        </CardContent>
    </Card>
)

export default async function DashboardPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';

  const { currentSeason, allPlayers, seasonStats, seasonEvents } = await getCurrentSeasonData();

  if (!currentSeason) {
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
               null
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const completedSeasonEvents = seasonStats?.completedSeasonEvents || [];
  const lastCompletedEvent = completedSeasonEvents.length > 0 ? completedSeasonEvents[completedSeasonEvents.length - 1] : undefined;
  
  const topGainer = seasonStats?.leaderboard.length > 0 ? seasonStats.leaderboard[0] : null;
  const topGainerPlayer = topGainer ? allPlayers.find(p => p.id === topGainer.playerId) : null;
  
  const lastEventWinner = lastCompletedEvent && lastCompletedEvent.results.length > 0 
    ? lastCompletedEvent.results.find(r => r.position === 1) 
    : null;
  const lastWinnerPlayer = lastEventWinner ? allPlayers.find(p => p.id === lastEventWinner.playerId) : null;
  
  const totalPrizePool = completedSeasonEvents.reduce((acc, event) => acc + event.prizePool.total, 0);

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

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            title="Total Prize Pool"
            value={`€${totalPrizePool.toLocaleString()}`}
            footer={`${completedSeasonEvents.length} completed events`}
          />
          <StatCard 
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            title="Events Played"
            value={completedSeasonEvents.length}
            footer={`${seasonEvents.length} total events scheduled`}
          />
           <StatCard 
            icon={<Trophy className="h-4 w-4 text-muted-foreground" />}
            title="Top Gainer"
            value={topGainerPlayer ? getPlayerDisplayName(topGainerPlayer) : 'N/A'}
            valueClassName={topGainer && topGainer.totalFinalResult > 0 ? "text-green-600" : ""}
            footer={topGainer ? `Net: €${topGainer.totalFinalResult.toLocaleString()}` : 'No data'}
          />
          <StatCard 
            icon={<Award className="h-4 w-4 text-muted-foreground" />}
            title="Last Event Winner"
            value={lastWinnerPlayer ? getPlayerDisplayName(lastWinnerPlayer) : 'N/A'}
            footer={lastCompletedEvent ? lastCompletedEvent.name : 'No completed events'}
          />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Season Leaderboard</CardTitle>
                        <CardDescription>Ranking based on total net profit/loss from season events.</CardDescription>
                    </div>
                     <Button asChild variant="outline" size="sm">
                        <Link href={`/seasons/${currentSeason.id}`}>
                          <ArrowRight className="mr-2 h-4 w-4" /> View Full Details
                        </Link>
                    </Button>
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

            <div className="lg:col-span-2 space-y-6">
                 <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><CalendarDays /> Events Calendar</CardTitle>
                        <CardDescription>View all scheduled events for this season.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                           <Link href={`/seasons/${currentSeason.id}`}>
                                Open Calendar View
                           </Link>
                        </Button>
                    </CardContent>
                 </Card>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><TrendingUp/> Player Progress</CardTitle>
                        <CardDescription>Track cumulative profit/loss over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                           <Link href={`/seasons/${currentSeason.id}`}>
                                View Progress Chart
                           </Link>
                        </Button>
                    </CardContent>
                 </Card>
            </div>
       </div>

    </div>
  );
}

