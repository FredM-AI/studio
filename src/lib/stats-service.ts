'use server';

import type { Season, Event, Player } from './definitions';

export interface LeaderboardEntry {
  playerId: string;
  playerName: string; 
  totalFinalResult: number;
  eventsPlayed: number;
  wins: number;
  finalTables: number; 
}

export interface PlayerProgressPoint {
  eventDate: string; 
  eventName: string;
  cumulativeFinalResult: number;
  eventFinalResult: number;
}

export interface SeasonStats {
  leaderboard: LeaderboardEntry[];
  playerProgress: { [playerId: string]: PlayerProgressPoint[] };
}

function getPlayerName(player: Player | undefined): string {
  if (!player) return "Unknown Player";
  return `${player.firstName} ${player.lastName}${player.nickname ? ` (${player.nickname})` : ''}`;
}

export async function calculateSeasonStats(
  season: Season,
  allEvents: Event[],
  allPlayers: Player[]
): Promise<SeasonStats> {
  const seasonEvents = allEvents
    .filter((event) => event.seasonId === season.id && event.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const playerStatsMap: Map<string, Omit<LeaderboardEntry, 'playerName' | 'playerId'> & { progress: PlayerProgressPoint[], lastCumulative: number }> = new Map();

  allPlayers.forEach(player => {
    playerStatsMap.set(player.id, {
      totalFinalResult: 0,
      eventsPlayed: 0,
      wins: 0,
      finalTables: 0,
      progress: [],
      lastCumulative: 0, // Track cumulative result for progress points
    });
  });

  for (const event of seasonEvents) {
    const buyIn = event.buyIn || 0;
    const rebuyPrice = event.rebuyPrice || 0;
    const participantIdsInEvent = new Set(event.participants);

    // Process results for players who got a prize
    const processedPlayerIdsFromResult = new Set<string>();
    if (event.results && event.results.length > 0) {
        for (const result of event.results) {
            const playerAggregatedStats = playerStatsMap.get(result.playerId);
            if (!playerAggregatedStats) continue;
            processedPlayerIdsFromResult.add(result.playerId);

            if (!playerAggregatedStats.progress.some(p => p.eventDate === event.date)) { // if not already processed for this event
                playerAggregatedStats.eventsPlayed += 1;
            }

            if (result.position === 1) {
            playerAggregatedStats.wins += 1;
            }
            
            const numParticipants = event.participants.length;
            let finalTableThreshold = 3; // Default
            if (numParticipants >= 10) finalTableThreshold = Math.ceil(numParticipants * 0.3); 
            else if (numParticipants >= 5 ) finalTableThreshold = 3;
            else finalTableThreshold = numParticipants > 0 ? numParticipants : 1;


            if (result.position <= finalTableThreshold) {
            playerAggregatedStats.finalTables += 1;
            }

            const numRebuys = result.rebuys || 0;
            const costForEvent = buyIn + numRebuys * rebuyPrice;
            const eventFinalResult = result.prize - costForEvent;
            
            // This update should only happen once per player per event.
            // The issue might be if a player appears in results but also as a participant below
            // and gets their totalFinalResult incremented twice.
            // For leaderboard, we only sum eventFinalResult once.
            playerAggregatedStats.totalFinalResult += eventFinalResult; 
            playerAggregatedStats.lastCumulative += eventFinalResult;

            playerAggregatedStats.progress.push({
            eventDate: event.date,
            eventName: event.name,
            eventFinalResult: eventFinalResult,
            cumulativeFinalResult: playerAggregatedStats.lastCumulative,
            });
        }
    }
    
    // Process other participants (those who played but didn't get a prize, or if results are empty)
    for (const participantId of participantIdsInEvent) {
        if (processedPlayerIdsFromResult.has(participantId)) continue; // Already processed via results

        const playerAggregatedStats = playerStatsMap.get(participantId);
        if (!playerAggregatedStats) continue;

        if (!playerAggregatedStats.progress.some(p => p.eventDate === event.date)) { // if not already processed for this event
            playerAggregatedStats.eventsPlayed += 1; // They played
        }

        // Assume 0 rebuys if not in results, cost is just buy-in
        const costForEvent = buyIn; 
        const eventFinalResult = 0 - costForEvent;

        playerAggregatedStats.totalFinalResult += eventFinalResult;
        playerAggregatedStats.lastCumulative += eventFinalResult;
        
        playerAggregatedStats.progress.push({
            eventDate: event.date,
            eventName: event.name,
            eventFinalResult: eventFinalResult,
            cumulativeFinalResult: playerAggregatedStats.lastCumulative,
        });
    }
  }


  const leaderboard: LeaderboardEntry[] = [];
  playerStatsMap.forEach((stats, playerId) => {
    if (stats.eventsPlayed > 0) {
      const player = allPlayers.find((p) => p.id === playerId);
      leaderboard.push({
        playerId,
        playerName: getPlayerName(player),
        totalFinalResult: stats.totalFinalResult,
        eventsPlayed: stats.eventsPlayed,
        wins: stats.wins,
        finalTables: stats.finalTables,
      });
    }
  });

  leaderboard.sort((a, b) => b.totalFinalResult - a.totalFinalResult);
  
  const playerProgress: { [playerId: string]: PlayerProgressPoint[] } = {};
  playerStatsMap.forEach((stats, playerId) => {
      if (stats.eventsPlayed > 0) { 
         playerProgress[playerId] = stats.progress.sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      }
  });

  return { leaderboard, playerProgress };
}
