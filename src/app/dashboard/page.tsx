
'use client';

import * as React from 'react';
import type { Season, Event as EventType, Player } from "@/lib/definitions";
import { calculateSeasonStats, type SeasonStats, type LeaderboardEntry } from '@/lib/stats-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { BarChart3, CalendarDays, TrendingUp, Edit, PlusCircle, Info, LogIn, Trophy, Award, Users, DollarSign, ArrowRight, Medal, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SimpleLeaderboardTable from "@/components/SimpleLeaderboardTable";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SeasonLeaderboardTable from "@/app/seasons/[seasonId]/SeasonLeaderboardTable";
import SeasonDetailsCalendar from "@/app/seasons/[seasonId]/SeasonDetailsCalendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from 'date-fns';
import { getSeasons, getEvents, getPlayers } from "@/lib/data-service";
import { Skeleton } from '@/components/ui/skeleton';

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

const PodiumCard = ({ event, players }: { event?: EventType, players: Player[]}) => {
    if (!event) {
        return (
             <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Last Event Podium</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No completed events yet.
                    </div>
                </CardContent>
            </Card>
        )
    }

    const podiumResults = event.results.filter(r => r.position <= 3).sort((a, b) => a.position - b.position);
    
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Last Event Podium</CardTitle>
                 <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {podiumResults.map(result => {
                        const player = players.find(p => p.id === result.playerId);
                        return (
                            <div key={result.position} className="flex items-center gap-2 text-sm">
                                <Medal className={cn("h-5 w-5", 
                                    result.position === 1 && "text-yellow-500",
                                    result.position === 2 && "text-gray-400",
                                    result.position === 3 && "text-orange-400",
                                )} />
                                <span className="font-bold">{result.position}.</span>
                                <span className="flex-grow truncate">{getPlayerDisplayName(player)}</span>
                            </div>
                        )
                    })}
                </div>
                <p className="text-xs text-muted-foreground mt-2 truncate">{event.name}</p>
            </CardContent>
        </Card>
    )
}

interface DashboardData {
    currentSeason?: Season;
    nextSeason?: Season;
    allPlayers: Player[];
    seasonStats?: SeasonStats;
    seasonEvents: EventType[];
    isAuthenticated: boolean;
}

export default function DashboardPage() {
    const [data, setData] = React.useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            // Fetch all data
            const allSeasons = await getSeasons();
            const allEvents = await getEvents();
            const allPlayers = await getPlayers();

            // Client-side cookie check
            const authCookie = document.cookie.split('; ').find(row => row.startsWith('app_session_active='));
            const isAuthenticated = authCookie ? authCookie.split('=')[1] === 'true' : false;

            // Date logic
            const sortedSeasons = allSeasons.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            
            // Use UTC date for comparison to avoid timezone issues
            const now = new Date();
            const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

            const seasonToDisplay = sortedSeasons.find(season => parseISO(season.startDate) <= today);
            
            const futureSeasons = sortedSeasons
                .filter(season => parseISO(season.startDate) > today)
                .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
            const nextSeason = futureSeasons.length > 0 ? futureSeasons[0] : undefined;

            let seasonStats: SeasonStats | undefined = undefined;
            let seasonEvents: EventType[] = [];

            if (seasonToDisplay) {
                seasonStats = await calculateSeasonStats(seasonToDisplay, allEvents, allPlayers);
                seasonEvents = allEvents.filter(event => event.seasonId === seasonToDisplay.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }

            setData({
                currentSeason: seasonToDisplay,
                nextSeason,
                allPlayers,
                seasonStats,
                seasonEvents,
                isAuthenticated,
            });
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const formatFullDate = (dateString: string) => format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    const formatShortDate = (dateString: string) => format(parseISO(dateString), 'MMMM d');

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-24 w-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <Skeleton className="lg:col-span-3 h-96 w-full" />
                    <Skeleton className="lg:col-span-2 h-96 w-full" />
                </div>
            </div>
        );
    }
    
    if (!data) return null;

    const { currentSeason, nextSeason, allPlayers, seasonStats, seasonEvents, isAuthenticated } = data;

    if (!currentSeason) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
                <Card className="max-w-lg text-center">
                    <CardHeader>
                        <Info className="mx-auto h-12 w-12 text-primary mb-3" />
                        <CardTitle className="font-headline text-2xl">No Season Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            There is no season currently configured or started. Please create a new season to see the dashboard.
                        </p>
                        {isAuthenticated ? (
                            <Button asChild>
                                <Link href="/seasons">
                                    <CalendarDays className="mr-2 h-4 w-4" /> Manage Seasons
                                </Link>
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const completedSeasonEvents = seasonStats?.completedSeasonEvents || [];
    const lastCompletedEvent = completedSeasonEvents.length > 0 ? completedSeasonEvents[completedSeasonEvents.length - 1] : undefined;
    
    const topGainer = seasonStats?.leaderboard.length > 0 ? seasonStats.leaderboard[0] : null;
    const topGainerPlayer = topGainer ? allPlayers.find(p => p.id === topGainer.playerId) : null;
    
    const totalPrizePool = completedSeasonEvents.reduce((acc, event) => acc + event.prizePool.total, 0);

    const fullLeaderboard = seasonStats?.leaderboard || [];
    
    const recentEvents = [...seasonEvents]
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
    
    return (
        <div className="space-y-8">
            {nextSeason && (
                <Card className="bg-accent/50 border-accent/70">
                    <CardHeader className="text-center">
                        <Sparkles className="mx-auto h-8 w-8 text-primary mb-2"/>
                        <CardTitle className="font-headline text-2xl">New Season Coming Soon!</CardTitle>
                        <CardDescription className="text-lg font-medium">{nextSeason.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-muted-foreground mb-4">Starts on {formatFullDate(nextSeason.startDate)}</p>
                        <Button asChild>
                            <Link href={`/seasons/${nextSeason.id}`}>
                                <CalendarDays className="mr-2 h-4 w-4" /> View Season Events
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold">{currentSeason.isActive ? 'Current Season' : 'Last Season'}: {currentSeason.name}</h1>
                    <p className="text-muted-foreground">
                        {formatFullDate(currentSeason.startDate)} - 
                        {currentSeason.endDate ? formatFullDate(currentSeason.endDate) : 'Ongoing'}
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
                <PodiumCard event={lastCompletedEvent} players={allPlayers} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-headline">Season Leaderboard</CardTitle>
                            <CardDescription>Players ranked on total net profit/loss.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/seasons/${currentSeason.id}`}>
                                <ArrowRight className="mr-2 h-4 w-4" /> View Full Details
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-72">
                            {fullLeaderboard.length > 0 ? (
                                <SimpleLeaderboardTable 
                                    leaderboardData={fullLeaderboard}
                                />
                            ) : (
                                <p className="text-muted-foreground text-center py-8">No completed events with results in this season yet to generate a leaderboard.</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2"><CalendarDays /> Events Calendar</CardTitle>
                            <CardDescription>View upcoming events for this season.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentEvents.length > 0 ? (
                                    recentEvents.map(event => (
                                        <div key={event.id} className="flex items-center justify-between text-sm p-2 bg-muted/40 rounded-md">
                                            <div>
                                                <p className="font-medium truncate text-foreground">{event.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatShortDate(event.date)}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    event.status === 'completed' ? 'default' :
                                                    event.status === 'active' ? 'secondary' :
                                                    event.status === 'cancelled' ? 'destructive' :
                                                    'outline'
                                                }
                                                className={cn(
                                                    'text-xs',
                                                    event.status === 'active' && 'bg-green-500 text-white',
                                                    event.status === 'draft' && 'bg-yellow-100 text-yellow-800'
                                                )}
                                            >
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No events scheduled.</p>
                                )}
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full mt-4">
                                        Open Full Calendar View
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-fit">
                                    <DialogHeader>
                                        <DialogTitle>Event Calendar: {currentSeason.name}</DialogTitle>
                                    </DialogHeader>
                                    <SeasonDetailsCalendar events={seasonEvents} />
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    
