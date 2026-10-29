import { INITIAL_PLAYERS, INITIAL_SESSIONS } from '../data/mockData';
import { FootballSession, Match, MonthlySummary, Player, PlayerStats, Team, TeamStats } from '../types';

const STORAGE_KEY_PLAYERS = 'thursday_turf_players_v4';
const STORAGE_KEY_SESSIONS = 'thursday_turf_sessions_v4';
const STORAGE_KEY_CURRENT_SESSION_ID = 'thursday_turf_current_session_id_v4';

// Cleanup old mock data keys on startup
try {
  localStorage.removeItem('thursday_turf_players');
  localStorage.removeItem('thursday_turf_sessions');
  localStorage.removeItem('thursday_turf_players_v2');
  localStorage.removeItem('thursday_turf_sessions_v2');
  localStorage.removeItem('thursday_turf_players_v3');
  localStorage.removeItem('thursday_turf_sessions_v3');
} catch (e) {
  // Ignore
}

export function getStoredPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored players', e);
  }
  saveStoredPlayers(INITIAL_PLAYERS);
  return INITIAL_PLAYERS;
}

export function saveStoredPlayers(players: Player[]): void {
  localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
}

export function getStoredSessions(): FootballSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored sessions', e);
  }
  saveStoredSessions(INITIAL_SESSIONS);
  return INITIAL_SESSIONS;
}

export function saveStoredSessions(sessions: FootballSession[]): void {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
}

export function getActiveSessionId(sessions: FootballSession[]): string {
  const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION_ID);
  if (savedId && sessions.some(s => s.id === savedId)) {
    return savedId;
  }
  return sessions[0]?.id || '';
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(STORAGE_KEY_CURRENT_SESSION_ID, id);
}

export function resetToDefaults(): { players: Player[]; sessions: FootballSession[] } {
  localStorage.removeItem(STORAGE_KEY_PLAYERS);
  localStorage.removeItem(STORAGE_KEY_SESSIONS);
  localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION_ID);
  saveStoredPlayers(INITIAL_PLAYERS);
  saveStoredSessions(INITIAL_SESSIONS);
  return { players: INITIAL_PLAYERS, sessions: INITIAL_SESSIONS };
}


// Helper calculation functions
export function calculateTeamStats(session: FootballSession): TeamStats[] {
  const statsMap = new Map<string, TeamStats>();

  session.teams.forEach(team => {
    statsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      color: team.color,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  });

  session.matches.forEach(m => {
    if (m.isBreak || m.status !== 'finished' || m.homeScore === null || m.awayScore === null) return;

    const homeStats = statsMap.get(m.homeTeamId);
    const awayStats = statsMap.get(m.awayTeamId);

    if (homeStats) {
      homeStats.played += 1;
      homeStats.goalsFor += m.homeScore;
      homeStats.goalsAgainst += m.awayScore;
      if (m.homeScore > m.awayScore) {
        homeStats.won += 1;
        homeStats.points += 3;
      } else if (m.homeScore === m.awayScore) {
        homeStats.drawn += 1;
        homeStats.points += 1;
      } else {
        homeStats.lost += 1;
      }
      homeStats.goalDiff = homeStats.goalsFor - homeStats.goalsAgainst;
    }

    if (awayStats) {
      awayStats.played += 1;
      awayStats.goalsFor += m.awayScore;
      awayStats.goalsAgainst += m.homeScore;
      if (m.awayScore > m.homeScore) {
        awayStats.won += 1;
        awayStats.points += 3;
      } else if (m.awayScore === m.homeScore) {
        awayStats.drawn += 1;
        awayStats.points += 1;
      } else {
        awayStats.lost += 1;
      }
      awayStats.goalDiff = awayStats.goalsFor - awayStats.goalsAgainst;
    }
  });

  return Array.from(statsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

export function calculatePlayerStats(players: Player[], sessions: FootballSession[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>();

  players.forEach(p => {
    map.set(p.id, {
      playerId: p.id,
      name: p.name,
      nickname: p.nickname,
      matchesPlayed: 0,
      goals: 0,
      wins: 0,
      sessionsAttended: 0,
      totalPaid: 0,
    });
  });

  sessions.forEach(sess => {
    sess.attendingPlayerIds.forEach(pid => {
      const p = map.get(pid);
      if (p) p.sessionsAttended += 1;
    });

    sess.payments?.forEach(pm => {
      const p = map.get(pm.playerId);
      if (p) p.totalPaid += pm.amountPaid;
    });

    sess.matches.forEach(m => {
      if (m.isBreak || m.status !== 'finished' || m.homeScore === null || m.awayScore === null) return;

      const homeTeam = sess.teams.find(t => t.id === m.homeTeamId);
      const awayTeam = sess.teams.find(t => t.id === m.awayTeamId);

      const homePlayers = homeTeam?.playerIds || [];
      const awayPlayers = awayTeam?.playerIds || [];

      // Add match count
      [...homePlayers, ...awayPlayers].forEach(pid => {
        const stat = map.get(pid);
        if (stat) stat.matchesPlayed += 1;
      });

      // Wins
      if (m.homeScore > m.awayScore) {
        homePlayers.forEach(pid => {
          const stat = map.get(pid);
          if (stat) stat.wins += 1;
        });
      } else if (m.awayScore > m.homeScore) {
        awayPlayers.forEach(pid => {
          const stat = map.get(pid);
          if (stat) stat.wins += 1;
        });
      }

      // Goals
      m.goals?.forEach(g => {
        if (g.playerId) {
          const stat = map.get(g.playerId);
          if (stat) stat.goals += 1;
        }
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => b.goals - a.goals || b.wins - a.wins);
}

export function calculateMonthlySummary(sessions: FootballSession[], players: Player[], targetYearMonth: string): MonthlySummary {
  const filtered = sessions.filter(s => s.date.startsWith(targetYearMonth));

  let totalIncome = 0;
  let totalExpenses = 0;

  const playerGoals = new Map<string, number>();
  const playerWins = new Map<string, number>();

  filtered.forEach(sess => {
    // Financials
    const collected = sess.payments?.reduce((sum, p) => sum + (p.amountPaid || 0), 0) || 0;
    totalIncome += collected;

    const expTotal = (sess.fieldCost || 0) + (sess.waterCost || 0) + (sess.otherCost || 0);
    totalExpenses += expTotal;

    // Matches
    sess.matches.forEach(m => {
      if (m.isBreak || m.status !== 'finished') return;

      m.goals?.forEach(g => {
        if (g.playerId) {
          playerGoals.set(g.playerId, (playerGoals.get(g.playerId) || 0) + 1);
        }
      });

      if (m.homeScore !== null && m.awayScore !== null) {
        const homeTeam = sess.teams.find(t => t.id === m.homeTeamId);
        const awayTeam = sess.teams.find(t => t.id === m.awayTeamId);

        if (m.homeScore > m.awayScore && homeTeam) {
          homeTeam.playerIds.forEach(pid => playerWins.set(pid, (playerWins.get(pid) || 0) + 1));
        } else if (m.awayScore > m.homeScore && awayTeam) {
          awayTeam.playerIds.forEach(pid => playerWins.set(pid, (playerWins.get(pid) || 0) + 1));
        }
      }
    });
  });

  // Find Top Scorer
  let topScorerPlayer: MonthlySummary['topScorerPlayer'];
  let maxGoals = 0;
  playerGoals.forEach((goals, pid) => {
    if (goals > maxGoals) {
      maxGoals = goals;
      const p = players.find(x => x.id === pid);
      if (p) {
        topScorerPlayer = { name: p.name, nickname: p.nickname, goals };
      }
    }
  });

  // Find Most Wins
  let mostWinsPlayer: MonthlySummary['mostWinsPlayer'];
  let maxWins = 0;
  playerWins.forEach((wins, pid) => {
    if (wins > maxWins) {
      maxWins = wins;
      const p = players.find(x => x.id === pid);
      if (p) {
        mostWinsPlayer = { name: p.name, nickname: p.nickname, wins };
      }
    }
  });

  return {
    yearMonth: targetYearMonth,
    sessionsCount: filtered.length,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    topScorerPlayer,
    mostWinsPlayer,
  };
}

// Global constraint solver to eliminate consecutive back-to-back matches and maximize rest
export function solveOptimalMatchSequence<
  T extends { homeTeamId: string; awayTeamId: string; isBreak?: boolean }
>(
  fixtures: T[],
  teams: Team[],
  initialFinished: T[] = []
): T[] {
  if (fixtures.length <= 1) return fixtures;

  const teamIds = teams.map(t => t.id);
  const n = teams.length;

  let bestOrder: T[] = [];
  let minB2B = Infinity;
  let maxMinRest = -Infinity;
  let iterations = 0;
  const maxIterations = 30000;

  function evaluate(order: T[]) {
    let b2b = 0;
    let minRestFound = Infinity;
    const lastPlayed: Record<string, number> = {};
    teamIds.forEach(id => (lastPlayed[id] = -999));

    // Account for initial finished matches
    initialFinished.forEach((m, idx) => {
      if (!m.isBreak && m.homeTeamId && m.awayTeamId) {
        lastPlayed[m.homeTeamId] = idx;
        lastPlayed[m.awayTeamId] = idx;
      }
    });

    const offset = initialFinished.length;
    for (let i = 0; i < order.length; i++) {
      const m = order[i];
      if (m.isBreak) continue;

      const currIdx = offset + i;
      const prev = i > 0 ? order[i - 1] : initialFinished[initialFinished.length - 1];

      if (prev && !prev.isBreak) {
        if (
          m.homeTeamId === prev.homeTeamId ||
          m.homeTeamId === prev.awayTeamId ||
          m.awayTeamId === prev.homeTeamId ||
          m.awayTeamId === prev.awayTeamId
        ) {
          b2b++;
        }
      }

      const restH = currIdx - 1 - (lastPlayed[m.homeTeamId] ?? -999);
      const restA = currIdx - 1 - (lastPlayed[m.awayTeamId] ?? -999);
      const rest = Math.min(restH, restA);
      if (rest < minRestFound) minRestFound = rest;

      lastPlayed[m.homeTeamId] = currIdx;
      lastPlayed[m.awayTeamId] = currIdx;
    }

    return { b2b, minRestFound };
  }

  function search(
    remaining: T[],
    current: T[],
    currentB2B: number,
    lastPlayed: Record<string, number>
  ) {
    iterations++;
    if (iterations > maxIterations) return;

    if (remaining.length === 0) {
      const ev = evaluate(current);
      if (ev.b2b < minB2B || (ev.b2b === minB2B && ev.minRestFound > maxMinRest)) {
        minB2B = ev.b2b;
        maxMinRest = ev.minRestFound;
        bestOrder = [...current];
      }
      return;
    }

    if (currentB2B >= minB2B) return; // Prune worse paths

    const prev = current.length > 0 ? current[current.length - 1] : initialFinished[initialFinished.length - 1];
    const currIdx = initialFinished.length + current.length;

    // Partition candidates into non-b2b and b2b
    const nonB2B: { cand: T; idx: number }[] = [];
    const b2bList: { cand: T; idx: number }[] = [];

    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      if (cand.isBreak) {
        nonB2B.push({ cand, idx: i });
        continue;
      }

      const isConflict =
        prev &&
        !prev.isBreak &&
        (cand.homeTeamId === prev.homeTeamId ||
          cand.homeTeamId === prev.awayTeamId ||
          cand.awayTeamId === prev.homeTeamId ||
          cand.awayTeamId === prev.awayTeamId);

      if (isConflict) {
        b2bList.push({ cand, idx: i });
      } else {
        nonB2B.push({ cand, idx: i });
      }
    }

    const sortByRest = (list: { cand: T; idx: number }[]) => {
      list.sort((a, b) => {
        if (a.cand.isBreak) return -1;
        if (b.cand.isBreak) return 1;
        const restA = Math.min(
          currIdx - (lastPlayed[a.cand.homeTeamId] ?? -999),
          currIdx - (lastPlayed[a.cand.awayTeamId] ?? -999)
        );
        const restB = Math.min(
          currIdx - (lastPlayed[b.cand.homeTeamId] ?? -999),
          currIdx - (lastPlayed[b.cand.awayTeamId] ?? -999)
        );
        return restB - restA; // Prefer longest rest
      });
    };

    sortByRest(nonB2B);
    sortByRest(b2bList);

    const candidates = nonB2B.length > 0 ? nonB2B : b2bList;

    const seen = new Set<string>();
    for (const { cand, idx } of candidates) {
      const key = cand.isBreak
        ? `break_${idx}`
        : `${cand.homeTeamId}_${cand.awayTeamId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const isConflict =
        prev &&
        !prev.isBreak &&
        !cand.isBreak &&
        (cand.homeTeamId === prev.homeTeamId ||
          cand.homeTeamId === prev.awayTeamId ||
          cand.awayTeamId === prev.homeTeamId ||
          cand.awayTeamId === prev.awayTeamId);

      const nextB2B = currentB2B + (isConflict ? 1 : 0);
      const nextRemaining = [...remaining.slice(0, idx), ...remaining.slice(idx + 1)];
      const nextLastPlayed = cand.isBreak
        ? lastPlayed
        : {
            ...lastPlayed,
            [cand.homeTeamId]: currIdx,
            [cand.awayTeamId]: currIdx,
          };

      search(nextRemaining, [...current, cand], nextB2B, nextLastPlayed);

      // Early stop if theoretical optimum reached
      if (n >= 5 && minB2B === 0) return;
      if (n === 4 && minB2B <= 2) return;
      if (n === 3 && minB2B <= Math.ceil(fixtures.length / 3)) return;
    }
  }

  const initialLastPlayed: Record<string, number> = {};
  teamIds.forEach(id => (initialLastPlayed[id] = -999));
  initialFinished.forEach((m, idx) => {
    if (!m.isBreak && m.homeTeamId && m.awayTeamId) {
      initialLastPlayed[m.homeTeamId] = idx;
      initialLastPlayed[m.awayTeamId] = idx;
    }
  });

  search(fixtures, [], 0, initialLastPlayed);

  return bestOrder.length > 0 ? bestOrder : fixtures;
}

// Optimize match fixtures order to space out matches and eliminate back-to-back games
export function optimizeMatchOrder(matches: Match[], teams: Team[]): Match[] {
  if (!matches || matches.length <= 1) return matches;

  // Keep finished matches in their original position/order
  const finishedMatches = matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => a.matchNumber - b.matchNumber);
  const unplayedMatches = matches.filter(m => m.status !== 'finished');

  if (unplayedMatches.length <= 1) return matches;

  const optimizedUnplayed = solveOptimalMatchSequence(unplayedMatches, teams, finishedMatches);
  const scheduled = [...finishedMatches, ...optimizedUnplayed];

  // Renumber sequentially
  return scheduled.map((m, idx) => ({
    ...m,
    matchNumber: idx + 1,
  }));
}

// Generate round-robin match fixtures with smart spacing to avoid consecutive back-to-back games
export function generateRoundRobinMatches(
  teams: Team[],
  durationMinutes: number = 7,
  loops: number = 1,
  insertBreaks: boolean = false,
  breakDurationMinutes: number = 5
): Match[] {
  const n = teams.length;
  if (n < 2) return [];

  // Generate base pairs
  const basePairs: [string, string][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      basePairs.push([teams[i].id, teams[j].id]);
    }
  }

  const numLoops = Math.max(1, loops);
  const rawFixtures: { homeTeamId: string; awayTeamId: string }[] = [];

  for (let l = 0; l < numLoops; l++) {
    basePairs.forEach(([t1, t2]) => {
      rawFixtures.push({
        homeTeamId: l % 2 === 0 ? t1 : t2,
        awayTeamId: l % 2 === 0 ? t2 : t1,
      });
    });
  }

  // Solve globally optimal fixture order to minimize/eliminate back-to-backs
  const solved = solveOptimalMatchSequence(rawFixtures, teams);

  let scheduled: {
    homeTeamId: string;
    awayTeamId: string;
    durationMinutes: number;
    isBreak?: boolean;
    breakTitle?: string;
  }[] = [];

  if (insertBreaks) {
    // For 4 teams, 2 matches per round. For other team counts, ceil(n/2) matches per round
    const matchesPerRound = n === 4 ? 2 : Math.max(2, Math.floor(n / 2));
    solved.forEach((m, idx) => {
      scheduled.push({ ...m, durationMinutes });
      // Insert a break slot between rounds (except after the final match)
      if ((idx + 1) % matchesPerRound === 0 && idx < solved.length - 1) {
        const roundNum = Math.floor((idx + 1) / matchesPerRound);
        scheduled.push({
          homeTeamId: '',
          awayTeamId: '',
          durationMinutes: breakDurationMinutes,
          isBreak: true,
          breakTitle: `พักเบรกครึ่งรอบที่ ${roundNum} (${breakDurationMinutes} นาที)`,
        });
      }
    });
  } else {
    scheduled = solved.map(m => ({ ...m, durationMinutes }));
  }

  return scheduled.map((p, idx) => ({
    id: `m_gen_${Date.now()}_${idx + 1}`,
    matchNumber: idx + 1,
    homeTeamId: p.homeTeamId,
    awayTeamId: p.awayTeamId,
    homeScore: null,
    awayScore: null,
    status: idx === 0 ? 'live' : 'scheduled',
    durationMinutes: p.durationMinutes,
    goals: [],
    isBreak: p.isBreak,
    breakTitle: p.breakTitle,
  }));
}
