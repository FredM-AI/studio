
import { getPlayers, getEvents } from '@/lib/data-service';
import { calculateHallOfFameStats } from '@/lib/stats-service';
import type { HallOfFameStats, HofPlayerStat, HofEventStat, Player } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Crown, TrendingUp, Gem, Shield, Repeat, Award, Trophy, Banknote, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

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


const StatCard = ({ icon, title, description, stat, formatValue, unit }: { 
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    stat: HofPlayerStat | HofEventStat | null, 
    formatValue?: (value: number) => string,
    unit?: string 
}) => {
    if (!stat || !stat.player) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        {icon}
                        <div>
                            <CardTitle>{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">Not enough data to determine a leader.</p>
                </CardContent>
            </Card>
        );
    }
    
    const { player, value } = stat;
    const event = (stat as HofEventStat).event;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-4">
                    {icon}
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Link href={`/players/${player.id}`}>
                        <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={player.avatar} alt={getPlayerDisplayName(player)} />
                            <AvatarFallback className="text-xl bg-muted">{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/players/${player.id}`} className="hover:underline">
                            <p className="text-xl font-bold">{getPlayerDisplayName(player)}</p>
                        </Link>
                        <p className="text-2xl font-headline text-primary">
                            {formatValue ? formatValue(value) : value}
                            {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>}
                        </p>
                        {event && (
                            <Link href={`/events/${event.id}`} className="hover:underline">
                                <p className="text-xs text-muted-foreground mt-1">in "{event.name}" on {format(new Date(event.date), 'dd/MM/yyyy')}</p>
                            </Link>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default async function HallOfFamePage() {
    const allPlayers = await getPlayers();
    const allEvents = await getEvents();
    const stats = await calculateHallOfFameStats(allPlayers, allEvents);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <Trophy className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="font-headline text-3xl font-bold text-foreground">Hall of Fame</h1>
                <p className="text-muted-foreground mt-2">
                    Recognizing the legends of the club across all games. (Guests excluded)
                </p>
            </div>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Banknote className="h-10 w-10 text-green-500" />
                        <div>
                            <CardTitle>Total Wagered</CardTitle>
                            <CardDescription>Cumulative prize money across all completed events.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="text-center">
                     <p className="text-4xl font-headline text-primary">
                        €{stats.totalPrizePools.toLocaleString()}
                    </p>
                </CardContent>
            </Card>

            <div className="border-t pt-8">
                 <h2 className="text-2xl font-headline text-center mb-6">Player Records</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard 
                        icon={<Crown className="h-10 w-10 text-yellow-500" />}
                        title="Most Wins"
                        description="The player with the most 1st place finishes."
                        stat={stats.mostWins}
                        unit="wins"
                    />
                    <StatCard 
                        icon={<TrendingUp className="h-10 w-10 text-green-500" />}
                        title="Highest Net Profit"
                        description="The most profitable player of all time."
                        stat={stats.highestNet}
                        formatValue={(v) => `€${v.toLocaleString()}`}
                    />
                     <StatCard 
                        icon={<TrendingDown className="h-10 w-10 text-red-500" />}
                        title="Le Philanthrope"
                        description="Le joueur avec la plus grosse perte nette."
                        stat={stats.lowestNet}
                        formatValue={(v) => `€${v.toLocaleString()}`}
                    />
                    <StatCard 
                        icon={<Shield className="h-10 w-10 text-blue-500" />}
                        title="Most Podiums"
                        description="Most top 3 finishes."
                        stat={stats.mostPodiums}
                        unit="podiums"
                    />
                    <StatCard 
                        icon={<Gem className="h-10 w-10 text-purple-500" />}
                        title="Biggest Single Win"
                        description="Largest net gain in a single event."
                        stat={stats.biggestSingleWin}
                        formatValue={(v) => `€${v.toLocaleString()}`}
                    />
                    <StatCard 
                        icon={<Repeat className="h-10 w-10 text-red-500" />}
                        title="The Investor"
                        description="Player who has spent the most on buy-ins & rebuys."
                        stat={stats.mostSpent}
                        formatValue={(v) => `€${v.toLocaleString()}`}
                    />
                    <StatCard 
                        icon={<Award className="h-10 w-10 text-indigo-500" />}
                        title="The Iron Man"
                        description="The player with the most games played."
                        stat={stats.mostGamesPlayed}
                        unit="games"
                    />
                </div>
            </div>
        </div>
    );
}
