export type TeamColor = 'red' | 'blue' | 'green' | 'black' | 'yellow' | 'purple' | 'orange';

export interface Player {
  id: string;
  name: string;
  nickname: string;
  phoneNumber?: string;
  avatarUrl?: string;
  preferredTeamId?: string;
  defaultTeam?: string; // e.g. 'TEA-OR' | 'KOPI-OR' | 'AGSA' | 'BLOOM' or 'สีแดง' etc.
  skillRating?: number; // 1-5
}

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  playerIds: string[];
}

export interface GoalEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId?: string;
  minute: number;
}

export interface Match {
  id: string;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
  durationMinutes: number; // default 6 or 7 mins
  goals: GoalEvent[];
  startedAt?: string;
  endedAt?: string;
  isBreak?: boolean;
  breakTitle?: string;
}

export interface Expense {
  id: string;
  title: string; // e.g., 'ค่าสนาม (20.00-22.00 น.)', 'ค่าน้ำเปล่า'
  category: 'field' | 'water' | 'equipment' | 'other';
  amount: number;
  note?: string;
}

export interface PlayerPayment {
  playerId: string;
  amountDue: number;
  amountPaid: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: 'promptpay' | 'cash' | 'transfer';
  slipUrl?: string;
  isVerified?: boolean;
}

export interface FootballSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "บอลพฤหัสบดี 13 ส.ค. 2026"
  timeRange: string; // "20:00 - 22:00"
  location: string; // e.g. "สนามหญ้าเทียม Green Turf Arena"
  matchDurationMinutes: number; // default 7
  fieldCost: number; // default 1800
  waterCost: number; // default 120
  otherCost: number; // default 0
  feePerPlayer: number; // e.g. 100 THB
  isAutoFee: boolean; // auto-calculate fieldCost / activePlayers
  maxPlayersPerTeam?: number; // max 7 players per team constraint
  status: 'upcoming' | 'in_progress' | 'completed';
  teams: Team[];
  matches: Match[];
  expenses: Expense[];
  payments: PlayerPayment[];
  attendingPlayerIds: string[];
  winningTeamId?: string;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  color: TeamColor;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface PlayerStats {
  playerId: string;
  name: string;
  nickname: string;
  matchesPlayed: number;
  goals: number;
  wins: number;
  sessionsAttended: number;
  totalPaid: number;
}

export interface MonthlySummary {
  yearMonth: string; // "2026-08"
  sessionsCount: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  championTeamName?: string;
  topScorerPlayer?: { name: string; nickname: string; goals: number };
  mostWinsPlayer?: { name: string; nickname: string; wins: number };
}
