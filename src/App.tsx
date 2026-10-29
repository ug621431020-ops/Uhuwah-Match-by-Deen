import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ScheduleTab } from './components/ScheduleTab';
import { StandingsTab } from './components/StandingsTab';
import { FinanceTab } from './components/FinanceTab';
import { MonthlyTab } from './components/MonthlyTab';
import { PlayersTab } from './components/PlayersTab';
import { ShareSummaryModal } from './components/ShareSummaryModal';
import { EditSessionModal } from './components/EditSessionModal';
import { NewSessionModal } from './components/NewSessionModal';
import { PaymentModal } from './components/PaymentModal';

import { FootballSession, Match, Player, PlayerPayment, Expense, Team, TeamColor } from './types';
import { AdminTeamManagerModal } from './components/AdminTeamManagerModal';
import {
  getStoredPlayers,
  getStoredSessions,
  saveStoredPlayers,
  saveStoredSessions,
  getActiveSessionId,
  setActiveSessionId,
  generateRoundRobinMatches,
  optimizeMatchOrder,
  resetToDefaults,
} from './services/storage';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessions, setSessions] = useState<FootballSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string>('');
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const actionParam = params.get('action');
      const viewParam = params.get('view');
      if (
        tabParam === 'players' ||
        actionParam === 'add_player' ||
        viewParam === 'all_roster'
      ) {
        return 'players';
      }
      if (
        tabParam === 'schedule' ||
        tabParam === 'standings' ||
        tabParam === 'finance' ||
        tabParam === 'monthly'
      ) {
        return tabParam as NavTab;
      }
    }
    return 'schedule';
  });

  // Admin & Modals State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem('futsal_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const handleAdminLogin = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem('futsal_admin_logged_in', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('futsal_admin_logged_in');
    } catch (e) {
      console.error(e);
    }
  };

  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState<boolean>(false);
  const [sessionToEdit, setSessionToEdit] = useState<FootballSession | null>(null);
  const [showNewSessionModal, setShowNewSessionModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showTeamManagerModal, setShowTeamManagerModal] = useState<boolean>(false);
  const [paymentModalPlayerId, setPaymentModalPlayerId] = useState<string | undefined>(undefined);

  const handleOpenEditSessionModal = (targetSession?: FootballSession) => {
    setSessionToEdit(targetSession || activeSession);
    setShowEditSessionModal(true);
  };

  const handleOpenPaymentModal = (playerId?: string) => {
    setPaymentModalPlayerId(playerId);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (
    playerId: string,
    slipUrl?: string,
    amount?: number,
    paymentMethod?: 'promptpay' | 'cash' | 'transfer'
  ) => {
    if (!activeSession) return;
    const fee = amount !== undefined ? amount : (activeSession.feePerPlayer || 100);
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const method = paymentMethod || 'promptpay';

    const updatedPayments = (activeSession.payments || []).map(p => {
      if (p.playerId === playerId) {
        return {
          ...p,
          isPaid: true,
          amountPaid: fee,
          paidAt: p.paidAt || nowTime,
          paymentMethod: method,
          slipUrl: slipUrl !== undefined ? slipUrl : p.slipUrl,
        };
      }
      return p;
    });

    if (!updatedPayments.some(p => p.playerId === playerId)) {
      updatedPayments.push({
        playerId,
        amountDue: fee,
        amountPaid: fee,
        isPaid: true,
        paidAt: nowTime,
        paymentMethod: method,
        slipUrl: slipUrl,
      });
    }

    updateActiveSession({
      ...activeSession,
      payments: updatedPayments,
    });
  };

  const handleUnmarkPayment = (playerId: string) => {
    if (!activeSession) return;
    const updatedPayments = (activeSession.payments || []).map(p => {
      if (p.playerId === playerId) {
        return {
          ...p,
          isPaid: false,
          amountPaid: 0,
          paidAt: undefined,
          slipUrl: undefined,
        };
      }
      return p;
    });

    updateActiveSession({
      ...activeSession,
      payments: updatedPayments,
    });
  };

  // Initialize data from localStorage on mount
  useEffect(() => {
    const loadedPlayers = getStoredPlayers();
    const loadedSessions = getStoredSessions();
    const currentId = getActiveSessionId(loadedSessions);

    setPlayers(loadedPlayers);
    setSessions(loadedSessions);
    setActiveSessionIdState(currentId);
  }, []);

  // Save changes to localStorage
  const updatePlayersState = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    saveStoredPlayers(newPlayers);
  };

  const updateSessionsState = (newSessions: FootballSession[]) => {
    setSessions(newSessions);
    saveStoredSessions(newSessions);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  // Active Session helper updater supporting functional updates to prevent stale closures
  const updateActiveSession = (
    updater: FootballSession | ((prev: FootballSession) => FootballSession)
  ) => {
    setSessions(prevSessions => {
      const currentActive =
        prevSessions.find(s => s.id === activeSessionId) || prevSessions[0];
      if (!currentActive) return prevSessions;
      const updated = typeof updater === 'function' ? updater(currentActive) : updater;
      const newSessions = prevSessions.map(s => (s.id === updated.id ? updated : s));
      saveStoredSessions(newSessions);
      return newSessions;
    });
  };

  // Delete Weekly Session Handler
  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) {
      alert('ต้องมีรายการแข่งขันอย่างน้อย 1 รายการ');
      return;
    }

    const remainingSessions = sessions.filter(s => s.id !== sessionId);
    updateSessionsState(remainingSessions);

    // If the deleted session was the active session, switch to the first remaining session
    if (activeSessionId === sessionId) {
      const nextActiveId = remainingSessions[0].id;
      setActiveSessionIdState(nextActiveId);
      setActiveSessionId(nextActiveId);
    }
  };

  // Match Update Handler
  const handleUpdateMatch = (updatedMatch: Match) => {
    updateActiveSession(prevSession => {
      const updatedMatches = prevSession.matches.map(m =>
        m.id === updatedMatch.id ? updatedMatch : m
      );
      // Sort matches by matchNumber so renumbering or order changes are reflected
      updatedMatches.sort((a, b) => a.matchNumber - b.matchNumber);
      return {
        ...prevSession,
        matches: updatedMatches,
      };
    });
  };

  // Optimize Match Fixtures Order to Space Out Teams & Avoid Back-to-Back Matches
  const handleOptimizeMatches = () => {
    updateActiveSession(prevSession => {
      const optimized = optimizeMatchOrder(prevSession.matches, prevSession.teams);
      return {
        ...prevSession,
        matches: optimized,
      };
    });
  };

  // Reorder / Move Match Up or Down
  const handleMoveMatch = (matchId: string, direction: 'up' | 'down') => {
    if (!activeSession) return;
    const matches = [...activeSession.matches].sort((a, b) => a.matchNumber - b.matchNumber);
    const index = matches.findIndex(m => m.id === matchId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === matches.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = matches[index];
    matches[index] = matches[targetIndex];
    matches[targetIndex] = temp;

    // Renumber all matches sequentially
    const renumbered = matches.map((m, idx) => ({
      ...m,
      matchNumber: idx + 1,
    }));

    updateActiveSession({
      ...activeSession,
      matches: renumbered,
    });
  };

  // Auto Generate Round Robin Matches with optimal spacing & break support
  const handleGenerateMatches = (
    durationMinutes: number = 7,
    loops: number = 1,
    insertBreaks: boolean = false,
    breakDurationMinutes: number = 5
  ) => {
    if (!activeSession) return;
    const generated = generateRoundRobinMatches(
      activeSession.teams,
      durationMinutes,
      loops,
      insertBreaks,
      breakDurationMinutes
    );
    updateActiveSession({
      ...activeSession,
      matchDurationMinutes: durationMinutes,
      matches: generated,
    });
  };

  // Add Rest Break Slot (e.g. 5 mins break between rounds)
  const handleAddBreakMatch = (durationMinutes: number = 5, title?: string) => {
    if (!activeSession) return;
    const count = activeSession.matches.length + 1;
    const newBreak: Match = {
      id: `m_break_${Date.now()}`,
      matchNumber: count,
      homeTeamId: '',
      awayTeamId: '',
      homeScore: null,
      awayScore: null,
      status: 'scheduled',
      durationMinutes,
      goals: [],
      isBreak: true,
      breakTitle: title || `พักเบรก (${durationMinutes} นาที)`,
    };
    updateActiveSession({
      ...activeSession,
      matches: [...activeSession.matches, newBreak],
    });
  };

  // Add Custom Match with optional status and scores
  const handleAddMatch = (
    homeTeamId: string,
    awayTeamId: string,
    durationMinutes?: number,
    status?: 'scheduled' | 'live' | 'finished',
    homeScore?: number | null,
    awayScore?: number | null
  ) => {
    if (!activeSession) return;
    const count = activeSession.matches.length + 1;
    const newMatch: Match = {
      id: `m_custom_${Date.now()}`,
      matchNumber: count,
      homeTeamId,
      awayTeamId,
      homeScore: homeScore !== undefined ? homeScore : null,
      awayScore: awayScore !== undefined ? awayScore : null,
      status: status || 'scheduled',
      durationMinutes: durationMinutes || activeSession.matchDurationMinutes || 7,
      goals: [],
    };
    updateActiveSession({
      ...activeSession,
      matches: [...activeSession.matches, newMatch],
    });
  };

  // Delete Match with renumbering
  const handleDeleteMatch = (matchId: string) => {
    if (!activeSession) return;
    const filtered = activeSession.matches.filter(m => m.id !== matchId);
    // Renumber remaining matches
    const renumbered = filtered.map((m, idx) => ({
      ...m,
      matchNumber: idx + 1,
    }));
    updateActiveSession({
      ...activeSession,
      matches: renumbered,
    });
  };

  // Clear All Matches
  const handleClearAllMatches = () => {
    if (!activeSession) return;
    updateActiveSession({
      ...activeSession,
      matches: [],
    });
  };

  // Admin Team Management Handlers
  const handleAddTeam = (teamData: { name: string; color: TeamColor }) => {
    if (!activeSession) return;
    const newTeam: Team = {
      id: `t_${Date.now()}`,
      name: teamData.name,
      color: teamData.color,
      playerIds: [],
    };
    updateActiveSession({
      ...activeSession,
      teams: [...activeSession.teams, newTeam],
    });
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    if (!activeSession) return;
    const updatedTeams = activeSession.teams.map(t => (t.id === updatedTeam.id ? updatedTeam : t));
    updateActiveSession({
      ...activeSession,
      teams: updatedTeams,
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!activeSession) return;
    const updatedTeams = activeSession.teams.filter(t => t.id !== teamId);
    // Also remove matches involving this deleted team and renumber remaining matches
    const updatedMatches = activeSession.matches
      .filter(m => m.homeTeamId !== teamId && m.awayTeamId !== teamId)
      .map((m, idx) => ({ ...m, matchNumber: idx + 1 }));

    updateActiveSession({
      ...activeSession,
      teams: updatedTeams,
      matches: updatedMatches,
    });
  };

  // Finance updates
  const handleUpdatePayments = (payments: PlayerPayment[]) => {
    if (!activeSession) return;
    updateActiveSession({
      ...activeSession,
      payments,
    });
  };

  const handleUpdateSessionCosts = (
    fieldCost: number,
    waterCost: number,
    otherCost: number,
    feePerPlayer: number
  ) => {
    if (!activeSession) return;
    const updatedPayments = (activeSession.payments || []).map(p => ({
      ...p,
      amountDue: feePerPlayer,
    }));

    updateActiveSession({
      ...activeSession,
      fieldCost,
      waterCost,
      otherCost,
      feePerPlayer,
      payments: updatedPayments,
    });
  };

  const handleAddExpense = (newExpense: Expense) => {
    if (!activeSession) return;
    updateActiveSession({
      ...activeSession,
      expenses: [...(activeSession.expenses || []), newExpense],
    });
  };

  // Player roster handlers
  const handleAddPlayer = (p: Omit<Player, 'id'>) => {
    const newP: Player = { ...p, id: `p_${Date.now()}` };
    const newPlayers = [...players, newP];
    updatePlayersState(newPlayers);

    // Also add to active session payments if exists
    if (activeSession) {
      const newPayment: PlayerPayment = {
        playerId: newP.id,
        amountDue: activeSession.feePerPlayer || 100,
        amountPaid: 0,
        isPaid: false,
      };
      updateActiveSession({
        ...activeSession,
        attendingPlayerIds: [...activeSession.attendingPlayerIds, newP.id],
        payments: [...(activeSession.payments || []), newPayment],
      });
    }
  };

  const handleUpdatePlayer = (updatedP: Player) => {
    const updated = players.map(p => (p.id === updatedP.id ? updatedP : p));
    updatePlayersState(updated);
  };

  const handleDeletePlayer = (id: string) => {
    const updated = players.filter(p => p.id !== id);
    updatePlayersState(updated);
  };

  // Weekly attendance toggle handler
  const handleToggleAttendance = (playerId: string, isAttending?: boolean) => {
    if (!activeSession) return;
    const currentAttending = activeSession.attendingPlayerIds || [];
    const currentlyIn = currentAttending.includes(playerId);
    const shouldBeIn = isAttending !== undefined ? isAttending : !currentlyIn;

    let newAttending: string[];
    if (shouldBeIn) {
      if (!currentlyIn) {
        newAttending = [...currentAttending, playerId];
      } else {
        newAttending = currentAttending;
      }
    } else {
      newAttending = currentAttending.filter(id => id !== playerId);
    }

    // Ensure payment entry exists
    let updatedPayments = [...(activeSession.payments || [])];
    if (shouldBeIn && !updatedPayments.some(p => p.playerId === playerId)) {
      updatedPayments.push({
        playerId,
        amountDue: activeSession.feePerPlayer || 100,
        amountPaid: 0,
        isPaid: false,
      });
    }

    updateActiveSession({
      ...activeSession,
      attendingPlayerIds: newAttending,
      payments: updatedPayments,
    });
  };

  // Register Player Attendance & Team Selection with 7-player limit per team
  const handleRegisterPlayerTeam = (playerId: string, teamId: string | null, isAttending: boolean) => {
    if (!activeSession) return;
    const currentAttending = activeSession.attendingPlayerIds || [];
    let newAttending = [...currentAttending];

    if (isAttending) {
      if (!newAttending.includes(playerId)) {
        newAttending.push(playerId);
      }
    } else {
      newAttending = newAttending.filter(id => id !== playerId);
    }

    const maxPlayers = activeSession.maxPlayersPerTeam || 7;

    // Update teams in session
    const updatedTeams = activeSession.teams.map(team => {
      // Remove player from all teams first
      let newPlayerIds = team.playerIds.filter(id => id !== playerId);

      // If attending and target team matches
      if (isAttending && teamId && team.id === teamId) {
        if (newPlayerIds.length < maxPlayers) {
          newPlayerIds.push(playerId);
        } else {
          alert(`ทีม ${team.name} เต็มแล้ว (สูงสุด ${maxPlayers} คน/ทีม)`);
        }
      }
      return { ...team, playerIds: newPlayerIds };
    });

    // Ensure payment record exists
    let updatedPayments = [...(activeSession.payments || [])];
    if (isAttending && !updatedPayments.some(p => p.playerId === playerId)) {
      updatedPayments.push({
        playerId,
        amountDue: activeSession.feePerPlayer || 100,
        amountPaid: 0,
        isPaid: false,
      });
    }

    updateActiveSession({
      ...activeSession,
      attendingPlayerIds: newAttending,
      teams: updatedTeams,
      payments: updatedPayments,
    });
  };

  // Draft teams assignment to current session
  const handleAssignTeamsToSession = (newTeams: Team[]) => {
    if (!activeSession) return;
    const assignedPlayerIds = newTeams.flatMap(t => t.playerIds);
    const updatedAttending = Array.from(new Set([...(activeSession.attendingPlayerIds || []), ...assignedPlayerIds]));

    updateActiveSession({
      ...activeSession,
      teams: newTeams,
      attendingPlayerIds: updatedAttending,
      matches: generateRoundRobinMatches(newTeams, activeSession.matchDurationMinutes || 7),
    });
  };

  // Create new session from modal
  const handleCreateSessionFromModal = (data: {
    title: string;
    date: string;
    timeRange: string;
    location: string;
    maxPlayersPerTeam: number;
  }) => {
    const newSessionId = `s_${Date.now()}`;

    const newSess: FootballSession = {
      id: newSessionId,
      date: data.date,
      title: data.title,
      timeRange: data.timeRange,
      location: data.location,
      matchDurationMinutes: 7,
      fieldCost: 1800,
      waterCost: 500,
      otherCost: 0,
      feePerPlayer: 100,
      isAutoFee: false,
      maxPlayersPerTeam: data.maxPlayersPerTeam || 7,
      status: 'in_progress',
      attendingPlayerIds: [], // Start with empty registration for players to join!
      teams: [
        { id: `t1_${Date.now()}`, name: 'TEA-OR', color: 'red', playerIds: [] },
        { id: `t2_${Date.now()}`, name: 'KOPI-OR', color: 'green', playerIds: [] },
        { id: `t3_${Date.now()}`, name: 'AGSA', color: 'blue', playerIds: [] },
        { id: `t4_${Date.now()}`, name: 'BLOOM', color: 'black', playerIds: [] },
      ],
      matches: [],
      expenses: [
        { id: `exp_field_${Date.now()}`, title: 'ค่าสนาม (20:00 - 22:00 น.)', category: 'field', amount: 1800 },
        { id: `exp_water_${Date.now()}`, title: 'ค่าน้ำดื่มเปล่า', category: 'water', amount: 500 },
      ],
      payments: [],
    };

    // Auto generate schedule for 4 teams
    newSess.matches = generateRoundRobinMatches(newSess.teams, 7);

    const updatedSessions = [newSess, ...sessions];
    updateSessionsState(updatedSessions);
    setActiveSessionIdState(newSessionId);
    setActiveSessionId(newSessionId);
  };

  const unpaidCount = activeSession?.payments?.filter(p => !p.isPaid).length || 0;

  return (
    <div className="min-h-screen bg-[#eaedf4] text-slate-800 font-sans pb-16 selection:bg-[#ff2a6d] selection:text-white">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-[#f4f6fa] shadow-2xl relative">
        {/* Header Component */}
        <Header
          sessions={sessions}
          activeSession={activeSession}
          onSelectSession={id => {
            setActiveSessionIdState(id);
            setActiveSessionId(id);
          }}
          isAdmin={isAdmin}
          onOpenAdminModal={() => setShowAdminModal(true)}
          onLogoutAdmin={handleAdminLogout}
          onOpenShareModal={() => setShowShareModal(true)}
          onNewSessionClick={() => setShowNewSessionModal(true)}
          onOpenEditSessionModal={handleOpenEditSessionModal}
          onOpenPaymentModal={handleOpenPaymentModal}
          onDeleteSession={handleDeleteSession}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4">
          {activeSession ? (
            <>
              {activeTab === 'schedule' && (
                <ScheduleTab
                  session={activeSession}
                  players={players}
                  isAdmin={isAdmin}
                  onUpdateMatch={handleUpdateMatch}
                  onDeleteMatch={handleDeleteMatch}
                  onClearAllMatches={handleClearAllMatches}
                  onGenerateMatches={handleGenerateMatches}
                  onAddMatch={handleAddMatch}
                  onAddBreakMatch={handleAddBreakMatch}
                  onMoveMatch={handleMoveMatch}
                  onOptimizeMatches={handleOptimizeMatches}
                  onOpenTeamManager={() => setShowTeamManagerModal(true)}
                />
              )}

              {activeTab === 'standings' && (
                <StandingsTab session={activeSession} players={players} />
              )}

              {activeTab === 'finance' && (
                <FinanceTab
                  session={activeSession}
                  players={players}
                  isAdmin={isAdmin}
                  onUpdatePayments={handleUpdatePayments}
                  onUpdateSessionCosts={handleUpdateSessionCosts}
                  onAddExpense={handleAddExpense}
                  onOpenPaymentModal={handleOpenPaymentModal}
                />
              )}

              {activeTab === 'monthly' && (
                <MonthlyTab
                  sessions={sessions}
                  players={players}
                  onOpenShareModal={() => setShowShareModal(true)}
                />
              )}

              {activeTab === 'players' && (
                <PlayersTab
                  players={players}
                  activeSession={activeSession}
                  isAdmin={isAdmin}
                  onAddPlayer={handleAddPlayer}
                  onUpdatePlayer={handleUpdatePlayer}
                  onDeletePlayer={handleDeletePlayer}
                  onAssignTeamsToSession={handleAssignTeamsToSession}
                  onToggleAttendance={handleToggleAttendance}
                  onRegisterPlayerTeam={handleRegisterPlayerTeam}
                  onOpenPaymentModal={handleOpenPaymentModal}
                  onOpenTeamManager={() => setShowTeamManagerModal(true)}
                  onAddTeam={handleAddTeam}
                  onUpdateTeam={handleUpdateTeam}
                  onDeleteTeam={handleDeleteTeam}
                />
              )}
            </>
          ) : (
            <div className="text-center py-20 space-y-3">
              <p className="text-slate-400 text-sm">ไม่พบข้อมูลเซสชัน</p>
              <button
                onClick={() => {
                  const res = resetToDefaults();
                  setPlayers(res.players);
                  setSessions(res.sessions);
                  setActiveSessionIdState(res.sessions[0].id);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                โหลดข้อมูลตัวอย่างเริ่มต้น
              </button>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={tab => setActiveTab(tab)}
          unpaidCount={unpaidCount}
        />

        {/* Modals */}
        <AdminLoginModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onLoginSuccess={handleAdminLogin}
        />

        <ShareSummaryModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          session={activeSession}
          players={players}
        />

        <EditSessionModal
          isOpen={showEditSessionModal}
          onClose={() => {
            setShowEditSessionModal(false);
            setSessionToEdit(null);
          }}
          session={sessionToEdit || activeSession}
          onSave={updated => {
            const newSessions = sessions.map(s => (s.id === updated.id ? updated : s));
            updateSessionsState(newSessions);
          }}
          onDeleteSession={handleDeleteSession}
          canDelete={sessions.length > 1}
        />

        <NewSessionModal
          isOpen={showNewSessionModal}
          onClose={() => setShowNewSessionModal(false)}
          players={players}
          onCreateSession={handleCreateSessionFromModal}
        />

        {activeSession && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            session={activeSession}
            players={players}
            selectedPlayerId={paymentModalPlayerId}
            isAdmin={isAdmin}
            onConfirmPayment={handleConfirmPayment}
            onUnmarkPayment={handleUnmarkPayment}
          />
        )}

        {activeSession && (
          <AdminTeamManagerModal
            isOpen={showTeamManagerModal}
            onClose={() => setShowTeamManagerModal(false)}
            session={activeSession}
            players={players}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onRegenerateSchedule={() => handleGenerateMatches(activeSession.matchDurationMinutes || 7, 2)}
          />
        )}
      </div>
    </div>
  );
}
