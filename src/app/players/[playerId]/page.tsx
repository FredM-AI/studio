import { getPlayers } from "@/lib/data-service";
import type { Player } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, UserCircle, Mail, Phone, BarChartHorizontalBig, CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";

async function getPlayer(id: string): Promise<Player | undefined> {
  const players = await getPlayers();
  return players.find(p => p.id === id);
}

export default async function PlayerDetailPage({ params }: { params: { playerId: string } }) {
  const player = await getPlayer(params.playerId);

  if (!player) {
    return (
      <div className="text-center py-10">
        <h1 className="font-headline text-2xl text-destructive">Player Not Found</h1>
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
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
       <Button variant="outline" asChild className="mb-6">
         <Link href="/players">
           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Players List
         </Link>
       </Button>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50 p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-md">
            {player.avatar ? (
                <AvatarImage src={player.avatar} alt={`${player.firstName} ${player.lastName}`} data-ai-hint="person avatar"/>
            ) : (
                <AvatarImage src={`https://placehold.co/100x100.png`} alt="Placeholder Avatar" data-ai-hint="person avatar"/>
            )}
            <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
              {getInitials(player.firstName, player.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-grow">
            <CardTitle className="font-headline text-3xl mb-1">{player.firstName} {player.lastName}</CardTitle>
            {player.nickname && <CardDescription className="text-lg text-accent font-medium">"{player.nickname}"</CardDescription>}
            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full font-medium ${
                player.isActive 
                ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
            }`}>
                {player.isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {player.isActive ? "Active" : "Inactive"}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/players/${player.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Player
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-headline text-xl mb-3 text-primary">Contact Information</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{player.email}</span>
              </li>
              {player.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span>{player.phone}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-headline text-xl mb-3 text-primary">Player Statistics</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Games Played:</span>
                <span className="font-medium">{player.stats.gamesPlayed}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Wins:</span>
                <span className="font-medium">{player.stats.wins}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Final Tables:</span>
                <span className="font-medium">{player.stats.finalTables}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Winnings:</span>
                <span className="font-medium">${player.stats.totalWinnings.toLocaleString()}</span>
              </li>
               <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Buy-Ins:</span>
                <span className="font-medium">${player.stats.totalBuyIns.toLocaleString()}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Best Position:</span>
                <span className="font-medium">{player.stats.bestPosition ?? 'N/A'}</span>
              </li>
               <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Position:</span>
                <span className="font-medium">{player.stats.averagePosition?.toFixed(2) ?? 'N/A'}</span>
              </li>
            </ul>
          </div>
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
