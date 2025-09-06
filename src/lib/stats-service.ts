

'use server';

import type { Season, Event, Player, PlayerStats, EventResult, HallOfFameStats, HofPlayerStat, HofEventStat } from './definitions';

// Modifiée pour inclure les résultats par événement
export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  isGuest: boolean;
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

function getPlayerDisplayName(player: Player | undefined): string {
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
}

export async function calculatePlayerOverallStats(
  playerId: string,
  allEvents: Event[],
  allPlayers: Player[],
  allSeasons: Season[],
): Promise<PlayerStats> {
  const player = allPlayers.find(p => p.id === playerId);
  const defaultStats: PlayerStats = {
    gamesPlayed: 0,
    wins: 0,
    winRate: 0,
    finalTables: 0,
    itmRate: 0,
    totalWinnings: 0,
    totalBuyIns: 0,
    bestPosition: null,
    averagePosition: null,
    seasonStats: {},
    profitEvolution: [],
  };

  if (!player) {
    return defaultStats;
  }

  let gamesPlayed = 0;
  let wins = 0;
  let finalTables = 0;
  let totalWinnings = 0;
  let totalBuyInsCalculated = 0; 
  const positions: number[] = [];
  const profitEvolution: { eventName: string, eventDate: string, cumulativeProfit: number }[] = [];
  const seasonStats: { [seasonId: string]: { seasonName: string, gamesPlayed: number, netProfit: number } } = {};
  let cumulativeProfit = 0;


  const completedEvents = allEvents
    .filter(event => event.status === 'completed')
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const event of completedEvents) {
    const participated = event.participants.includes(playerId);
    if (!participated) continue;

    gamesPlayed++;
    
    const mainBuyIn = event.buyIn || 0;
    const eventBountyValue = event.bounties || 0;
    const eventMysteryKoValue = event.mysteryKo || 0;
    const rebuyPrice = event.rebuyPrice || 0;
    const includeBountiesInNetCalc = event.includeBountiesInNet ?? true;
    
    let playerRebuysInEvent = 0;
    const playerResultEntry = event.results.find(r => r.playerId === playerId);

    const prizeWon = playerResultEntry?.prize || 0;
    const bountiesWon = playerResultEntry?.bountiesWon || 0;
    const mkoWon = playerResultEntry?.mysteryKoWon || 0;
    const totalEarningsThisEvent = prizeWon + bountiesWon + mkoWon;

    totalWinnings += totalEarningsThisEvent;

    if (playerResultEntry) {
      playerRebuysInEvent = playerResultEntry.rebuys || 0;
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
    
    // Investment calculation
    const investmentInMainPot = mainBuyIn + (playerRebuysInEvent * rebuyPrice);
    let netResultForEvent = 0;
    let totalInvestmentForEvent = investmentInMainPot;

    if (includeBountiesInNetCalc) {
        const bountyAndMkoCostsPerEntry = eventBountyValue + eventMysteryKoValue;
        const totalInvestmentInExtras = (1 + playerRebuysInEvent) * bountyAndMkoCostsPerEntry;
        totalInvestmentForEvent += totalInvestmentInExtras;
    }
    netResultForEvent = totalEarningsThisEvent - totalInvestmentForEvent;
    totalBuyInsCalculated += totalInvestmentForEvent;
    
    cumulativeProfit += netResultForEvent;

    profitEvolution.push({
      eventName: event.name,
      eventDate: event.date,
      cumulativeProfit: cumulativeProfit,
    });
    
    if (event.seasonId) {
        if (!seasonStats[event.seasonId]) {
            const season = allSeasons.find(s => s.id === event.seasonId);
            seasonStats[event.seasonId] = { seasonName: season?.name || 'Unknown Season', gamesPlayed: 0, netProfit: 0 };
        }
        seasonStats[event.seasonId].gamesPlayed += 1;
        seasonStats[event.seasonId].netProfit += netResultForEvent;
    }
  }

  const bestPosition = positions.length > 0 ? Math.min(...positions) : null;
  const averagePosition = positions.length > 0 ? positions.reduce((sum, p) => sum + p, 0) / positions.length : null;
  const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
  const itmRate = gamesPlayed > 0 ? (finalTables / gamesPlayed) * 100 : 0;


  return {
    gamesPlayed,
    wins,
    winRate,
    finalTables,
    itmRate,
    totalWinnings,
    totalBuyIns: totalBuyInsCalculated,
    bestPosition,
    averagePosition,
    seasonStats,
    profitEvolution,
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
  }> = new Map();

  // Initialize summaries for all players who participated in at least one event of the season.
  const allParticipantIdsInSeason = new Set<string>();
  completedSeasonEvents.forEach(event => {
    event.participants.forEach(pId => allParticipantIdsInSeason.add(pId));
  });

  allParticipantIdsInSeason.forEach(playerId => {
    playerSeasonSummaries.set(playerId, {
      eventResults: {},
      totalFinalResult: 0,
      eventsPlayed: 0,
      progress: [],
    });
  });

  // Iterate through each event to build up progress and totals
  for (const event of completedSeasonEvents) {
    for (const playerId of allParticipantIdsInSeason) {
      const summary = playerSeasonSummaries.get(playerId)!;
      let eventNetResult = 0;

      // Only calculate if the player participated
      if (event.participants.includes(playerId)) {
        summary.eventsPlayed++;

        const mainBuyInForEvent = event.buyIn || 0;
        const eventBountyValue = event.bounties || 0;
        const eventMysteryKoValue = event.mysteryKo || 0;
        const rebuyPriceForEvent = event.rebuyPrice || 0;
        const includeBountiesInNetCalc = event.includeBountiesInNet ?? true;

        const playerResultEntry = event.results.find(r => r.playerId === playerId);
        const rebuysCount = playerResultEntry?.rebuys || 0;
        const prizeWon = playerResultEntry?.prize || 0;
        const bountiesWon = playerResultEntry?.bountiesWon || 0;
        const mysteryKoWon = playerResultEntry?.mysteryKoWon || 0;
        
        const investmentInMainPot = mainBuyInForEvent + (rebuysCount * rebuyPriceForEvent);
        
        if (includeBountiesInNetCalc) {
          const bountyAndMkoCostsPerEntry = eventBountyValue + eventMysteryKoValue;
          const totalInvestmentInExtras = (1 + rebuysCount) * bountyAndMkoCostsPerEntry;
          const totalInvestment = investmentInMainPot + totalInvestmentInExtras;
          const totalWinnings = prizeWon + bountiesWon + mysteryKoWon;
          eventNetResult = totalWinnings - totalInvestment;
        } else {
          eventNetResult = prizeWon - investmentInMainPot;
        }
      }
      
      const previousTotal = summary.totalFinalResult;
      summary.totalFinalResult = previousTotal + eventNetResult;
      summary.eventResults[event.id] = eventNetResult;

      summary.progress.push({
        eventDate: event.date,
        eventName: event.name,
        eventFinalResult: eventNetResult,
        cumulativeFinalResult: summary.totalFinalResult,
      });
    }
  }

  const leaderboard: LeaderboardEntry[] = [];
  playerSeasonSummaries.forEach((summary, playerId) => {
    const player = allPlayers.find((p) => p.id === playerId);
    if (player) { // Ensure player exists before adding to leaderboard
        leaderboard.push({
            playerId,
            playerName: getPlayerDisplayName(player),
            isGuest: player.isGuest || false,
            eventResults: summary.eventResults,
            totalFinalResult: summary.totalFinalResult,
        });
    }
  });

  leaderboard.sort((a, b) => {
    if (a.isGuest !== b.isGuest) {
      return a.isGuest ? 1 : -1;
    }
    return b.totalFinalResult - a.totalFinalResult;
  });
  
  const playerProgress: { [playerId: string]: PlayerProgressPoint[] } = {};
  playerSeasonSummaries.forEach((summary, playerId) => {
      if (summary.eventsPlayed > 0) { 
         playerProgress[playerId] = summary.progress;
      }
  });

  return { leaderboard, playerProgress, completedSeasonEvents };
}

export async function calculateHallOfFameStats(
  allPlayers: Player[],
  allEvents: Event[]
): Promise<HallOfFameStats> {
  const completedEvents = allEvents.filter(e => e.status === 'completed');
  const nonGuestPlayers = allPlayers.filter(p => !p.isGuest);
  
  const totalPrizePools = completedEvents.reduce((sum, event) => sum + (event.prizePool.total || 0), 0);

  if (nonGuestPlayers.length === 0 || completedEvents.length === 0) {
    return { mostWins: null, mostPodiums: null, highestNet: null, lowestNet: null, mostGamesPlayed: null, mostSpent: null, biggestSingleWin: null, mostBountiesWon: null, mostConsistent: null, totalPrizePools };
  }
  
  const playerStatsMap = new Map<string, {
    wins: number;
    podiums: number;
    gamesPlayed: number;
    totalNet: number;
    totalSpent: number;
    biggestWin: { event: Event, value: number } | null;
    totalBountiesWon: number;
    positions: number[];
  }>();

  for (const player of nonGuestPlayers) {
    playerStatsMap.set(player.id, { wins: 0, podiums: 0, gamesPlayed: 0, totalNet: 0, totalSpent: 0, biggestWin: null, totalBountiesWon: 0, positions: [] });
  }

  for (const event of completedEvents) {
    for(const participantId of event.participants) {
      if(!playerStatsMap.has(participantId)) continue; // skip guests

      const stats = playerStatsMap.get(participantId)!;
      stats.gamesPlayed += 1;

      const result = event.results.find(r => r.playerId === participantId);

      const rebuys = result?.rebuys || 0;
      const prize = result?.prize || 0;
      const bountiesWon = result?.bountiesWon || 0;
      const mkoWon = result?.mysteryKoWon || 0;

      // Calculate total investment FOR SPENDING STATS (always includes everything)
      const investmentInMainPot = (event.buyIn || 0) + (rebuys * (event.rebuyPrice || 0));
      const bountyAndMkoCostsPerEntry = (event.bounties || 0) + (event.mysteryKo || 0);
      const totalInvestmentInExtras = (1 + rebuys) * bountyAndMkoCostsPerEntry;
      const totalInvestmentForSpending = investmentInMainPot + totalInvestmentInExtras;
      stats.totalSpent += totalInvestmentForSpending;
      stats.totalBountiesWon += bountiesWon;

      // Calculate net gain FOR RANKING STATS (respects the flag)
      const includeBountiesInNetCalc = event.includeBountiesInNet ?? true;
      let netGain;
      if (includeBountiesInNetCalc) {
          const totalWinnings = prize + bountiesWon + mkoWon;
          netGain = totalWinnings - totalInvestmentForSpending;
      } else {
          netGain = prize - investmentInMainPot;
      }
      
      if (!stats.biggestWin || netGain > stats.biggestWin.value) {
        stats.biggestWin = { event, value: netGain };
      }

      stats.totalNet += netGain;
      
      if(result) {
          stats.positions.push(result.position);
          if (result.position === 1) stats.wins += 1;
          if (result.position <= 3) stats.podiums += 1;
      }

      playerStatsMap.set(participantId, stats);
    }
  }

  let mostWins: HofPlayerStat | null = null;
  let mostPodiums: HofPlayerStat | null = null;
  let highestNet: HofPlayerStat | null = null;
  let lowestNet: HofPlayerStat | null = null;
  let mostGamesPlayed: HofPlayerStat | null = null;
  let mostSpent: HofPlayerStat | null = null;
  let biggestSingleWin: HofEventStat | null = null;
  let mostBountiesWon: HofPlayerStat | null = null;
  let mostConsistent: HofPlayerStat | null = null;

  for (const [playerId, stats] of playerStatsMap.entries()) {
    const player = nonGuestPlayers.find(p => p.id === playerId)!;

    if (!mostWins || stats.wins > mostWins.value) {
      mostWins = { player, value: stats.wins };
    }
    if (!mostPodiums || stats.podiums > mostPodiums.value) {
      mostPodiums = { player, value: stats.podiums };
    }
    if (!highestNet || stats.totalNet > highestNet.value) {
      highestNet = { player, value: stats.totalNet };
    }
    if (!lowestNet || stats.totalNet < lowestNet.value) {
      lowestNet = { player, value: stats.totalNet };
    }
    if (!mostGamesPlayed || stats.gamesPlayed > mostGamesPlayed.value) {
      mostGamesPlayed = { player, value: stats.gamesPlayed };
    }
    if (!mostSpent || stats.totalSpent > mostSpent.value) {
      mostSpent = { player, value: stats.totalSpent };
    }
    if (stats.biggestWin && (!biggestSingleWin || stats.biggestWin.value > biggestSingleWin.value)) {
      biggestSingleWin = { player, event: stats.biggestWin.event, value: stats.biggestWin.value };
    }
    if (!mostBountiesWon || stats.totalBountiesWon > mostBountiesWon.value) {
      mostBountiesWon = { player, value: stats.totalBountiesWon };
    }
    const MIN_GAMES_FOR_CONSISTENCY = 3;
    if (stats.positions.length > 0 && stats.gamesPlayed >= MIN_GAMES_FOR_CONSISTENCY) {
      const averagePosition = stats.positions.reduce((a, b) => a + b, 0) / stats.positions.length;
      if (!mostConsistent || averagePosition < mostConsistent.value) {
        mostConsistent = { player, value: averagePosition };
      }
    }
  }

  return {
    mostWins: mostWins && mostWins.value > 0 ? mostWins : null,
    mostPodiums: mostPodiums && mostPodiums.value > 0 ? mostPodiums : null,
    highestNet: highestNet && highestNet.value > 0 ? highestNet : null,
    lowestNet: lowestNet && lowestNet.value < 0 ? lowestNet : null,
    mostGamesPlayed: mostGamesPlayed && mostGamesPlayed.value > 0 ? mostGamesPlayed : null,
    mostSpent: mostSpent && mostSpent.value > 0 ? mostSpent : null,
    biggestSingleWin: biggestSingleWin && biggestSingleWin.value > 0 ? biggestSingleWin : null,
    mostBountiesWon: mostBountiesWon && mostBountiesWon.value > 0 ? mostBountiesWon : null,
    mostConsistent: mostConsistent,
    totalPrizePools,
  };
}

    

    

    
