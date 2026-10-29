import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Clock, Plus, Edit2, Volume2, Shield, User, Trophy, Sparkles, Image, Download, SlidersHorizontal, Layers, ChevronDown, ChevronUp, Users, ArrowRight, ArrowUp, ArrowDown, Trash2, PlusCircle, AlertTriangle, Settings2, Check, X, LogOut, Coffee } from 'lucide-react';
import { FootballSession, Match, Player, Team } from '../types';
import { soundManager } from '../utils/audio';
import { PlayerAvatar } from './PlayerAvatar';
import { SchedulePosterModal } from './SchedulePosterModal';
import { getMatchTimeSlot } from '../utils/timeCalculator';
import { TeamCrest } from './TeamCrest';

const FootballIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-1-13.73l-3.09 2.25 1.18 3.63h3.82l1.18-3.63zm-4.36.45L4.5 9.17l2.25 3.08 1.82-1.32zm8.72 0l-1 2.48 1.82 1.32 2.25-3.08zm-8.83 7.24L4.2 13.1l2.87 2.1 1.43-2.18zm8.94 0l-1.43 2.18 2.87-2.1-2.33-2.86zm-5.47 1.86l1.8 1.31 1.8-1.31-.69-2.12h-2.22z"/>
  </svg>
);

interface ScheduleTabProps {
  session: FootballSession;
  players: Player[];
  isAdmin: boolean;
  onUpdateMatch: (match: Match) => void;
  onDeleteMatch?: (matchId: string) => void;
  onClearAllMatches?: () => void;
  onGenerateMatches: (
    durationMinutes: number,
    loops?: number,
    insertBreaks?: boolean,
    breakDurationMinutes?: number
  ) => void;
  onAddMatch: (
    homeTeamId: string,
    awayTeamId: string,
    durationMinutes?: number,
    status?: 'scheduled' | 'live' | 'finished',
    homeScore?: number | null,
    awayScore?: number | null
  ) => void;
  onAddBreakMatch?: (durationMinutes?: number, title?: string) => void;
  onMoveMatch?: (matchId: string, direction: 'up' | 'down') => void;
  onOptimizeMatches?: () => void;
  onOpenTeamManager?: () => void;
  onOpenAdminModal?: () => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  session,
  players,
  isAdmin,
  onUpdateMatch,
  onDeleteMatch,
  onClearAllMatches,
  onGenerateMatches,
  onAddMatch,
  onAddBreakMatch,
  onMoveMatch,
  onOptimizeMatches,
  onOpenTeamManager,
  onOpenAdminModal,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingScoreMatch, setEditingScoreMatch] = useState<Match | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<number>(0);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(0);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState<boolean>(false);
  const [showCustomConfig, setShowCustomConfig] = useState<boolean>(false);
  const [customDuration, setCustomDuration] = useState<number>(session.matchDurationMinutes || 7);
  const [customLoops, setCustomLoops] = useState<number>(2);
  const [customInsertBreaks, setCustomInsertBreaks] = useState<boolean>(false);
  const [customBreakDuration, setCustomBreakDuration] = useState<number>(5);

  // Full Match Edit Modal State (For Admin)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editMatchForm, setEditMatchForm] = useState<{
    matchNumber: number;
    homeTeamId: string;
    awayTeamId: string;
    durationMinutes: number;
    status: 'scheduled' | 'live' | 'finished';
    homeScore: number | string;
    awayScore: number | string;
    goals: NonNullable<Match['goals']>;
  }>({
    matchNumber: 1,
    homeTeamId: '',
    awayTeamId: '',
    durationMinutes: 7,
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    goals: [],
  });

  // Delete Match Confirmation State
  const [deletingMatch, setDeletingMatch] = useState<Match | null>(null);

  // Add Custom Match Modal State
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState<boolean>(false);
  const [newMatchHomeTeamId, setNewMatchHomeTeamId] = useState<string>('');
  const [newMatchAwayTeamId, setNewMatchAwayTeamId] = useState<string>('');
  const [newMatchDuration, setNewMatchDuration] = useState<number>(session.matchDurationMinutes || 7);
  const [newMatchStatus, setNewMatchStatus] = useState<'scheduled' | 'live' | 'finished'>('scheduled');
  const [newMatchHomeScore, setNewMatchHomeScore] = useState<string>('');
  const [newMatchAwayScore, setNewMatchAwayScore] = useState<string>('');
  const [showAutoGeneratePanel, setShowAutoGeneratePanel] = useState<boolean>(false);

  // Clear All Confirmation Modal
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState<boolean>(false);

  // Goal Scorer Selection Modal State
  const [goalScorerModal, setGoalScorerModal] = useState<{
    match: Match;
    teamId: string;
    isHome: boolean;
  } | null>(null);

  // Expandable Match Card State
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchFilter, setMatchFilter] = useState<'all' | 'live' | 'finished' | 'scheduled'>('all');

  const toggleExpandMatch = (matchId: string) => {
    setExpandedMatchId(prev => (prev === matchId ? null : matchId));
  };

  const getTeamPlayers = (team?: Team): Player[] => {
    if (!team || !team.playerIds) return [];
    return team.playerIds
      .map(id => players.find(p => p.id === id))
      .filter((p): p is Player => !!p);
  };

  // Live Timer State for currently live match
  const liveMatch = session.matches.find(m => m.status === 'live');
  const [timerSeconds, setTimerSeconds] = useState<number>(
    (liveMatch?.durationMinutes || session.matchDurationMinutes || 7) * 60
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Sync timer when live match changes
  useEffect(() => {
    if (liveMatch) {
      setTimerSeconds((liveMatch.durationMinutes || session.matchDurationMinutes || 7) * 60);
      setIsTimerRunning(false);
    }
  }, [liveMatch?.id]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            soundManager.playWhistle();
            return 0;
          }
          if (prev === 11 || prev === 6 || prev === 4) {
            soundManager.playBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTeam = (teamId: string): Team | undefined => {
    return session.teams.find(t => t.id === teamId);
  };

  const getTeamBadgeColor = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'blue': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'green': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'black': return 'bg-slate-800 text-slate-100 border-slate-700';
      case 'yellow': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'purple': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getTeamPillColor = (color?: string) => {
    switch (color) {
      case 'red': return 'bg-rose-600 text-white';
      case 'blue': return 'bg-sky-600 text-white';
      case 'green': return 'bg-emerald-600 text-white';
      case 'black': return 'bg-slate-900 text-white border border-slate-700';
      case 'yellow': return 'bg-amber-500 text-slate-950 font-bold';
      case 'purple': return 'bg-purple-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const handleOpenFullMatchEdit = (m: Match) => {
    setEditingMatch(m);
    setEditMatchForm({
      matchNumber: m.matchNumber,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      durationMinutes: m.durationMinutes || session.matchDurationMinutes || 7,
      status: m.status,
      homeScore: m.homeScore !== null && m.homeScore !== undefined ? m.homeScore : '',
      awayScore: m.awayScore !== null && m.awayScore !== undefined ? m.awayScore : '',
      goals: m.goals ? [...m.goals] : [],
    });
  };

  const handleSaveFullMatchEdit = () => {
    if (!editingMatch) return;
    if (editMatchForm.homeTeamId === editMatchForm.awayTeamId) {
      alert('ทีมเหย้าและทีมเยือนต้องไม่ใช่ทีมเดียวกัน');
      return;
    }
    const hScore = editMatchForm.homeScore === '' ? null : Number(editMatchForm.homeScore);
    const aScore = editMatchForm.awayScore === '' ? null : Number(editMatchForm.awayScore);

    const updated: Match = {
      ...editingMatch,
      matchNumber: Number(editMatchForm.matchNumber) || editingMatch.matchNumber,
      homeTeamId: editMatchForm.homeTeamId || editingMatch.homeTeamId,
      awayTeamId: editMatchForm.awayTeamId || editingMatch.awayTeamId,
      durationMinutes: Number(editMatchForm.durationMinutes) || 7,
      status: editMatchForm.status,
      homeScore: hScore,
      awayScore: aScore,
      goals: editMatchForm.goals,
    };

    onUpdateMatch(updated);
    setEditingMatch(null);
  };

  const handleRemoveGoalFromEdit = (goalIndex: number) => {
    setEditMatchForm(prev => ({
      ...prev,
      goals: prev.goals.filter((_, idx) => idx !== goalIndex),
    }));
  };

  const handleConfirmDelete = () => {
    if (!deletingMatch) return;
    if (onDeleteMatch) {
      onDeleteMatch(deletingMatch.id);
    }
    setDeletingMatch(null);
  };

  const handleSetLiveMatch = (m: Match) => {
    onUpdateMatch({
      ...m,
      status: 'live',
      homeScore: m.homeScore ?? 0,
      awayScore: m.awayScore ?? 0,
    });
  };

  const handleOpenAddMatchModal = () => {
    if (!isAdmin) {
      if (onOpenAdminModal) onOpenAdminModal();
      return;
    }
    const t1 = session.teams[0]?.id || '';
    const t2 = session.teams[1]?.id || '';
    setNewMatchHomeTeamId(t1);
    setNewMatchAwayTeamId(t2);
    setNewMatchDuration(session.matchDurationMinutes || 7);
    setNewMatchStatus('scheduled');
    setNewMatchHomeScore('');
    setNewMatchAwayScore('');
    setIsAddMatchModalOpen(true);
  };

  const handleSaveAddMatch = () => {
    if (!isAdmin) {
      if (onOpenAdminModal) onOpenAdminModal();
      return;
    }
    if (!newMatchHomeTeamId || !newMatchAwayTeamId) return;
    if (newMatchHomeTeamId === newMatchAwayTeamId) {
      alert('กรุณาเลือกทีมเหย้าและทีมเยือนที่ไม่ซ้ำกัน');
      return;
    }
    const hScore = newMatchHomeScore === '' ? null : Number(newMatchHomeScore);
    const aScore = newMatchAwayScore === '' ? null : Number(newMatchAwayScore);
    onAddMatch(
      newMatchHomeTeamId,
      newMatchAwayTeamId,
      newMatchDuration,
      newMatchStatus,
      hScore,
      aScore
    );
    setIsAddMatchModalOpen(false);
  };

  const handleStartTimer = () => {
    soundManager.playWhistle();
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (liveMatch) {
      setTimerSeconds((liveMatch.durationMinutes || session.matchDurationMinutes || 7) * 60);
    }
  };

  const handleOpenScoreEdit = (m: Match) => {
    setEditingScoreMatch(m);
    setHomeScoreInput(m.homeScore ?? 0);
    setAwayScoreInput(m.awayScore ?? 0);
  };

  const handleSaveScore = () => {
    if (!editingScoreMatch) return;
    const updated: Match = {
      ...editingScoreMatch,
      homeScore: homeScoreInput,
      awayScore: awayScoreInput,
      status: 'finished',
    };
    onUpdateMatch(updated);
    setEditingScoreMatch(null);
  };

  const handleFinishLiveMatch = () => {
    if (!liveMatch) return;
    setIsTimerRunning(false);
    soundManager.playWhistle();
    const updated: Match = {
      ...liveMatch,
      homeScore: liveMatch.homeScore ?? 0,
      awayScore: liveMatch.awayScore ?? 0,
      status: 'finished',
    };
    onUpdateMatch(updated);
  };

  const handleAddGoal = (match: Match, teamId: string, playerId?: string) => {
    const isHome = teamId === match.homeTeamId;
    const currentHomeScore = match.homeScore ?? 0;
    const currentAwayScore = match.awayScore ?? 0;

    const newGoal = {
      id: `g_${Date.now()}`,
      matchId: match.id,
      teamId,
      playerId,
      minute: Math.ceil(((match.durationMinutes * 60) - timerSeconds) / 60) || 1,
    };

    const updatedMatch: Match = {
      ...match,
      homeScore: isHome ? currentHomeScore + 1 : currentHomeScore,
      awayScore: !isHome ? currentAwayScore + 1 : currentAwayScore,
      goals: [...(match.goals || []), newGoal],
    };

    onUpdateMatch(updatedMatch);
    setGoalScorerModal(null);
  };

  return (
    <div className="space-y-3 pb-20">
      {/* ADMIN MASTER CONTROL BAR */}
      {isAdmin && (
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                ⚡
              </span>
              <div>
                <h3 className="text-xs font-black text-amber-950">แผงควบคุมการแข่งขัน (แอดมิน)</h3>
                <p className="text-[10px] text-amber-700 font-medium">จัดการทีม กำหนดเกม เพิ่ม/แก้ไข/ลบแมตช์ได้อิสระ</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
              {session.matches.length} แมตช์ • {session.teams.length} ทีม
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            <button
              onClick={handleOpenAddMatchModal}
              className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="เพิ่มแมตช์การแข่งขันใหม่"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ เพิ่มแมตช์</span>
            </button>

            {onOpenTeamManager && (
              <button
                onClick={onOpenTeamManager}
                className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="เปลี่ยนชื่อทีม เพิ่มทีมใหม่ ลบทีม"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>จัดการทีม ({session.teams.length})</span>
              </button>
            )}

            {onAddBreakMatch && (
              <button
                type="button"
                onClick={() => onAddBreakMatch(5, 'พักเบรกครึ่งรอบ (5 นาที)')}
                className="py-2 px-2.5 rounded-xl bg-orange-100 hover:bg-orange-200/80 text-orange-950 border border-orange-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="แทรกเวลาพักเบรก 5 นาที ให้ทีมได้พักดื่มน้ำและยืดเส้น"
              >
                <Coffee className="w-3.5 h-3.5 text-orange-700" />
                <span>+ พักเบรก</span>
              </button>
            )}

            {isAdmin && onOptimizeMatches && session.matches.length > 1 && (
              <button
                type="button"
                onClick={onOptimizeMatches}
                className="py-2 px-2.5 rounded-xl bg-purple-100 hover:bg-purple-200/80 text-purple-900 border border-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="จัดสลับลำดับแมตช์ใหม่ให้ทีมไม่เตะติดกัน (เว้นช่วงพักอัตโนมัติ)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>สลับเว้นพัก (ไม่เตะติด)</span>
              </button>
            )}

            <button
              onClick={() => setShowAutoGeneratePanel(!showAutoGeneratePanel)}
              className="py-2 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="สร้างตารางแข่งขันรอบพบกันหมดอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{showAutoGeneratePanel ? 'ปิดตัวช่วย' : 'สร้างตารางวน'}</span>
            </button>

            {onClearAllMatches && (
              <button
                onClick={() => setIsConfirmClearAllOpen(true)}
                disabled={session.matches.length === 0}
                className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
                title="ล้างแมตช์ทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>ล้างทั้งหมด</span>
              </button>
            )}
          </div>

          {/* Collapsible Auto Schedule Generator Panel */}
          {showAutoGeneratePanel && (
            <div className="pt-2 border-t border-amber-200/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <span>เลือกรูปแบบตารางแข่งวน (Round-Robin):</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-300/60">
                    โมเดลเว้นพักอัจฉริยะ (ไม่เตะติด)
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  {onOptimizeMatches && session.matches.length > 1 && (
                    <button
                      onClick={onOptimizeMatches}
                      className="text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer font-bold text-[11px]"
                      title="จัดสลับลำดับแมตช์ใหม่ให้ทีมไม่เตะติดกัน"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>สลับเว้นพักแมตช์</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowCustomConfig(!showCustomConfig)}
                    className="text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{showCustomConfig ? 'ซ่อนตัวเลือก' : 'ปรับแต่งเอง'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets for 120 min sessions with & without Breaks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                <button
                  onClick={() => onGenerateMatches(7, 2, false)}
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="7 นาที วน 2 รอบ (จัดคิวเว้นพักอัจฉริยะ)"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">7 นาที (2 รอบ)</span>
                    <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-1 rounded">เว้นพัก</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 block mt-0.5 font-normal">สลับคู่ให้ได้พักผ่อน</span>
                </button>

                <button
                  onClick={() => onGenerateMatches(7, 2, true, 5)}
                  className="p-2 rounded-xl bg-white hover:bg-orange-50 border border-orange-300 text-orange-950 font-bold text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="7 นาที (2 รอบ) + แทรกพักเบรก 5 นาทีระหว่างรอบ"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-orange-800">7 นาที + พักเบรก</span>
                    <span className="text-[10px] font-mono bg-orange-200/80 text-orange-900 px-1 rounded">พัก 5 นาที</span>
                  </div>
                  <span className="text-[10px] text-orange-700 block mt-0.5 font-normal">มีพักดื่มน้ำ ไม่เตะติด 100%</span>
                </button>

                <button
                  onClick={() => onGenerateMatches(6, 2, false)}
                  className="p-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-300 text-amber-950 font-bold text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="6 นาที วน 2 รอบ"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-amber-800">6 นาที (2 รอบ)</span>
                    <span className="text-[10px] font-mono bg-amber-200/80 text-amber-900 px-1 rounded">เว้นพัก</span>
                  </div>
                  <span className="text-[10px] text-amber-700 block mt-0.5 font-normal">เกมกระชับ เว้นพัก</span>
                </button>

                <button
                  onClick={() => onGenerateMatches(6, 2, true, 5)}
                  className="p-2 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-purple-950 font-bold text-left transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="6 นาที (2 รอบ) + แทรกพักเบรก 5 นาที"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-purple-800">6 นาที + พักเบรก</span>
                    <span className="text-[10px] font-mono bg-purple-200/80 text-purple-900 px-1 rounded">พัก 5 นาที</span>
                  </div>
                  <span className="text-[10px] text-purple-700 block mt-0.5 font-normal">พักสบาย เล่นได้แรงดี</span>
                </button>
              </div>

              {/* Custom Config Drawer */}
              {showCustomConfig && (
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">เวลาต่อแมตช์ (นาที):</label>
                      <select
                        value={customDuration}
                        onChange={e => setCustomDuration(parseInt(e.target.value) || 7)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                      >
                        <option value={5}>5 นาที/นัด</option>
                        <option value={6}>6 นาที/นัด</option>
                        <option value={7}>7 นาที/นัด (แนะนำ)</option>
                        <option value={8}>8 นาที/นัด</option>
                        <option value={10}>10 นาที/นัด</option>
                        <option value={12}>12 นาที/นัด</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">จำนวนรอบวน (Loop):</label>
                      <select
                        value={customLoops}
                        onChange={e => setCustomLoops(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                      >
                        <option value={1}>1 รอบ ({session.teams.length} ทีม = {(session.teams.length * (session.teams.length - 1)) / 2} นัด)</option>
                        <option value={2}>2 รอบ ({session.teams.length} ทีม = {session.teams.length * (session.teams.length - 1)} นัด)</option>
                        <option value={3}>3 รอบ ({session.teams.length} ทีม = {(session.teams.length * (session.teams.length - 1) * 3) / 2} นัด)</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle Break Intermission Option */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={customInsertBreaks}
                        onChange={e => setCustomInsertBreaks(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-[11px] font-bold text-slate-800">
                        แทรกช่วงพักเบรกระหว่างรอบ (ไม่เตะติดกัน 100%)
                      </span>
                    </label>

                    {customInsertBreaks && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 font-medium">พัก:</span>
                        <select
                          value={customBreakDuration}
                          onChange={e => setCustomBreakDuration(parseInt(e.target.value) || 5)}
                          className="bg-amber-50 border border-amber-300 rounded-md py-0.5 px-1.5 text-[11px] font-bold text-amber-900"
                        >
                          <option value={3}>3 นาที</option>
                          <option value={5}>5 นาที (แนะนำ)</option>
                          <option value={8}>8 นาที</option>
                          <option value={10}>10 นาที</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onGenerateMatches(customDuration, customLoops, customInsertBreaks, customBreakDuration);
                      setShowCustomConfig(false);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      ยืนยันสร้างตารางแข่ง ({customDuration} นาที • วน {customLoops} รอบ
                      {customInsertBreaks ? ` + พักเบรก ${customBreakDuration} นาที` : ''})
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LIVE MATCH SECTION */}
      {(() => {
        const featuredMatch = liveMatch || session.matches.find(m => m.status === 'scheduled') || session.matches[0];
        const isActuallyLive = !!liveMatch;
        const currentMatch = liveMatch || featuredMatch;
        
        if (!currentMatch) {
          return (
            <div className="p-6 bg-white rounded-3xl text-center space-y-3.5 shadow-xs border border-slate-200/80 animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff2a6d]/15 to-[#ff007f]/5 text-[#ff2a6d] border border-[#ff2a6d]/20 flex items-center justify-center mx-auto shadow-2xs">
                {isAdmin ? <Sparkles className="w-6 h-6 text-[#ff2a6d]" /> : <Shield className="w-6 h-6 text-amber-600" />}
              </div>
              <div className="space-y-1">
                <p className="font-black text-slate-800 text-sm">ยังไม่มีตารางการแข่งขัน</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {isAdmin
                    ? 'คุณเป็นแอดมิน สามารถกดสร้างตารางการแข่งขันรอบพบกันหมด หรือเพิ่มแมตช์ได้ทันที'
                    : 'จะสร้างแมตช์การแข่งขันได้ต้องเป็นแอดมินเท่านั้น (เข้าสู่ระบบเพื่อจัดการ)'}
                </p>
              </div>

              {isAdmin ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onGenerateMatches(session.matchDurationMinutes || 7, 2, false, 5)}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ สร้างตารางแข่งวนอัตโนมัติ (Round-Robin)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddMatchModal}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มแมตช์เอง</span>
                  </button>
                </div>
              ) : (
                onOpenAdminModal && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onOpenAdminModal}
                      className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>เข้าสู่ระบบแอดมินเพื่อสร้างแมตช์</span>
                    </button>
                  </div>
                )
              )}
            </div>
          );
        }

        if (currentMatch.isBreak) {
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-800 tracking-tight">ช่วงพักเบรก</h2>
                  {isActuallyLive && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      BREAK TIME
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {isActuallyLive ? `กำลังพักเบรก (${currentMatch.durationMinutes} นาที)` : `รอพักเบรก (${currentMatch.durationMinutes} นาที)`}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1705] via-[#3d2005] to-[#1a0e02] p-5 text-white shadow-xl shadow-amber-950/20 border border-amber-800/40">
                <div className="flex items-center justify-between text-xs mb-3 text-amber-200/80">
                  <span className="font-bold text-[11px] tracking-wide uppercase text-amber-300 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5" />
                    <span>{currentMatch.breakTitle || 'ช่วงพักเบรกครึ่งรอบ'}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>{currentMatch.durationMinutes} นาที</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center my-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-2 border border-amber-500/30">
                    ☕
                  </div>
                  <h3 className="text-base font-black text-white">พักดื่มน้ำ & ยืดกล้ามเนื้อ</h3>
                  <p className="text-xs text-amber-200/80 mt-1 max-w-sm">
                    ให้ทีมที่เพิ่งแข่งขันได้พักผ่อนอย่างเต็มที่ ป้องกันการลงเล่นติดต่อกัน
                  </p>

                  <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-100 text-sm font-mono font-black tracking-wider flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActuallyLive ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{isActuallyLive ? formatTime(timerSeconds) : `${currentMatch.durationMinutes}:00 (พร้อมพัก)`}</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-2">
                    {!isActuallyLive ? (
                      <button
                        onClick={() => handleSetLiveMatch(currentMatch)}
                        className="py-2 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>เริ่มจับเวลาพักเบรก</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={isTimerRunning ? handlePauseTimer : handleStartTimer}
                          className="py-2 px-4 rounded-full bg-white/15 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          {isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>{isTimerRunning ? 'หยุดชั่วคราว' : 'จับเวลาต่อ'}</span>
                        </button>
                        <button
                          onClick={handleFinishLiveMatch}
                          className="py-2 px-5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>จบช่วงพักเบรก (พร้อมแข่งคู่ถัดไป)</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }

        const homeTeam = getTeam(currentMatch.homeTeamId);
        const awayTeam = getTeam(currentMatch.awayTeamId);

        return (
          <div className="space-y-2">
            {/* Live Match Section Title */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Live Match</h2>
                {isActuallyLive && (
                  <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-[#ff2a6d] border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a6d] animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {isActuallyLive ? `กำลังแข่งขัน นัดที่ ${currentMatch.matchNumber}` : `รอแข่ง นัดที่ ${currentMatch.matchNumber}`}
              </span>
            </div>

            {/* Deep Purple Luxury Hero Card (Reference Design) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d0938] via-[#2a0e4e] to-[#120324] p-5 text-white shadow-xl shadow-purple-950/20 border border-purple-900/40">
              {/* Ambient gradient glow highlights */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-[#ff2a6d]/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />

              {/* Card Sub-Header inside */}
              <div className="flex items-center justify-between text-xs mb-3 text-purple-200/80">
                <span className="font-bold text-[11px] tracking-wide uppercase text-purple-300">
                  MATCH UKHUWAH • นัดที่ {currentMatch.matchNumber}
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-purple-300" />
                  <span>{currentMatch.durationMinutes || session.matchDurationMinutes || 7} นาที</span>
                </div>
              </div>

              {/* Match Teams & Big Score Display */}
              <div className="flex items-center justify-between gap-2 my-2">
                {/* Home Team */}
                <div className="flex-1 flex flex-col items-center text-center min-w-0">
                  <TeamCrest teamName={homeTeam?.name} color={homeTeam?.color} size="xl" />
                  <span className="text-sm font-black text-white mt-2 truncate max-w-[110px]">
                    {homeTeam?.name || 'ทีมเหย้า'}
                  </span>
                  <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider mt-0.5">
                    Home
                  </span>
                </div>

                {/* Center: Score + Elapsed Time Pill */}
                <div className="flex flex-col items-center justify-center px-2 shrink-0">
                  <div className="flex items-center gap-2 font-mono font-black text-4xl sm:text-5xl text-white tracking-widest drop-shadow-sm">
                    <span>{currentMatch.homeScore ?? 0}</span>
                    <span className="text-purple-400/70 text-3xl">:</span>
                    <span>{currentMatch.awayScore ?? 0}</span>
                  </div>

                  {/* Elapsed Time Pill (Directly from screenshot) */}
                  <div className="mt-2 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/30 text-purple-100 text-xs font-mono font-bold tracking-wider backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                    <span className={`w-2 h-2 rounded-full ${isActuallyLive ? 'bg-[#ff2a6d] animate-pulse' : 'bg-slate-400'}`} />
                    <span>{isActuallyLive ? formatTime(timerSeconds) : 'พร้อมแข่ง'}</span>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex-1 flex flex-col items-center text-center min-w-0">
                  <TeamCrest teamName={awayTeam?.name} color={awayTeam?.color} size="xl" />
                  <span className="text-sm font-black text-white mt-2 truncate max-w-[110px]">
                    {awayTeam?.name || 'ทีมเยือน'}
                  </span>
                  <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider mt-0.5">
                    Away
                  </span>
                </div>
              </div>

              {/* Goal Action Buttons & Timer Controls for Live Match (Admin Only) */}
              {isActuallyLive ? (
                <>
                  {/* Goal Scorer Log if any */}
                  {currentMatch.goals && currentMatch.goals.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-2xl bg-black/20 border border-white/10 text-xs space-y-1">
                      <span className="text-[10px] text-purple-200/80 font-bold block mb-1">⚽ รายชื่อผู้ทำประตู:</span>
                      {currentMatch.goals.map((g, idx) => {
                        const scorer = players.find(p => p.id === g.playerId);
                        const scorerTeam = session.teams.find(t => t.id === g.teamId);
                        return (
                          <div key={idx} className="flex items-center justify-between text-purple-100 text-[11px]">
                            <span className="flex items-center gap-1.5">
                              {scorer ? (
                                <PlayerAvatar nickname={scorer.nickname} avatarUrl={scorer.avatarUrl} size="xs" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              )}
                              <span className="font-bold text-white">{scorer ? scorer.nickname : 'ไม่ระบุชื่อ'}</span>
                            </span>
                            <span className="text-purple-300 text-[10px]">นาทีที่ {g.minute}' ({scorerTeam?.name})</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isAdmin ? (
                    <>
                      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setGoalScorerModal({ match: currentMatch, teamId: currentMatch.homeTeamId, isHome: true })}
                          className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
                          id="btn-goal-home"
                        >
                          <FootballIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">{homeTeam?.name || 'ทีมเหย้า'} +1</span>
                        </button>

                        <button
                          onClick={() => setGoalScorerModal({ match: currentMatch, teamId: currentMatch.awayTeamId, isHome: false })}
                          className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
                          id="btn-goal-away"
                        >
                          <FootballIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">{awayTeam?.name || 'ทีมเยือน'} +1</span>
                        </button>
                      </div>

                      {/* Timer and Finish Match Controls */}
                      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!isTimerRunning ? (
                            <button
                              onClick={handleStartTimer}
                              className="py-2 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                              id="btn-timer-start"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>เริ่มนกหวีด</span>
                            </button>
                          ) : (
                            <button
                              onClick={handlePauseTimer}
                              className="py-2 px-4 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                              id="btn-timer-pause"
                            >
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>หยุดเวลา</span>
                            </button>
                          )}

                          <button
                            onClick={handleResetTimer}
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 border border-white/15 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                            title="รีเซ็ตเวลา"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {timerSeconds === 0 && (
                          <div className="mt-3 py-1.5 px-3 rounded-xl bg-rose-500/25 border border-rose-400/50 text-rose-100 text-xs font-bold flex items-center justify-between animate-pulse">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-rose-300" />
                              <span>หมดเวลาการแข่งขันแล้ว!</span>
                            </span>
                            <span className="text-[11px] text-rose-200">กดปุ่มจบเกมนี้เพื่อบันทึกผล</span>
                          </div>
                        )}

                        <button
                          onClick={handleFinishLiveMatch}
                          className="py-2 px-4 rounded-full bg-[#ff2a6d] hover:bg-[#ff007f] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
                          id="btn-finish-match"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>จบเกมนี้</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-purple-200">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="w-2 h-2 rounded-full bg-[#ff2a6d] animate-ping" />
                        <span>กำลังแข่งขันสด</span>
                      </span>
                      <span className="text-[11px] text-purple-300 font-medium">แอดมินเป็นผู้บันทึกผลและจับเวลา</span>
                    </div>
                  )}
                </>
              ) : (
                /* Next Match Kick Off CTA */
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-purple-200/80">
                    <span>แมตช์ถัดไปพร้อมลงสนาม</span>
                  </div>
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        onUpdateMatch({ ...currentMatch, status: 'live' });
                      }}
                      className="py-2 px-4 rounded-full bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>เริ่มแข่งขันคู่นี้ (Kick Off)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-900/60 border border-purple-700/50 px-3 py-1 rounded-full">
                      รอแอดมินเริ่มเกม
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MATCHS LIST SECTION */}
      <div className="space-y-2.5 pt-2">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">Matchs</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              ทั้งหมด {session.matches.length} แมตช์ • นัดละ {session.matchDurationMinutes || 7} นาที
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleOpenAddMatchModal}
                  className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="เพิ่มแมตช์แข่งขันใหม่"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {session.matches.length > 0 && onClearAllMatches && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmClearAllOpen(true)}
                    className="w-9 h-9 rounded-full bg-white hover:bg-rose-50 text-rose-600 border border-slate-200/80 flex items-center justify-center shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="ล้างตารางแข่งทั้งหมด"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => setIsPosterModalOpen(true)}
              className="h-9 px-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="ดาวน์โหลดรูปตารางแข่ง"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ภาพตาราง</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'live', label: 'กำลังแข่ง' },
            { id: 'scheduled', label: 'รอแข่ง' },
            { id: 'finished', label: 'จบแล้ว' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMatchFilter(f.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                matchFilter === f.id
                  ? 'bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] text-white shadow-sm shadow-rose-500/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Matches Cards */}
        {session.matches.length === 0 ? (
          <div className="p-6 text-center bg-white border border-slate-200/80 rounded-2xl text-slate-500 text-xs shadow-xs space-y-2">
            <p className="font-bold text-slate-700">
              {isAdmin
                ? 'ยังไม่มีรายการแข่ง กดสร้างตารางแข่งอัตโนมัติ หรือกดเพิ่มแมตช์ใหม่'
                : 'ยังไม่มีรายการแข่งขัน (จะสร้างแมตช์การแข่งขันได้ต้องเป็นแอดมินเท่านั้น)'}
            </p>
            {!isAdmin && onOpenAdminModal && (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>เข้าสู่ระบบแอดมิน</span>
              </button>
            )}
          </div>
        ) : (
          session.matches
            .filter(m => {
              if (matchFilter === 'live') return m.status === 'live';
              if (matchFilter === 'finished') return m.status === 'finished';
              if (matchFilter === 'scheduled') return m.status === 'scheduled';
              return true;
            })
            .map((m, idx) => {
              const isFinished = m.status === 'finished';
              const isLive = m.status === 'live';
              const isExpanded = expandedMatchId === m.id;
              const timeSlot = getMatchTimeSlot(
                session.timeRange,
                idx,
                session.matches.length,
                session.matchDurationMinutes || 7
              );

              // If match is a Rest Break slot
              if (m.isBreak) {
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl border transition-all overflow-hidden mb-2.5 ${
                      isLive
                        ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-50 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                        : isFinished
                        ? 'bg-slate-50/80 border-slate-200/70 opacity-80'
                        : 'bg-amber-50/50 border-amber-200/80'
                    }`}
                  >
                    <div className="px-3.5 py-1.5 bg-amber-100/60 border-b border-amber-200/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded">
                          #{m.matchNumber}
                        </span>
                        <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <Coffee className="w-3 h-3 text-amber-700" />
                          <span>พักเบรก {m.durationMinutes || 5} นาที</span>
                        </span>
                        {isFinished && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1 rounded">
                            พักเสร็จแล้ว
                          </span>
                        )}
                        {isLive && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-300 px-1.5 py-0.5 rounded-full animate-pulse">
                            กำลังพักเบรก
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {onMoveMatch && (
                            <div className="flex items-center bg-white border border-amber-200 rounded-lg overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={e => {
                                  e.stopPropagation();
                                  onMoveMatch(m.id, 'up');
                                }}
                                className="p-1 hover:bg-amber-50 text-amber-900 disabled:opacity-25 cursor-pointer"
                                title="เลื่อนคิวขึ้น"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <div className="w-[1px] h-3 bg-amber-200" />
                              <button
                                type="button"
                                disabled={idx === session.matches.length - 1}
                                onClick={e => {
                                  e.stopPropagation();
                                  onMoveMatch(m.id, 'down');
                                }}
                                className="p-1 hover:bg-amber-50 text-amber-900 disabled:opacity-25 cursor-pointer"
                                title="เลื่อนคิวลง"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {!isLive && !isFinished && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleSetLiveMatch(m);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              เริ่มพักเบรก
                            </button>
                          )}
                          {isLive && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleFinishLiveMatch();
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              จบพักเบรก
                            </button>
                          )}
                          {onDeleteMatch && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setDeletingMatch(m);
                              }}
                              className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                              title="ลบช่วงพักนี้"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shadow-2xs">
                          ☕
                        </div>
                        <div>
                          <div className="text-xs font-black text-amber-950">
                            {m.breakTitle || 'พักเบรกครึ่งรอบ (พักดื่มน้ำ & ยืดเส้น)'}
                          </div>
                          <div className="text-[11px] text-amber-700">
                            ให้ทีมที่เพิ่งแข่งขันได้พักผ่อน ดื่มน้ำ ไม่ต้องเตะติดต่อกัน
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-black text-amber-900">
                          {timeSlot.startTime}
                        </div>
                        <div className="text-[10px] text-amber-600 font-medium">
                          {m.durationMinutes} นาที
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const home = getTeam(m.homeTeamId);
              const away = getTeam(m.awayTeamId);
              const homePlayers = getTeamPlayers(home);
              const awayPlayers = getTeamPlayers(away);

              // Calculate whether this match contains a team that played in the immediately previous match
              const prevMatch = idx > 0 ? session.matches[idx - 1] : null;
              const isHomeConsecutive = prevMatch && !prevMatch.isBreak && (prevMatch.homeTeamId === m.homeTeamId || prevMatch.awayTeamId === m.homeTeamId);
              const isAwayConsecutive = prevMatch && !prevMatch.isBreak && (prevMatch.homeTeamId === m.awayTeamId || prevMatch.awayTeamId === m.awayTeamId);
              const consecutiveTeam = isHomeConsecutive ? home : isAwayConsecutive ? away : null;

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl shadow-[0_4px_18px_rgba(0,0,0,0.03)] border border-slate-100/90 hover:shadow-md transition-all overflow-hidden mb-2.5"
                >
                  {/* ADMIN ACTION STRIP ON EACH MATCH CARD */}
                  {isAdmin && (
                    <div className="px-3.5 py-1.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded">
                          #{m.matchNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {m.durationMinutes || 7} นาที
                        </span>
                        {isFinished && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1 rounded">
                            จบแล้ว
                          </span>
                        )}
                        {isLive && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1 rounded animate-pulse">
                            กำลังแข่ง
                          </span>
                        )}
                        {consecutiveTeam ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="ทีมนี้ลงเล่นในนัดก่อนหน้า">
                            <span>⚡ {consecutiveTeam.name} เตะติดกัน</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="ทั้งสองทีมได้เว้นช่วงพักแล้ว">
                            <span>🟢 ได้พักแล้ว</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Reorder Up / Down */}
                        {onMoveMatch && (
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={e => {
                                e.stopPropagation();
                                onMoveMatch(m.id, 'up');
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-25 cursor-pointer"
                              title="เลื่อนคิวขึ้น"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <div className="w-[1px] h-3 bg-slate-200" />
                            <button
                              type="button"
                              disabled={idx === session.matches.length - 1}
                              onClick={e => {
                                e.stopPropagation();
                                onMoveMatch(m.id, 'down');
                              }}
                              className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-25 cursor-pointer"
                              title="เลื่อนคิวลง"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Quick Set Live */}
                        {!isLive && !isFinished && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleSetLiveMatch(m);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] cursor-pointer transition-colors"
                            title="เริ่มแข่งคู่นี้"
                          >
                            เริ่มแข่ง
                          </button>
                        )}

                        {/* Edit Match */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenFullMatchEdit(m);
                          }}
                          className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition-colors"
                          title="แก้ไขข้อมูลแมตช์"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Delete Match */}
                        {onDeleteMatch && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setDeletingMatch(m);
                            }}
                            className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition-colors"
                            title="ลบแมตช์นี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CARD BODY: TEAMS & SCORE IN REFERENCE DESIGN */}
                  <div
                    onClick={() => toggleExpandMatch(m.id)}
                    className="p-4 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* HOME TEAM */}
                      <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-slate-800 truncate text-right">
                          {home?.name || 'ทีมเหย้า'}
                        </span>
                        <TeamCrest teamName={home?.name} color={home?.color} size="md" />
                      </div>

                      {/* CENTER TIME OR SCORE (Matches LiveScore reference) */}
                      <div className="px-3 shrink-0 flex flex-col items-center justify-center min-w-[76px]">
                        {isFinished ? (
                          <>
                            <div className="font-mono font-black text-sm sm:text-base text-slate-900 tracking-wider">
                              {m.homeScore ?? 0} : {m.awayScore ?? 0}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                              FT
                            </span>
                          </>
                        ) : isLive ? (
                          <>
                            <div className="font-mono font-black text-sm sm:text-base text-[#ff2a6d] tracking-wider flex items-center gap-1">
                              <span>{m.homeScore ?? 0}</span>
                              <span className="text-slate-300">:</span>
                              <span>{m.awayScore ?? 0}</span>
                            </div>
                            <span className="text-[10px] font-black text-[#ff2a6d] flex items-center gap-0.5 animate-pulse mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a6d]" /> LIVE
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="font-mono font-black text-xs sm:text-sm text-[#ff2a6d]">
                              {timeSlot.startTime}
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                              นัดที่ {m.matchNumber}
                            </span>
                            {consecutiveTeam ? (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.2 rounded-full mt-0.5 text-center truncate max-w-[85px]" title="ทีมนี้ลงเล่นในนัดก่อนหน้า">
                                ⚡ {consecutiveTeam.name}
                              </span>
                            ) : (
                              <span className="text-[8px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1 rounded-full mt-0.5">
                                🟢 ได้พักแล้ว
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* AWAY TEAM */}
                      <div className="flex-1 flex items-center justify-start gap-2.5 min-w-0">
                        <TeamCrest teamName={away?.name} color={away?.color} size="md" />
                        <span className="text-xs sm:text-sm font-black text-slate-800 truncate text-left">
                          {away?.name || 'ทีมเยือน'}
                        </span>
                      </div>
                    </div>

                    {/* QUICK GOALS SUMMARY (IF COMPACT) */}
                    {!isExpanded && m.goals && m.goals.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                        {m.goals.map((g, goalIdx) => {
                          const p = players.find(x => x.id === g.playerId);
                          return (
                            <span key={goalIdx} className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-slate-800 font-bold">{p?.nickname || 'นักเตะ'}</span>
                              <span className="text-slate-400">({g.minute}')</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* EXPAND/COLLAPSE HINT */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100/70 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {timeSlot.startTime} - {timeSlot.endTime} น.
                      </span>
                      <div className="inline-flex items-center gap-1 text-[#ff2a6d] font-bold text-[10px]">
                        <span>{isExpanded ? 'ซ่อน' : 'ดูผู้เล่น'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* EXPANDABLE SECTION (SQUADS & MATCH BREAKDOWN) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 space-y-3 animate-in fade-in duration-150">
                      {/* TWO-COLUMN SQUAD LINEUP */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* HOME TEAM SQUAD */}
                        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <TeamCrest teamName={home?.name} color={home?.color} size="xs" />
                              <span className="font-black text-xs text-slate-900 truncate">
                                {home?.name || 'ทีมเหย้า'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {homePlayers.length} คน
                            </span>
                          </div>

                          {homePlayers.length === 0 ? (
                            <p className="text-[11px] text-slate-400 text-center py-2 italic">
                              ยังไม่มีนักเตะในทีมนี้
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {homePlayers.map(p => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <PlayerAvatar
                                      nickname={p.nickname}
                                      avatarUrl={p.avatarUrl}
                                      size="xs"
                                    />
                                    <span className="font-bold text-slate-900 truncate">
                                      {p.nickname}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-amber-600">
                                    ★{p.skillRating || 3}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AWAY TEAM SQUAD */}
                        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <TeamCrest teamName={away?.name} color={away?.color} size="xs" />
                              <span className="font-black text-xs text-slate-900 truncate">
                                {away?.name || 'ทีมเยือน'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {awayPlayers.length} คน
                            </span>
                          </div>

                          {awayPlayers.length === 0 ? (
                            <p className="text-[11px] text-slate-400 text-center py-2 italic">
                              ยังไม่มีนักเตะในทีมนี้
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {awayPlayers.map(p => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <PlayerAvatar
                                      nickname={p.nickname}
                                      avatarUrl={p.avatarUrl}
                                      size="xs"
                                    />
                                    <span className="font-bold text-slate-900 truncate">
                                      {p.nickname}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-amber-600">
                                    ★{p.skillRating || 3}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* EXPANDED GOALS TIMELINE */}
                      {m.goals && m.goals.length > 0 && (
                        <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs space-y-1.5">
                          <span className="text-[11px] font-black text-slate-800 block">
                            ⚽ ไทม์ไลน์การทำประตู ({m.goals.length} ประตู)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {m.goals.map((g, gIdx) => {
                              const scorer = players.find(x => x.id === g.playerId);
                              const scorerTeam = session.teams.find(t => t.id === g.teamId);
                              return (
                                <div
                                  key={gIdx}
                                  className="flex items-center justify-between p-2 rounded-xl bg-rose-50/40 border border-rose-100 text-xs"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FootballIcon className="w-3.5 h-3.5 text-[#ff2a6d] shrink-0" />
                                    <span className="font-bold text-slate-900 truncate">
                                      {scorer?.nickname || 'ไม่ระบุ'}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      ({scorerTeam?.name || '-'})
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                                    นาทีที่ {g.minute}'
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ACTION CONTROLS IN EXPANDED VIEW */}
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isLive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsTimerRunning(false);
                                soundManager.playWhistle();
                                onUpdateMatch({
                                  ...m,
                                  homeScore: m.homeScore ?? 0,
                                  awayScore: m.awayScore ?? 0,
                                  status: 'finished',
                                });
                              }}
                              className="py-1.5 px-3.5 rounded-full bg-[#ff2a6d] hover:bg-[#ff007f] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>จบเกมนี้</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateMatch({ ...m, status: 'live' });
                              }}
                              className="py-1.5 px-3.5 rounded-full bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>เริ่มแข่งคู่นี้</span>
                            </button>
                          )}

                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenFullMatchEdit(m)}
                                className="py-1.5 px-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>แก้ไขแมตช์</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingMatch(m)}
                                className="py-1.5 px-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>ลบ</span>
                              </button>
                            </>
                          ) : isFinished ? (
                            <button
                              onClick={() => handleOpenScoreEdit(m)}
                              className="py-1.5 px-3 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-2xs cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>แก้ไขผล</span>
                            </button>
                          ) : null}
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {m.id}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* ADMIN FULL MATCH EDIT MODAL */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    แก้ไขข้อมูลแมตช์ (แอดมิน)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ปรับเปลี่ยนทีม, เวลา, สถานะ และผลคะแนน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMatch(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Row 1: Match Number & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ลำดับนัดที่ (Match #):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editMatchForm.matchNumber}
                    onChange={e => setEditMatchForm({ ...editMatchForm, matchNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    เวลาแข่งขัน (นาที):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editMatchForm.durationMinutes}
                    onChange={e => setEditMatchForm({ ...editMatchForm, durationMinutes: parseInt(e.target.value) || 7 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Teams Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ทีมเหย้า (Home Team):
                  </label>
                  <select
                    value={editMatchForm.homeTeamId}
                    onChange={e => setEditMatchForm({ ...editMatchForm, homeTeamId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {session.teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    ทีมเยือน (Away Team):
                  </label>
                  <select
                    value={editMatchForm.awayTeamId}
                    onChange={e => setEditMatchForm({ ...editMatchForm, awayTeamId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {session.teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  สถานะการแข่งขัน:
                </label>
                <select
                  value={editMatchForm.status}
                  onChange={e => setEditMatchForm({ ...editMatchForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="scheduled">รอแข่งขัน (Scheduled)</option>
                  <option value="live">กำลังแข่งขัน (Live)</option>
                  <option value="finished">จบการแข่งขัน (Finished)</option>
                </select>
              </div>

              {/* Row 4: Scores */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  ผลคะแนนประตู (ใส่ค่าว่างหากยังไม่จบเกม):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <span className="text-[11px] text-slate-600 font-semibold block mb-1 truncate">
                      {getTeam(editMatchForm.homeTeamId)?.name || 'ทีมเหย้า'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="-"
                      value={editMatchForm.homeScore}
                      onChange={e => setEditMatchForm({ ...editMatchForm, homeScore: e.target.value })}
                      className="w-full text-center text-xl font-black bg-white border border-slate-300 rounded-xl py-1.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] text-slate-600 font-semibold block mb-1 truncate">
                      {getTeam(editMatchForm.awayTeamId)?.name || 'ทีมเยือน'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="-"
                      value={editMatchForm.awayScore}
                      onChange={e => setEditMatchForm({ ...editMatchForm, awayScore: e.target.value })}
                      className="w-full text-center text-xl font-black bg-white border border-slate-300 rounded-xl py-1.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Goals List Management */}
              {editMatchForm.goals && editMatchForm.goals.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    รายการผู้ทำประตู ({editMatchForm.goals.length}):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {editMatchForm.goals.map((g, gIdx) => {
                      const scorer = players.find(x => x.id === g.playerId);
                      const scorerTeam = session.teams.find(t => t.id === g.teamId);
                      return (
                        <div
                          key={gIdx}
                          className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FootballIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800 truncate">
                              {scorer?.nickname || 'ไม่ระบุชื่อ'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({scorerTeam?.name || '-'})
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              นาทีที่ {g.minute}'
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGoalFromEdit(gIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="ลบประตูนี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const mToDelete = editingMatch;
                  setEditingMatch(null);
                  setDeletingMatch(mToDelete);
                }}
                className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบแมตช์นี้</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="py-2 px-3.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveFullMatchEdit}
                  className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MATCH CONFIRMATION MODAL */}
      {deletingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                ยืนยันการลบแมตช์การแข่งขัน?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบรายการแข่งนี้
              </p>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-rose-950">
                นัดที่ {deletingMatch.matchNumber}: {getTeam(deletingMatch.homeTeamId)?.name} vs {getTeam(deletingMatch.awayTeamId)?.name}
              </div>
              <div className="text-[11px] text-rose-700">
                สถานะ: {deletingMatch.status === 'live' ? 'กำลังเตะ' : deletingMatch.status === 'finished' ? 'จบการแข่งขัน' : 'รอแข่งขัน'}
                {deletingMatch.homeScore !== null && ` (สกอร์ ${deletingMatch.homeScore} - ${deletingMatch.awayScore})`}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              * ข้อมูลสกอร์และผู้ทำประตูของแมตช์นี้จะถูกลบออก และลำดับนัดที่เหลือจะถูกจัดเรียงใหม่อัตโนมัติ
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingMatch(null)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                ยืนยันลบแมตช์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM MATCH MODAL */}
      {isAddMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    เพิ่มแมตช์ใหม่
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    กำหนดคู่แข่งขันและเวลา
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMatchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ทีมเหย้า:
                </label>
                <select
                  value={newMatchHomeTeamId}
                  onChange={e => setNewMatchHomeTeamId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {session.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  ทีมเยือน:
                </label>
                <select
                  value={newMatchAwayTeamId}
                  onChange={e => setNewMatchAwayTeamId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {session.teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  เวลาแข่งขัน (นาที):
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={newMatchDuration}
                  onChange={e => setNewMatchDuration(parseInt(e.target.value) || 7)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  สถานะการแข่งขัน:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewMatchStatus('scheduled')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      newMatchStatus === 'scheduled'
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    รอแข่ง
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMatchStatus('live')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      newMatchStatus === 'live'
                        ? 'bg-rose-100 border-rose-400 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    กำลังแข่ง
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMatchStatus('finished')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      newMatchStatus === 'finished'
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    จบแล้ว
                  </button>
                </div>
              </div>

              {/* Score input if finished or live */}
              {(newMatchStatus === 'finished' || newMatchStatus === 'live') && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500">ผลการแข่งขันเริ่มต้น (ไม่บังคับ):</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-600 truncate block">
                        {getTeam(newMatchHomeTeamId)?.name || 'เหย้า'}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newMatchHomeScore}
                        onChange={e => setNewMatchHomeScore(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 truncate block">
                        {getTeam(newMatchAwayTeamId)?.name || 'เยือน'}:
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={newMatchAwayScore}
                        onChange={e => setNewMatchAwayScore(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
                <span>ลำดับที่จะถูกเพิ่ม:</span>
                <span className="font-bold font-mono">นัดที่ {session.matches.length + 1}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddMatchModalOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveAddMatch}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                เพิ่มแมตช์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL MATCHES CONFIRMATION MODAL */}
      {isConfirmClearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                ล้างตารางแข่งขันทั้งหมด?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                การดำเนินการนี้จะลบทั้ง {session.matches.length} แมตช์ออกจากเซสชันนี้
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              * คุณสามารถใช้ปุ่มคำนวณและสร้างตารางแข่งอัตโนมัติเพื่อสร้างใหม่ได้ทุกเมื่อ
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearAllMatches) onClearAllMatches();
                  setIsConfirmClearAllOpen(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                ยืนยันล้างทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCORE EDIT MODAL */}
      {editingScoreMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3 text-center">
              บันทึกสกอร์ นัดที่ {editingScoreMatch.matchNumber}
            </h3>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  {getTeam(editingScoreMatch.homeTeamId)?.name}
                </span>
                <input
                  type="number"
                  min="0"
                  value={homeScoreInput}
                  onChange={e => setHomeScoreInput(parseInt(e.target.value) || 0)}
                  className="w-full text-center text-3xl font-black bg-slate-50 border border-slate-300 rounded-xl py-2.5 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  {getTeam(editingScoreMatch.awayTeamId)?.name}
                </span>
                <input
                  type="number"
                  min="0"
                  value={awayScoreInput}
                  onChange={e => setAwayScoreInput(parseInt(e.target.value) || 0)}
                  className="w-full text-center text-3xl font-black bg-slate-50 border border-slate-300 rounded-xl py-2.5 text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingScoreMatch(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveScore}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                บันทึกผลแข่ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOAL SCORER SELECTOR MODAL */}
      {goalScorerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-0.5">
              เลือกผู้ทำประตู
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              สำหรับ {getTeam(goalScorerModal.teamId)?.name}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-1.5 my-3 pr-1">
              {getTeam(goalScorerModal.teamId)?.playerIds.map(pid => {
                const p = players.find(x => x.id === pid);
                if (!p) return null;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddGoal(goalScorerModal.match, goalScorerModal.teamId, p.id)}
                    className="w-full p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-left text-xs text-slate-800 flex items-center justify-between border border-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <PlayerAvatar nickname={p.nickname} avatarUrl={p.avatarUrl} size="sm" />
                      <span className="font-bold">{p.nickname}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">{p.name}</span>
                  </button>
                );
              })}

              <button
                onClick={() => handleAddGoal(goalScorerModal.match, goalScorerModal.teamId, undefined)}
                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs text-center border border-dashed border-slate-300 cursor-pointer"
              >
                ไม่ระบุชื่อผู้ทำประตู (ทำประตูตัวเอง / อื่นๆ)
              </button>
            </div>

            <button
              onClick={() => setGoalScorerModal(null)}
              className="w-full py-2 mt-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* POSTER MODAL */}
      <SchedulePosterModal
        session={session}
        players={players}
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
      />
    </div>
  );
};
