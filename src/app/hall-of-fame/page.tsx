
import { getPlayers, getEvents } from '@/lib/data-service';
import { calculateHallOfFameStats } from '@/lib/stats-service';
import type { HallOfFameStats, HofPlayerStat, HofEventStat, Player } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Crown, TrendingUp, Gem, Shield, Repeat, Award, Trophy, Banknote, TrendingDown, Crosshair, Anchor } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


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


const StatCard = ({ icon, title, description, stat, formatValue, unit, className, valueClassName }: { 
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    stat: HofPlayerStat | HofEventStat | null, 
    formatValue?: (value: number) => string,
    unit?: string,
    className?: string,
    valueClassName?: string,
}) => {
    
    const { player, value } = stat || {};
    const event = (stat as HofEventStat)?.event;

    return (
        <div className={cn("group perspective-1000", className)}>
             <div className={cn(
                "relative w-full h-full rounded-xl border border-white/10 bg-green-900/20 backdrop-blur-sm shadow-lg",
                "transition-all duration-300 ease-in-out transform-style-3d",
                "group-hover:shadow-2xl group-hover:shadow-primary/30 group-hover:-translate-y-2 group-hover:rotate-x-[-4deg] group-hover:rotate-y-[4deg]"
             )}>
                <div className="p-6 flex flex-col h-full backface-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary drop-shadow-[0_0_4px_hsl(var(--primary))]">
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    {stat && player ? (
                        <div className="mt-auto">
                            <div className="flex items-center gap-4">
                                <Link href={`/players/${player.id}`}>
                                    <Avatar className="h-16 w-16 border-2 border-primary transition-transform duration-300 group-hover:scale-110">
                                        <AvatarImage src={player.avatar} alt={getPlayerDisplayName(player)} />
                                        <AvatarFallback className="text-xl bg-muted">{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div>
                                    <Link href={`/players/${player.id}`} className="hover:underline">
                                        <p className="text-xl font-bold">{getPlayerDisplayName(player)}</p>
                                    </Link>
                                    <p className={cn("text-3xl font-headline drop-shadow-[0_0_8px_currentColor]", valueClassName)}>
                                        {formatValue ? formatValue(value!) : value}
                                        {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>}
                                    </p>
                                </div>
                            </div>
                            {event && (
                                <Link href={`/events/${event.id}`} className="hover:underline">
                                    <p className="text-xs text-muted-foreground mt-2 text-right">in "{event.name}" on {format(new Date(event.date), 'dd/MM/yyyy')}</p>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-muted-foreground text-center py-4">Not enough data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default async function HallOfFamePage() {
    const allPlayers = await getPlayers();
    const allEvents = await getEvents();
    const stats = await calculateHallOfFameStats(allPlayers, allEvents);

    return (
        <div className="relative overflow-hidden">
             <div className="absolute inset-0 z-0 bg-background" />
            <div className="relative z-10 space-y-8">
                <div className="text-center">
                    <Trophy className="mx-auto h-16 w-16 text-primary mb-4 drop-shadow-[0_0_15px_hsl(var(--primary))] animate-pulse" />
                    <h1 className="font-headline text-4xl font-bold text-foreground">Hall of Fame</h1>
                    <p className="text-muted-foreground mt-2">
                        Recognizing the legends of the club across all games. (Guests excluded)
                    </p>
                </div>

                <Card className="hover:shadow-lg transition-shadow bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Banknote className="h-10 w-10 text-green-500 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                            <div>
                                <CardTitle>Total Wagered</CardTitle>
                                <CardDescription>Cumulative prize money across all completed events.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-5xl font-headline text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]">
                            €{stats.totalPrizePools.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <div className="border-t border-white/10 pt-8">
                    <h2 className="text-3xl font-headline text-center mb-8">Player Records</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StatCard 
                            icon={<Crown className="h-10 w-10" />}
                            title="Most Wins"
                            description="The player with the most 1st place finishes."
                            stat={stats.mostWins}
                            unit="wins"
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<TrendingUp className="h-10 w-10" />}
                            title="Highest Net Profit"
                            description="The most profitable player of all time."
                            stat={stats.highestNet}
                            formatValue={(v) => `€${v.toLocaleString()}`}
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<Crosshair className="h-10 w-10" />}
                            title="Bounty Hunter"
                            description="Player with the highest total value from bounties."
                            stat={stats.mostBountiesWon}
                            formatValue={(v) => `€${v.toLocaleString()}`}
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<Shield className="h-10 w-10" />}
                            title="Most Podiums"
                            description="Most top 3 finishes."
                            stat={stats.mostPodiums}
                            unit="podiums"
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<TrendingDown className="h-10 w-10" />}
                            title="The Philanthropist"
                            description="The player with the biggest net loss."
                            stat={stats.lowestNet}
                            formatValue={(v) => `€${v.toLocaleString()}`}
                            valueClassName="text-red-500"
                        />
                        <StatCard 
                            icon={<Gem className="h-10 w-10" />}
                            title="Biggest Single Win"
                            description="Largest net gain in a single event."
                            stat={stats.biggestSingleWin}
                            formatValue={(v) => `€${v.toLocaleString()}`}
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<Repeat className="h-10 w-10" />}
                            title="The Investor"
                            description="Player who has spent the most on buy-ins & rebuys."
                            stat={stats.mostSpent}
                            formatValue={(v) => `€${v.toLocaleString()}`}
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<Award className="h-10 w-10" />}
                            title="The Iron Man"
                            description="The player with the most games played."
                            stat={stats.mostGamesPlayed}
                            unit="games"
                            valueClassName="text-green-400"
                        />
                        <StatCard 
                            icon={<Anchor className="h-10 w-10" />}
                            title="Mr. Consistent"
                            description="Best average position (min. 3 games)."
                            stat={stats.mostConsistent}
                            formatValue={(v) => v.toFixed(2)}
                            valueClassName="text-green-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
