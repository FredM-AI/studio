
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
  lastName:string;
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
  rebuys?: number;
  eliminatedBy?: string; // Player ID or null
  bountiesWon?: number;
  mysteryKoWon?: number;
};

export type EventStatus = "draft" | "active" | "completed" | "cancelled";
export const eventStatuses: EventStatus[] = ["draft", "active", "completed", "cancelled"];


export type Event = {
  id: string; // UUID
  name: string;
  date: string; // ISO Date string
  buyIn: number;
  rebuyPrice?: number;
  bounties?: number; // Value of a single bounty for the event
  mysteryKo?: number; // Value of a single mystery KO for the event
  maxPlayers?: number; // Made optional
  status: EventStatus;
  seasonId?: string | null; // Changed to allow null for no season
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
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
};

export type AppSettings = {
  theme: "light" | "dark";
  defaultBuyIn: number;
  defaultMaxPlayers: number;
  // Potentially other app-wide settings
};

// This type is specifically for form state in actions.ts
export type EventFormState = {
  errors?: {
    id?: string[];
    name?: string[];
    date?: string[];
    buyIn?: string[];
    rebuyPrice?: string[];
    bounties?: string[];
    mysteryKo?: string[];
    maxPlayers?: string[];
    prizePoolTotal?: string[];
    participantIds?: string[];
    status?: string[];
    seasonId?: string[]; // Added seasonId for form errors
    results?: string[];
    resultsJson?: string[];
    _form?: string[];
  };
  message?: string | null;
};

// Helper type for EventForm to manage results input
export type EventResultInput = {
  playerId: string;
  playerName: string;
  position: string;
  prize: string;
  rebuys: string;
  bountiesWon: string;
  mysteryKoWon: string;
};

// Type for EventForm to use in useActionState
export type ServerEventFormState = EventFormState;


export type PlayerFormState = {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phone?: string[];
    avatar?: string[];
    _form?: string[];
  };
  message?: string | null;
};

export type SeasonFormState = {
  errors?: {
    name?: string[];
    startDate?: string[];
    endDate?: string[];
    isActive?: string[];
    eventIdsToAssociate?: string[];
    _form?: string[];
  };
  message?: string | null;
};

export type LoginFormState = {
  errors?: {
    username?: string[];
    password?: string[];
    _form?: string[];
  };
  message?: string | null;
};
