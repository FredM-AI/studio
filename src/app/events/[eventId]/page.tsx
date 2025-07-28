
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getEvents, getPlayers, getSeasons } from "@/lib/data-service";
import type { Event, Player, Season } from "@/lib/definitions";
import { ArrowLeft, Edit, Users, DollarSign, CalendarDays, Trophy, Info, Tag, CheckCircle, XCircle, Trash2, Star, Gift, BarChart3, HelpCircle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cookies } from 'next/headers';
import DeleteEventButton from "./DeleteEventButton";
import EventCarousel from './EventCarousel';

const AUTH_COOKIE_NAME = 'app_session_active';

async function getEventDetails(id: string): Promise<{ event: Event | undefined, players: Player[], seasons: Season[], events: Event[] }> {
  const allEvents = await getEvents();
  const event = allEvents.find(e => e.id === id);
  const players = await getPlayers();
  const seasons = await getSeasons();
  return { event, players, seasons, events: allEvents };
}

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

export default async function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE_NAME)?.value === 'true';
  const { event, players: allPlayers, seasons: allSeasons, events: allEvents } = await getEventDetails(params.eventId);

  if (!event) {
    return (
      <div className="space-y-4 text-center">
         <Button variant="outline" asChild className="mb-4 mr-auto">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events List
          </Link>
        </Button>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-destructive">Event Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The event you are looking for does not exist.</p>
             <Button asChild className="mt-4">
                <Link href="/events">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Events
                </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const linkedSeason = event.seasonId ? allSeasons.find(s => s.id === event.seasonId) : undefined;
  const eventsInSameSeason = linkedSeason 
    ? allEvents.filter(e => e.seasonId === linkedSeason.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const sortedResults = event.results.sort((a, b) => a.position - b.position);
  const rebuysActive = event.rebuyPrice !== undefined && event.rebuyPrice > 0;
  const includeBountiesInNetCalc = event.includeBountiesInNet ?? true;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-none">
          <Button variant="outline" asChild>
            <Link href="/events">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
            </Link>
          </Button>
        </div>
        <div className="flex-grow">
          {linkedSeason && (
            <EventCarousel 
              seasonEvents={eventsInSameSeason.map(e => ({ id: e.id, name: e.name }))}
              currentEventId={event.id}
              seasonName={linkedSeason.name}
            />
          )}
        </div>
        <div className="flex-none w-[138px]"></div> {/* Spacer to balance the layout */}
      </div>

      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-muted/30 p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <CardTitle className="font-headline text-2xl mb-1">{event.name}</CardTitle>
              <CardDescription className="text-md text-muted-foreground">
                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
              {linkedSeason && (
                <Link href={`/seasons/${linkedSeason.id}`} className="text-sm text-primary hover:underline flex items-center mt-1">
                  <BarChart3 className="mr-1.5 h-4 w-4" /> Part of: {linkedSeason.name}
                </Link>
              )}
            </div>
            {isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                {event.status === 'active' && (
                  <Button asChild size="sm" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                    <Link href={`/events/${event.id}/live`}>
                      <PlayCircle className="mr-2 h-4 w-4" /> Manage Live
                    </Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                  <Link href={`/events/${event.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Event
                  </Link>
                </Button>
                <DeleteEventButton eventId={event.id} eventName={event.name} className="w-full sm:w-auto" size="sm" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-headline text-lg text-primary flex items-center mb-3"><Info className="mr-2 h-5 w-5"/>Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm border p-4 rounded-lg bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4"/>Buy-in (Main Pool):</span>
                <span className="font-medium">€{event.buyIn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4"/>Total Main Prize Pool:</span>
                <span className="font-medium">€{event.prizePool.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center">
                  {rebuysActive ? <CheckCircle className="mr-2 h-4 w-4 text-green-500"/> : <XCircle className="mr-2 h-4 w-4 text-red-500"/>}
                  Rebuys (Prize Pool part):
                </span>
                <span className="font-medium">{rebuysActive ? `Yes (Price: €${event.rebuyPrice})` : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4"/>Status:</span>
                <Badge
                  variant={
                    event.status === 'completed' ? 'default' :
                    event.status === 'active' ? 'secondary' :
                    event.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }
                  className={
                    event.status === 'active' ? 'bg-green-500 text-white' : ''
                  }
                >
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
              {(event.bounties !== undefined && event.bounties > 0) && (
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center"><Star className="mr-2 h-4 w-4 text-yellow-500"/>Bounty Value:</span>
                      <span className="font-medium">€{event.bounties}</span>
                  </div>
              )}
              {(event.mysteryKo !== undefined && event.mysteryKo > 0) && (
                  <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center"><Gift className="mr-2 h-4 w-4 text-purple-500"/>Mystery KO Value:</span>
                      <span className="font-medium">€{event.mysteryKo}</span>
                  </div>
              )}
              {event.maxPlayers && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center"><Tag className="mr-2 h-4 w-4"/>Max Players:</span>
                  <span className="font-medium">{event.maxPlayers}</span>
                </div>
              )}
              <div className="flex items-center justify-between md:col-start-2">
                <span className="text-muted-foreground flex items-center"><HelpCircle className="mr-2 h-4 w-4"/>Bounties in Net Calc:</span>
                <span className="font-medium">{includeBountiesInNetCalc ? "Yes" : "No"}</span>
              </div>
          </div>
          

          {event.status === 'completed' && sortedResults.length > 0 && (
            <div className="md:col-span-2 space-y-3 pt-4 mt-4 border-t">
              <h3 className="font-headline text-lg text-primary flex items-center"><Trophy className="mr-2 h-5 w-5"/>Results ({event.participants.length} Participants)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left font-semibold">Pos</th>
                      <th className="p-2 text-left font-semibold">Player</th>
                      <th className="p-2 text-center font-semibold">Rebuys</th>
                      <th className="p-2 text-right font-semibold">Prize (€)</th>
                      <th className="p-2 text-right font-semibold">Bounties (€)</th>
                      <th className="p-2 text-right font-semibold">MSKO (€)</th>
                      <th className="p-2 text-right font-semibold">Net (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResults.map((result, index) => {
                      const prizeNum = result.prize || 0;
                      const bountiesWonNum = result.bountiesWon || 0;
                      const mysteryKoWonNum = result.mysteryKoWon || 0;

                      const mainBuyInNum = event.buyIn || 0;
                      const eventBountyValue = event.bounties || 0;
                      const eventMysteryKoValue = event.mysteryKo || 0;
                      const rebuysNum = result.rebuys || 0;
                      const rebuyPriceNum = event.rebuyPrice || 0;
                      
                      const investmentInMainPot = mainBuyInNum + (rebuysNum * rebuyPriceNum);
                      let netResult = 0;

                      if (includeBountiesInNetCalc) {
                        const bountyAndMkoCostsPerEntry = eventBountyValue + eventMysteryKoValue;
                        const totalInvestmentInExtras = (1 + rebuysNum) * bountyAndMkoCostsPerEntry;
                        const totalInvestment = investmentInMainPot + totalInvestmentInExtras;
                        const totalWinnings = prizeNum + bountiesWonNum + mysteryKoWonNum;
                        netResult = totalWinnings - totalInvestment;
                      } else {
                        netResult = prizeNum - investmentInMainPot;
                      }

                      return (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="p-2">{result.position}</td>
                          <td className="p-2">
                            <Link href={`/players/${result.playerId}`} className="hover:underline">
                              {getPlayerDisplayName(allPlayers.find(p => p.id === result.playerId))}
                            </Link>
                          </td>
                          <td className="p-2 text-center">{result.rebuys ?? 0}</td>
                          <td className="p-2 text-right">€{result.prize}</td>
                          <td className="p-2 text-right">€{result.bountiesWon || 0}</td>
                          <td className="p-2 text-right">€{result.mysteryKoWon || 0}</td>
                          <td className={`p-2 text-right font-medium ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            €{netResult}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
           {event.status === 'completed' && sortedResults.length === 0 && event.participants.length > 0 && (
             <div className="md:col-span-2 space-y-3 pt-3 border-t mt-3">
                <h3 className="font-headline text-lg text-primary flex items-center"><Trophy className="mr-2 h-5 w-5"/>Results</h3>
                <p className="text-sm text-muted-foreground">Results have not been entered for this completed event.</p>
             </div>
           )}


        </CardContent>
         <CardFooter className="p-3 bg-muted/30 border-t">
            <p className="text-xs text-muted-foreground">
                Created: {new Date(event.createdAt).toLocaleDateString()} | Last Updated: {new Date(event.updatedAt).toLocaleDateString()}
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
