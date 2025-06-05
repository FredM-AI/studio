
'use server';

import type { Season, Event, Player, PlayerStats } from './definitions';

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

export async function calculatePlayerOverallStats(
  playerId: string,
  allEvents: Event[],
  allPlayers: Player[] // Keep allPlayers to find the specific player if needed, or could pass player object
): Promise<PlayerStats> {
  const player = allPlayers.find(p => p.id === playerId);
  const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    wins: 0,
    finalTables: 0,
    totalWinnings: 0,
    totalBuyIns: 0,
    bestPosition: null,
    averagePosition: null,
  };

  if (!player) {
    return defaultStats;
  }

  let gamesPlayed = 0;
  let wins = 0;
  let finalTables = 0;
  let totalWinnings = 0;
  let totalBuyIns = 0;
  const positions: number[] = [];

  const completedEvents = allEvents.filter(event => event.status === 'completed');

  for (const event of completedEvents) {
    const participated = event.participants.includes(playerId);
    if (!participated) continue;

    gamesPlayed++;
    const buyIn = event.buyIn || 0;
    const rebuyPrice = event.rebuyPrice || 0;
    let playerRebuysInEvent = 0;

    const playerResultEntry = event.results.find(r => r.playerId === playerId);

    if (playerResultEntry) {
      playerRebuysInEvent = playerResultEntry.rebuys || 0;
      totalWinnings += playerResultEntry.prize;
      positions.push(playerResultEntry.position);

      if (playerResultEntry.position === 1) {
        wins++;
      }

      const numParticipants = event.participants.length;
      let finalTableThreshold = 3; // Default
      if (numParticipants >= 10) finalTableThreshold = Math.ceil(numParticipants * 0.3);
      else if (numParticipants >= 5) finalTableThreshold = 3;
      else finalTableThreshold = numParticipants > 0 ? numParticipants : 1;

      if (playerResultEntry.position <= finalTableThreshold) {
        finalTables++;
      }
    }
    // Cost for the event for this player
    totalBuyIns += buyIn + (playerRebuysInEvent * rebuyPrice);
  }

  const bestPosition = positions.length > 0 ? Math.min(...positions) : null;
  const averagePosition = positions.length > 0 ? positions.reduce((sum, p) => sum + p, 0) / positions.length : null;

  return {
    gamesPlayed,
    wins,
    finalTables,
    totalWinnings,
    totalBuyIns,
    bestPosition,
    averagePosition,
  };
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

    // Process results for players who got a prize or have a result entry
    const processedPlayerIdsFromResult = new Set<string>();
    if (event.results && event.results.length > 0) {
        for (const result of event.results) {
            const playerAggregatedStats = playerStatsMap.get(result.playerId);
            if (!playerAggregatedStats) continue;
            
            if (!participantIdsInEvent.has(result.playerId)) continue; // Ensure player in result is actually a participant

            processedPlayerIdsFromResult.add(result.playerId);

            // Only increment eventsPlayed once per event, even if processed multiple times (which it shouldn't be here)
            if (!playerAggregatedStats.progress.some(p => p.eventDate === event.date)) {
                 playerAggregatedStats.eventsPlayed += 1;
            }


            if (result.position === 1) {
              // Ensure wins are not double-counted if logic runs multiple times for same event/player
              const hasWonThisEventInMap = playerAggregatedStats.progress.find(p => p.eventDate === event.date && playerStatsMap.get(result.playerId)?.wins! > (playerAggregatedStats.wins -1) );
              if(!hasWonThisEventInMap) playerAggregatedStats.wins += 1;
            }
            
            const numParticipants = event.participants.length;
            let finalTableThreshold = 3; 
            if (numParticipants >= 10) finalTableThreshold = Math.ceil(numParticipants * 0.3); 
            else if (numParticipants >= 5 ) finalTableThreshold = 3;
            else finalTableThreshold = numParticipants > 0 ? numParticipants : 1;


            if (result.position <= finalTableThreshold) {
               // Ensure finalTables are not double-counted
              const hasFinalTabledThisEventInMap = playerAggregatedStats.progress.find(p => p.eventDate === event.date && playerStatsMap.get(result.playerId)?.finalTables! > (playerAggregatedStats.finalTables -1) );
              if(!hasFinalTabledThisEventInMap) playerAggregatedStats.finalTables += 1;
            }

            const numRebuys = result.rebuys || 0;
            const costForEvent = buyIn + numRebuys * rebuyPrice;
            const eventFinalResult = result.prize - costForEvent;
            
            // If already processed (e.g. from participant loop), sum final results, otherwise set from scratch for this event
            const existingProgressPoint = playerAggregatedStats.progress.find(p => p.eventDate === event.date);
            if (existingProgressPoint) {
                // This path should ideally not be hit if participant loop is correctly skipped
                playerAggregatedStats.totalFinalResult -= existingProgressPoint.eventFinalResult; // Remove old
                playerAggregatedStats.totalFinalResult += eventFinalResult; // Add new
                playerAggregatedStats.lastCumulative -= existingProgressPoint.eventFinalResult;
                playerAggregatedStats.lastCumulative += eventFinalResult;
                existingProgressPoint.eventFinalResult = eventFinalResult;
                existingProgressPoint.cumulativeFinalResult = playerAggregatedStats.lastCumulative;
            } else {
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
    }
    
    // Process other participants (those who played but didn't get a result entry - e.g. didn't cash)
    for (const participantId of participantIdsInEvent) {
        if (processedPlayerIdsFromResult.has(participantId)) continue; 

        const playerAggregatedStats = playerStatsMap.get(participantId);
        if (!playerAggregatedStats) continue;

        if (!playerAggregatedStats.progress.some(p => p.eventDate === event.date)) { 
            playerAggregatedStats.eventsPlayed += 1; 
        }
        
        // Find if this participant had rebuys (e.g. if event.results isn't exhaustive of all participants but contains rebuy info for all)
        // For now, assume 0 rebuys if not in a result entry for simplicity.
        // This is a limitation if rebuys are not tracked for non-cashing players in event.results.
        const participantResultData = event.results.find(r => r.playerId === participantId);
        const numRebuys = participantResultData?.rebuys || 0;

        const costForEvent = buyIn + (numRebuys * rebuyPrice); 
        const eventFinalResult = 0 - costForEvent; // Prize is 0

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

