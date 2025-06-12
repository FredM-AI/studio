
'use server';

import type { Season, Event, Player, PlayerStats, EventResult } from './definitions';

// Modifiée pour inclure les résultats par événement
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  eventResults: { [eventId: string]: number }; // eventId -> netResultForPlayerInEvent
  totalFinalResult: number;
  // eventsPlayed: number; // On peut le déduire de eventResults ou le calculer si besoin ailleurs
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
  // Ajout des événements complétés de la saison pour que la table puisse construire ses colonnes
  completedSeasonEvents: Event[];
}

function getPlayerName(player: Player | undefined): string {
  if (!player) return "Unknown Player";
  return `${player.firstName} ${player.lastName}${player.nickname ? ` (${player.nickname})` : ''}`;
}

export async function calculatePlayerOverallStats(
  playerId: string,
  allEvents: Event[],
  allPlayers: Player[]
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
      let finalTableThreshold = 3; 
      if (numParticipants >= 10) finalTableThreshold = Math.ceil(numParticipants * 0.3);
      else if (numParticipants >= 5) finalTableThreshold = 3;
      else finalTableThreshold = numParticipants > 0 ? numParticipants : 1;

      if (playerResultEntry.position <= finalTableThreshold) {
        finalTables++;
      }
    }
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
  const completedSeasonEvents = allEvents
    .filter((event) => event.seasonId === season.id && event.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const playerSeasonSummaries: Map<string, {
    eventResults: { [eventId: string]: number };
    totalFinalResult: number;
    eventsPlayed: number;
    progress: PlayerProgressPoint[];
    lastCumulative: number;
  }> = new Map();

  // Initialiser pour tous les joueurs afin que même ceux n'ayant pas joué dans la saison apparaissent si besoin (pour le moment, ils seront filtrés)
  allPlayers.forEach(player => {
    playerSeasonSummaries.set(player.id, {
      eventResults: {},
      totalFinalResult: 0,
      eventsPlayed: 0,
      progress: [],
      lastCumulative: 0,
    });
  });

  for (const event of completedSeasonEvents) {
    const buyInForEvent = event.buyIn || 0;
    const rebuyPriceForEvent = event.rebuyPrice || 0;
    const participantIdsInEvent = new Set(event.participants);

    for (const playerId of participantIdsInEvent) {
      const summary = playerSeasonSummaries.get(playerId);
      if (!summary) continue; // Devrait pas arriver si initialisé pour allPlayers

      // Si c'est la première fois qu'on traite cet event pour ce joueur dans cette session de calcul (évite double comptage si structure de données évolue)
      if (summary.eventResults[event.id] === undefined) {
           if(!Object.keys(summary.eventResults).length) summary.eventsPlayed = 0; // reset for first event
           // Check if this is a new event for this player in the season before incrementing
           const eventsProcessedForPlayer = new Set(Object.keys(summary.eventResults));
           if (!eventsProcessedForPlayer.has(event.id)) {
             summary.eventsPlayed += 1;
           }
      }


      const playerResultEntry = event.results.find(r => r.playerId === playerId);
      const rebuysCount = playerResultEntry?.rebuys || 0;
      const prizeWon = playerResultEntry?.prize || 0;
      const costForEvent = buyInForEvent + (rebuysCount * rebuyPriceForEvent);
      const eventNetResult = prizeWon - costForEvent;

      // Mettre à jour/ajouter le résultat de l'événement
      if (summary.eventResults[event.id] !== undefined) { // Si l'event a déjà été traité (ex: joueur dans results et dans participants)
        summary.totalFinalResult -= summary.eventResults[event.id]!; // Soustraire l'ancien
        summary.lastCumulative -= summary.eventResults[event.id]!;
      }
      summary.eventResults[event.id] = eventNetResult;
      summary.totalFinalResult += eventNetResult;
      summary.lastCumulative += eventNetResult;

      // Mettre à jour la progression pour le graphique
      // S'assurer qu'un seul point est ajouté par événement pour ce joueur
      const progressPointIndex = summary.progress.findIndex(p => p.eventDate === event.date);
      if (progressPointIndex > -1) {
        summary.progress[progressPointIndex].eventFinalResult = eventNetResult; // Mettre à jour si déjà existant
        summary.progress[progressPointIndex].cumulativeFinalResult = summary.lastCumulative;
      } else {
        summary.progress.push({
          eventDate: event.date,
          eventName: event.name,
          eventFinalResult: eventNetResult,
          cumulativeFinalResult: summary.lastCumulative,
        });
      }
    }
  }

  const leaderboard: LeaderboardEntry[] = [];
  playerSeasonSummaries.forEach((summary, playerId) => {
    // Inclure uniquement les joueurs ayant participé à au moins un événement de la saison
    if (summary.eventsPlayed > 0) {
      const player = allPlayers.find((p) => p.id === playerId);
      leaderboard.push({
        playerId,
        playerName: getPlayerName(player),
        eventResults: summary.eventResults,
        totalFinalResult: summary.totalFinalResult,
      });
    }
  });

  leaderboard.sort((a, b) => b.totalFinalResult - a.totalFinalResult);
  
  const playerProgress: { [playerId: string]: PlayerProgressPoint[] } = {};
  playerSeasonSummaries.forEach((summary, playerId) => {
      if (summary.eventsPlayed > 0) { 
         playerProgress[playerId] = summary.progress.sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
      }
  });

  return { leaderboard, playerProgress, completedSeasonEvents };
}
