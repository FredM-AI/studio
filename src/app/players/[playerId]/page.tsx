

'use client';

import { getPlayers, getEvents, getSeasons } from "@/lib/data-service";
import type { Player, PlayerStats, Event as EventType, Season } from "@/lib/definitions";
import { calculatePlayerOverallStats } from "@/lib/stats-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus, UserCheck, Target, Trophy, Percent, BarChartHorizontal, LineChart as LineChartIcon, AlertTriangle, Hash, Repeat } from "lucide-react";
import Image from "next/image";
import { cookies } from 'next/headers';
import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from 'next/navigation';

// We keep this server-side function to get the initial data for the page,
// but the actual rendering will be client-side to use hooks.
async function getPlayerInitialData(id: string): Promise<{ player?: Player; allEvents: EventType[]; allPlayers: Player[]; allSeasons: Season[] }> {
  const allPlayers = await getPlayers();
  const player = allPlayers.find(p => p.id === id);
  const allEvents = await getEvents();
  const allSeasons = await getSeasons();
  return { player, allEvents, allPlayers, allSeasons };
}


const StatCard = ({ icon, title, value, unit, className = '', valueClassName = '' }: { icon: React.ReactNode, title: string, value: string | number, unit?: string, className?: string, valueClassName?: string }) => (
    <div className={`bg-muted/50 p-3 rounded-lg flex items-center gap-3 ${className}`}>
        <div className="p-2 bg-background rounded-md shadow-sm">{icon}</div>
        <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-lg font-bold ${valueClassName}`}>
                {value}
                {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
            </p>
        </div>
    </div>
);


export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = Array.isArray(params.playerId) ? params.playerId[0] : params.playerId;
  
  const [player, setPlayer] = useState<Player | undefined>(undefined);
  const [calculatedStats, setCalculatedStats] = useState<PlayerStats | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;

    // Client-side cookie check
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('app_session_active='));
    setIsAuthenticated(authCookie ? authCookie.split('=')[1] === 'true' : false);

    // Client-side data fetching and processing
    const fetchData = async () => {
      setIsLoading(true);
      const { player, allEvents, allPlayers, allSeasons } = await getPlayerInitialData(playerId as string);
      if (player) {
        setPlayer(player);
        const stats = await calculatePlayerOverallStats(player.id, allEvents, allPlayers, allSeasons);
        setCalculatedStats(stats);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [playerId]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-muted/50 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-grow space-y-2">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardHeader>
          <CardContent className="p-6">
             <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!player || !calculatedStats) {
    return (
       <div className="space-y-6 text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="font-headline text-2xl text-destructive mt-4">Player Not Found</h1>
        <p className="text-muted-foreground mt-2">The player you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/players">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Players
          </Link>
        </Button>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const netProfitOrLoss = calculatedStats.totalWinnings - calculatedStats.totalBuyIns;

  const getProfitIcon = () => {
    if (netProfitOrLoss > 0) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (netProfitOrLoss < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
       <Button variant="outline" asChild className="mb-6">
         <Link href="/players">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Players List
         </Link>
       </Button>

      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/50 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            {player.avatar && <AvatarImage src={player.avatar} alt={`${player.firstName} ${player.lastName}`} />}
            <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
              {getInitials(player.firstName, player.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="font-headline text-3xl mb-1">{player.firstName} {player.lastName}</CardTitle>
            {player.nickname && <CardDescription className="text-lg text-primary font-medium">"{player.nickname}"</CardDescription>}
             <div className="flex items-center gap-3 mt-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full font-medium ${
                    player.isActive 
                    ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                    : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                }`}>
                    {player.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {player.isActive ? "Active" : "Inactive"}
                </div>
                 {player.isGuest && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100">
                        <UserCheck className="h-4 w-4" /> Guest
                    </div>
                )}
                 <div className="flex items-center text-sm gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{player.email}</span>
                    {player.phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{player.phone}</span>}
                 </div>
            </div>
          </div>
          {isAuthenticated && (
            <Button asChild variant="outline">
              <Link href={`/players/${player.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Player
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-headline text-xl text-primary border-b pb-2">Performance Metrics</h3>
             <div className="space-y-2">
                 <StatCard icon={<Trophy className="h-5 w-5 text-yellow-500"/>} title="Win Rate" value={calculatedStats.winRate.toFixed(1)} unit="%" />
                 <StatCard icon={<Target className="h-5 w-5 text-green-500"/>} title="ITM / Final Table Rate" value={calculatedStats.itmRate.toFixed(1)} unit="%" />
                 <StatCard icon={<BarChartHorizontal className="h-5 w-5 text-blue-500"/>} title="Average Position" value={calculatedStats.averagePosition ? calculatedStats.averagePosition.toFixed(2) : 'N/A'} />
             </div>
          </div>
           <div className="space-y-4">
                <h3 className="font-headline text-xl text-primary border-b pb-2">Overall Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <StatCard icon={<Hash className="h-5 w-5" />} title="Games Played" value={calculatedStats.gamesPlayed} />
                    <StatCard icon={<Trophy className="h-5 w-5" />} title="Wins" value={calculatedStats.wins} />
                    <StatCard icon={<Repeat className="h-5 w-5" />} title="Total Rebuys" value={calculatedStats.totalRebuys} />
                    <StatCard icon={<TrendingUp className="h-5 w-5 text-green-600" />} title="Total Winnings" value={`€${calculatedStats.totalWinnings}`} valueClassName="text-green-600" />
                    <StatCard icon={<TrendingDown className="h-5 w-5 text-red-600"/>} title="Total Investment" value={`€${calculatedStats.totalBuyIns}`} valueClassName="text-red-600" />
                    <StatCard 
                        icon={getProfitIcon()} 
                        title="Net Profit / Loss" 
                        value={`€${netProfitOrLoss.toLocaleString()}`}
                        valueClassName={netProfitOrLoss >= 0 ? 'text-green-600' : 'text-red-500'} 
                    />
                </div>
           </div>
        </CardContent>

        <CardContent className="p-6 pt-0">
             <h3 className="font-headline text-xl text-primary border-b pb-2 mb-4 flex items-center gap-2"><LineChartIcon className="h-5 w-5" />Profit Evolution</h3>
             {calculatedStats.profitEvolution.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={calculatedStats.profitEvolution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="eventDate" 
                            tickFormatter={(dateStr) => format(parseISO(dateStr), 'dd/MM/yy')}
                            fontSize={12}
                            tickMargin={5}
                            minTickGap={20}
                        />
                        <YAxis tickFormatter={(value) => `€${value}`} fontSize={12}/>
                        <Tooltip 
                            labelFormatter={(label) => format(parseISO(label), 'PPP')}
                            formatter={(value: number, name, props) => [`€${value}`, `Cumulative Profit after "${props.payload.eventName}"`]}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))'
                            }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md border border-dashed">
                    <p className="text-muted-foreground text-center">Not enough data to display profit evolution.</p>
                </div>
             )}
        </CardContent>

        <CardFooter className="p-6 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Player since: {new Date(player.createdAt).toLocaleDateString()} | Last updated: {new Date(player.updatedAt).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
