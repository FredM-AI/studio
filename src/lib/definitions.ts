export type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  finalTables: number;
  totalWinnings: number;
  totalBuyIns: number;
  bestPosition: number | null;
  averagePosition: number | null;
};

export type Player = {
  id: string; // UUID
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string; // Should be unique
  phone?: string;
  avatar?: string; // URL or path to image
  stats: PlayerStats;
  isActive: boolean; // Default true
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
};

export type PrizeDistribution = {
  position: number;
  amount: number;
  percentage: number;
};

export type EventResult = {
  playerId: string;
  position: number;
  prize: number;
  eliminatedBy?: string; // Player ID or null
};

export type EventStatus = "draft" | "active" | "completed" | "cancelled";

export type Event = {
  id: string; // UUID
  name: string;
  date: string; // ISO Date string
  buyIn: number;
  rebuyAllowed: boolean;
  rebuyPrice?: number;
  maxPlayers: number;
  status: EventStatus;
  seasonId?: string;
  prizePool: {
    total: number;
    distributionType: "automatic" | "custom";
    distribution: PrizeDistribution[]; // Only if custom
  };
  participants: string[]; // Array of Player IDs
  results: EventResult[]; // Only if completed
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
};

export type SeasonLeaderboardEntry = {
  playerId: string;
  points: number;
  gamesPlayed: number;
};

export type Season = {
  id: string; // UUID
  name: string;
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
  isActive: boolean;
  leaderboard: SeasonLeaderboardEntry[];
};

export type AppSettings = {
  theme: "light" | "dark";
  defaultBuyIn: number;
  defaultMaxPlayers: number;
  // Potentially other app-wide settings
};
