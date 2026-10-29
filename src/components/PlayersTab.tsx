import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Star,
  Shuffle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Camera,
  CalendarCheck,
  UserCheck,
  Check,
  X,
  Shield,
  AlertCircle,
  Sparkles,
  ChevronDown,
  QrCode,
  CreditCard,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { FootballSession, Player, Team } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { SendReminderModal } from './SendReminderModal';
import { RegisterQRModal } from './RegisterQRModal';
import { compressImage } from '../utils/imageUtils';

interface PlayersTabProps {
  players: Player[];
  activeSession: FootballSession | null;
  isAdmin: boolean;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onAssignTeamsToSession?: (teams: Team[]) => void;
  onToggleAttendance?: (playerId: string, isAttending?: boolean) => void;
  onRegisterPlayerTeam?: (playerId: string, teamId: string | null, isAttending: boolean) => void;
  onOpenPaymentModal?: (playerId?: string) => void;
  onOpenTeamManager?: () => void;
  onAddTeam?: (teamData: { name: string; color: any }) => void;
  onUpdateTeam?: (team: Team) => void;
  onDeleteTeam?: (teamId: string) => void;
}

export const PlayersTab: React.FC<PlayersTabProps> = ({
  players,
  activeSession,
  isAdmin,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onAssignTeamsToSession,
  onToggleAttendance,
  onRegisterPlayerTeam,
  onOpenPaymentModal,
  onOpenTeamManager,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
}) => {
  // Main Sub-Tab Mode: 'weekly_checkin' | 'all_roster'
  const [subTab, setSubTab] = useState<'weekly_checkin' | 'all_roster'>('weekly_checkin');

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMode, setDraftMode] = useState<'attending_only' | 'all'>('attending_only');

  // Modals & Self Check-in
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [isRegisterQROpen, setIsRegisterQROpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form Fields for Add/Edit Player
  const [nameInput, setNameInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [defaultTeamInput, setDefaultTeamInput] = useState<string>('');
  const [skillInput, setSkillInput] = useState<number>(3);
  const [avatarInput, setAvatarInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Check URL search parameters on mount (for QR scan to open All Roster and Add Player directly)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const actionParam = params.get('action');

      if (viewParam === 'all_roster' || actionParam === 'add_player') {
        setSubTab('all_roster');
      }

      if (actionParam === 'add_player') {
        setEditingPlayer(null);
        setNameInput('');
        setNicknameInput('');
        setDefaultTeamInput('');
        setSkillInput(3);
        setAvatarInput('');
        setShowAddModal(true);
      }
    } catch (e) {
      console.error('URL params parse error:', e);
    }
  }, []);

  // Self Registration State
  const [selectedSelfPlayerId, setSelectedSelfPlayerId] = useState<string>('');
  const [selectedSelfTeamId, setSelectedSelfTeamId] = useState<string>('unassigned');
  const [selfSuccessMsg, setSelfSuccessMsg] = useState<string | null>(null);
  const [selfPlayerSearchQuery, setSelfPlayerSearchQuery] = useState('');
  const [isSelfPlayerSearchOpen, setIsSelfPlayerSearchOpen] = useState(false);

  const maxPlayersPerTeam = activeSession?.maxPlayersPerTeam || 7;
  const attendingIds = activeSession?.attendingPlayerIds || [];
  const teams = activeSession?.teams || [];

  // Helper to check if a player has paid in active session
  const isPlayerPaid = (playerId: string): boolean => {
    if (!activeSession) return false;
    return (activeSession.payments || []).some(p => p.playerId === playerId && p.isPaid);
  };

  const totalCount = players.length;
  const attendingCount = attendingIds.length;
  const absentCount = totalCount - attendingCount;
  const paidCount = attendingIds.filter(id => isPlayerPaid(id)).length;
  const unpaidCount = attendingCount - paidCount;

  // Helper to find team of a player in current session
  const getPlayerTeam = (playerId: string): Team | undefined => {
    return teams.find(t => t.playerIds.includes(playerId));
  };

  // Helper to get styled badge for default team
  const getDefaultTeamBadge = (defaultTeam?: string) => {
    if (!defaultTeam || defaultTeam === 'อิสระ') {
      return (
        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 font-medium text-slate-500 border border-slate-200 inline-block whitespace-nowrap">
          อิสระ
        </span>
      );
    }

    const lower = defaultTeam.toLowerCase();
    let badgeClasses = 'bg-slate-100 text-slate-800 border-slate-200';
    let dotColor = 'bg-slate-500';

    if (lower.includes('tea-or') || lower.includes('แดง') || lower.includes('red')) {
      badgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
    } else if (lower.includes('kopi-or') || lower.includes('เขียว') || lower.includes('green')) {
      badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      dotColor = 'bg-emerald-500';
    } else if (lower.includes('agsa') || lower.includes('น้ำเงิน') || lower.includes('ฟ้า') || lower.includes('blue')) {
      badgeClasses = 'bg-sky-50 text-sky-800 border-sky-200';
      dotColor = 'bg-sky-500';
    } else if (lower.includes('bloom') || lower.includes('ดำ') || lower.includes('black')) {
      badgeClasses = 'bg-slate-900 text-white border-slate-800';
      dotColor = 'bg-slate-400';
    } else if (lower.includes('เหลือง') || lower.includes('yellow')) {
      badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      dotColor = 'bg-amber-500';
    }

    return (
      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border inline-flex items-center gap-1 shadow-2xs whitespace-nowrap ${badgeClasses}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
        <span className="truncate max-w-[65px] sm:max-w-none">{defaultTeam}</span>
      </span>
    );
  };

  // Filter players for all_roster
  const filteredPlayers = players.filter(p => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.defaultTeam && p.defaultTeam.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Handle Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetPlayer?: Player) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedUrl = await compressImage(file, 300, 300, 0.82);

      if (targetPlayer) {
        onUpdatePlayer({
          ...targetPlayer,
          avatarUrl: compressedUrl,
        });
      } else {
        setAvatarInput(compressedUrl);
      }
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput) return;
    onAddPlayer({
      name: nameInput || nicknameInput,
      nickname: nicknameInput,
      defaultTeam: defaultTeamInput.trim() || undefined,
      skillRating: skillInput,
      avatarUrl: avatarInput || undefined,
    });
    setNameInput('');
    setNicknameInput('');
    setDefaultTeamInput('');
    setSkillInput(3);
    setAvatarInput('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !nicknameInput) return;
    onUpdatePlayer({
      ...editingPlayer,
      name: nameInput || nicknameInput,
      nickname: nicknameInput,
      defaultTeam: defaultTeamInput.trim() || undefined,
      skillRating: skillInput,
      avatarUrl: avatarInput || undefined,
    });
    setEditingPlayer(null);
    setDefaultTeamInput('');
    setAvatarInput('');
  };

  const handleOpenEdit = (p: Player) => {
    setEditingPlayer(p);
    setNameInput(p.name);
    setNicknameInput(p.nickname);
    setDefaultTeamInput(p.defaultTeam || '');
    setSkillInput(p.skillRating || 3);
    setAvatarInput(p.avatarUrl || '');
  };

  // Self Registration Submit Handler
  const handleSelfRegisterSubmit = (isAttending: boolean) => {
    if (!selectedSelfPlayerId) {
      alert('กรุณาเลือกชื่อของคุณก่อนลงทะเบียน');
      return;
    }

    const player = players.find(p => p.id === selectedSelfPlayerId);
    const nickname = player?.nickname || 'นักเตะ';

    if (!isAttending) {
      if (onRegisterPlayerTeam) {
        onRegisterPlayerTeam(selectedSelfPlayerId, null, false);
      } else if (onToggleAttendance) {
        onToggleAttendance(selectedSelfPlayerId, false);
      }
      setSelfSuccessMsg(`❌ บันทึกการขอลาของ ${nickname} เรียบร้อยแล้ว`);
    } else {
      const targetTeamId = selectedSelfTeamId === 'unassigned' ? null : selectedSelfTeamId;
      if (onRegisterPlayerTeam) {
        onRegisterPlayerTeam(selectedSelfPlayerId, targetTeamId, true);
      } else if (onToggleAttendance) {
        onToggleAttendance(selectedSelfPlayerId, true);
      }

      const teamObj = teams.find(t => t.id === targetTeamId);
      const teamName = teamObj ? teamObj.name : 'รอจัดทีม';
      setSelfSuccessMsg(`✅ ยืนยันการลงทะเบียน! ${nickname} ลงชื่อสังกัดทีม ${teamName} สัปดาห์นี้แล้ว`);
    }

    setTimeout(() => {
      setSelfSuccessMsg(null);
    }, 4500);
  };

  // Quick join button on team card
  const handleQuickJoinTeam = (teamId: string) => {
    if (!selectedSelfPlayerId) {
      alert('กรุณาเลือกชื่อของคุณในช่อง "ลงทะเบียน & เลือกทีม" ด้านบนก่อนกดเข้าทีม');
      return;
    }
    const targetTeam = teams.find(t => t.id === teamId);
    if (!targetTeam) return;

    if (targetTeam.playerIds.length >= maxPlayersPerTeam && !targetTeam.playerIds.includes(selectedSelfPlayerId)) {
      alert(`ทีม ${targetTeam.name} เต็มแล้ว (สูงสุด ${maxPlayersPerTeam} คน/ทีม)`);
      return;
    }

    if (onRegisterPlayerTeam) {
      onRegisterPlayerTeam(selectedSelfPlayerId, teamId, true);
    }
    const player = players.find(p => p.id === selectedSelfPlayerId);
    setSelfSuccessMsg(`✅ ${player?.nickname || 'คุณ'} เข้าร่วมทีม ${targetTeam.name} เรียบร้อยแล้ว!`);
    setTimeout(() => setSelfSuccessMsg(null), 4000);
  };

  // Random Auto Draft Teams Handler
  const handleRandomDraftTeams = (teamCount: 3 | 4 = 4) => {
    if (!onAssignTeamsToSession) return;

    const candidateList =
      draftMode === 'attending_only'
        ? players.filter(p => attendingIds.includes(p.id))
        : players;

    if (candidateList.length === 0) {
      alert(draftMode === 'attending_only' ? 'ยังไม่มีนักเตะที่ลงชื่อมาเตะเพื่อสุ่มแบ่งทีม' : 'ไม่มีรายชื่อนักเตะในระบบเพื่อสุ่มแบ่งทีม');
      return;
    }

    const shuffled = [...candidateList].sort(() => Math.random() - 0.5);

    const defaultTeamNames = [
      { name: 'TEA-OR', color: 'red' as const },
      { name: 'KOPI-OR', color: 'green' as const },
      { name: 'AGSA', color: 'blue' as const },
      { name: 'BLOOM', color: 'black' as const },
    ];

    const newTeams: Team[] = Array.from({ length: teamCount }).map((_, idx) => {
      const existingTeam = teams[idx];
      return {
        id: existingTeam ? existingTeam.id : `t_${Date.now()}_${idx + 1}`,
        name: existingTeam?.name || defaultTeamNames[idx]?.name || `ทีม ${idx + 1}`,
        color: existingTeam?.color || defaultTeamNames[idx]?.color || 'black',
        playerIds: [],
      };
    });

    shuffled.forEach((p, idx) => {
      const teamIndex = idx % teamCount;
      // Respect max limit per team if possible
      if (newTeams[teamIndex].playerIds.length < maxPlayersPerTeam) {
        newTeams[teamIndex].playerIds.push(p.id);
      } else {
        // Find next team with space
        const avail = newTeams.find(t => t.playerIds.length < maxPlayersPerTeam);
        if (avail) avail.playerIds.push(p.id);
        else newTeams[teamIndex].playerIds.push(p.id);
      }
    });

    onAssignTeamsToSession(newTeams);
    setSelfSuccessMsg(`🎲 สุ่มแบ่งนักเตะ ${shuffled.length} คน ลง ${teamCount} ทีม เรียบร้อยแล้ว!`);
    setTimeout(() => setSelfSuccessMsg(null), 4000);
  };

  // Unassigned attending players (attending but not assigned to any team in session)
  const assignedPlayerIds = teams.flatMap(t => t.playerIds);
  const unassignedAttendingPlayers = players.filter(
    p => attendingIds.includes(p.id) && !assignedPlayerIds.includes(p.id)
  );

  return (
    <div className="space-y-3.5 pb-20">
      {/* SUB-NAV MODE SWITCHER */}
      <div className="grid grid-cols-2 p-1 bg-slate-200/80 rounded-2xl text-[11px] font-bold shadow-inner">
        <button
          onClick={() => setSubTab('weekly_checkin')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'weekly_checkin'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ลงชื่อ & จัดทีม</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-mono">
            {attendingCount} คน
          </span>
        </button>

        <button
          onClick={() => setSubTab('all_roster')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            subTab === 'all_roster'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-600" />
          <span>สมาชิกทั้งหมด</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-100 text-slate-700 font-mono">
            {totalCount} คน
          </span>
        </button>
      </div>

      {/* VIEW 1: WEEKLY CHECK-IN & REGISTRATION */}
      {subTab === 'weekly_checkin' && (
        <div className="space-y-3">
          {/* SESSION BANNER */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl shadow-sm border border-emerald-700/50">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-emerald-200 font-medium flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5 text-emerald-300" />
                ลงชื่อ & จัดทีมประจำสัปดาห์
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 font-bold text-[10px] border border-emerald-400/30">
                {activeSession ? activeSession.title : 'สัปดาห์ปัจจุบัน'}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">
                  ลงชื่อ & จัดทีม
                </h3>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  {activeSession?.timeRange || '20:00 - 22:00 น.'} • {activeSession?.location || 'สนามซอย 9'}
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black font-mono text-emerald-300">
                  {attendingCount} <span className="text-xs font-sans text-emerald-200 font-normal">คน</span>
                </div>
                <span className="text-[10px] text-emerald-200 font-medium">
                  กำหนดทีมละไม่เกิน {maxPlayersPerTeam} คน
                </span>
              </div>
            </div>
          </div>

          {/* QUICK SELF REGISTRATION BAR */}
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900">เลือกชื่อของคุณเพื่อลงสนาม</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {selectedSelfPlayerId ? 'แตะเข้าทีมด้านล่างได้ทันที' : 'ค้นหาหรือแตะเลือกชื่อของคุณ'}
              </span>
            </div>

            {selfSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selfSuccessMsg}</span>
              </div>
            )}

            {/* Quick Select Input + Direct Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={
                      isSelfPlayerSearchOpen
                        ? selfPlayerSearchQuery
                        : selectedSelfPlayerId
                        ? (() => {
                            const p = players.find(x => x.id === selectedSelfPlayerId);
                            return p ? `${p.nickname}${p.name ? ` (${p.name})` : ''}` : '';
                          })()
                        : ''
                    }
                    onChange={e => {
                      setSelfPlayerSearchQuery(e.target.value);
                      if (!isSelfPlayerSearchOpen) setIsSelfPlayerSearchOpen(true);
                    }}
                    onFocus={() => setIsSelfPlayerSearchOpen(true)}
                    placeholder="-- ค้นหา หรือแตะเลือกชื่อของคุณ --"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                  {selectedSelfPlayerId || selfPlayerSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSelfPlayerId('');
                        setSelfPlayerSearchQuery('');
                        setIsSelfPlayerSearchOpen(true);
                      }}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  )}
                </div>

                {/* Dropdown */}
                {isSelfPlayerSearchOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsSelfPlayerSearchOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                      {(() => {
                        const matchedPlayers = players.filter(p => {
                          const q = selfPlayerSearchQuery.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            p.nickname.toLowerCase().includes(q) ||
                            p.name.toLowerCase().includes(q)
                          );
                        });

                        if (matchedPlayers.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs space-y-2">
                              <p className="text-slate-500 font-medium">
                                {players.length === 0
                                  ? 'ยังไม่มีสมาชิกในระบบ'
                                  : `ไม่พบชื่อ "${selfPlayerSearchQuery}"`}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSelfPlayerSearchOpen(false);
                                  setNicknameInput(selfPlayerSearchQuery);
                                  setNameInput('');
                                  setDefaultTeamInput('');
                                  setSkillInput(3);
                                  setAvatarInput('');
                                  setEditingPlayer(null);
                                  setShowAddModal(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>+ เพิ่มสมาชิกใหม่</span>
                              </button>
                            </div>
                          );
                        }

                        return matchedPlayers.map(p => {
                          const isSelected = p.id === selectedSelfPlayerId;
                          const pTeam = getPlayerTeam(p.id);
                          const isAtt = attendingIds.includes(p.id);

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedSelfPlayerId(p.id);
                                if (pTeam) {
                                  setSelectedSelfTeamId(pTeam.id);
                                } else if (p.defaultTeam) {
                                  const matchedSessionTeam = teams.find(
                                    t => t.name.toLowerCase() === p.defaultTeam?.toLowerCase()
                                  );
                                  if (matchedSessionTeam) {
                                    setSelectedSelfTeamId(matchedSessionTeam.id);
                                  } else {
                                    setSelectedSelfTeamId('unassigned');
                                  }
                                } else {
                                  setSelectedSelfTeamId('unassigned');
                                }
                                setIsSelfPlayerSearchOpen(false);
                                setSelfPlayerSearchQuery('');
                              }}
                              className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors text-xs ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <PlayerAvatar nickname={p.nickname} avatarUrl={p.avatarUrl} size="sm" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="truncate font-bold">
                                      {p.nickname}
                                    </span>
                                    {p.defaultTeam && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 shrink-0">
                                        {p.defaultTeam}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {p.name || '-'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isAtt ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                    {pTeam ? pTeam.name : 'มาเตะ'}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-normal">ยังไม่ลงชื่อ</span>
                                )}
                                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
              </div>

              {/* Direct Quick Actions for Selected Player */}
              {selectedSelfPlayerId && (
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => handleSelfRegisterSubmit(true)}
                    className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="ยืนยันลงชื่อมาเตะ"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>มาเตะ</span>
                  </button>

                  {onOpenPaymentModal && (
                    <button
                      onClick={() => onOpenPaymentModal(selectedSelfPlayerId)}
                      className="py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      title="เปิด QR Code สแกนจ่ายเงิน"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>จ่าย {activeSession?.feePerPlayer || 100}฿</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleSelfRegisterSubmit(false)}
                    className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="แจ้งลา / ไม่มา"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600 stroke-[2.5]" />
                    <span>ขอลา</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* WEEKLY REGISTRATION SUMMARY TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>สรุปภาพรวมการลงชื่อสัปดาห์นี้</span>
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> จ่ายแล้ว
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> ค้างชำระ
                </span>
              </div>
            </div>

            {/* Summary Grid Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 sm:p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-emerald-800 font-semibold truncate block">ผู้มาเตะทั้งหมด</span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-900 leading-tight mt-0.5">{attendingCount} คน</span>
              </div>

              <div className="p-2 sm:p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-amber-800 font-semibold truncate block">โควตารวม ({teams.length} ทีม)</span>
                <span className="text-sm sm:text-base font-black font-mono text-amber-900 leading-tight mt-0.5">
                  {attendingCount} / {teams.length * maxPlayersPerTeam} คน
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-sky-50/70 border border-sky-200/80 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-sky-800 font-semibold truncate block">จัดลงทีมแล้ว</span>
                <span className="text-sm sm:text-base font-black font-mono text-sky-900 leading-tight mt-0.5">
                  {assignedPlayerIds.length} คน
                </span>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-semibold truncate block">รอสังกัดทีม</span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-800 leading-tight mt-0.5">
                  {unassignedAttendingPlayers.length} คน
                </span>
              </div>
            </div>
          </div>

          {/* AUTO TEAM DRAFT (สุ่มแบ่งทีม - วางตำแหน่งด้านบนให้เห็นชัดเจน ใช้งานได้ทันที) */}
          {onAssignTeamsToSession && (
            <div className="p-3 sm:p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Shuffle className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                        <span>สุ่มแบ่งทีม</span>
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                        ≤{maxPlayersPerTeam} คน/ทีม
                      </span>
                      {isAdmin ? (
                        <span className="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded-md shadow-2xs">
                          แอดมิน
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.5 rounded-md">
                          เฉพาะแอดมิน
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-amber-800 mt-0.5">
                      {draftMode === 'attending_only'
                        ? `สุ่มจัดทีมจากนักเตะที่ลงชื่อมาเตะ (${attendingCount} คน)`
                        : `สุ่มจัดทีมจากสมาชิกทั้งหมดในระบบ (${totalCount} คน)`}
                    </p>
                  </div>
                </div>

                {/* Segmented Filter Pills */}
                <div className="inline-flex bg-white/95 p-1 rounded-xl border border-amber-300 text-xs font-bold self-start sm:self-auto shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDraftMode('attending_only')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      draftMode === 'attending_only'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-amber-900 hover:text-amber-950 hover:bg-amber-50'
                    }`}
                  >
                    คนที่มา ({attendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftMode('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      draftMode === 'all'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-amber-900 hover:text-amber-950 hover:bg-amber-50'
                    }`}
                  >
                    ทั้งหมด ({totalCount})
                  </button>
                </div>
              </div>

              {/* Draft Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAdmin) {
                      alert('กรุณาเข้าสู่ระบบแอดมิน (ไอคอนแม่กุญแจที่แถบด้านบน) เพื่อใช้งานการสุ่มแบ่งทีม');
                      return;
                    }
                    handleRandomDraftTeams(4);
                  }}
                  className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>สุ่ม 4 ทีม</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAdmin) {
                      alert('กรุณาเข้าสู่ระบบแอดมิน (ไอคอนแม่กุญแจที่แถบด้านบน) เพื่อใช้งานการสุ่มแบ่งทีม');
                      return;
                    }
                    handleRandomDraftTeams(3);
                  }}
                  className="py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-900 rounded-xl font-bold text-xs border border-amber-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
                  <span>สุ่ม 3 ทีม</span>
                </button>
              </div>
            </div>
          )}

          {/* UNASSIGNED PLAYERS SUMMARY CARD */}
          {unassignedAttendingPlayers.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>นักเตะที่ลงชื่อมาแล้ว (ยังไม่ได้ระบุทีม)</span>
                </span>
                <span className="font-mono text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 text-[11px]">
                  {unassignedAttendingPlayers.length} คน
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
                {unassignedAttendingPlayers.map(p => (
                  <div
                    key={p.id}
                    className="p-2 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-xs shadow-2xs"
                  >
                    <PlayerAvatar nickname={p.nickname} avatarUrl={p.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{p.nickname}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{p.name || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEAM CARDS VERTICAL LIST (ตารางสมาชิกเรียงลงมาทีละทีม สูงสุด 8 คน/ทีม) */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>ตารางสมาชิกแต่ละทีม ({teams.length} ทีม)</span>
              </h4>
              <div className="flex items-center gap-1.5">
                {isAdmin && onOpenTeamManager && (
                  <button
                    onClick={onOpenTeamManager}
                    className="py-1 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    title="จัดการชื่อทีม เพิ่มทีมใหม่ ลบทีม"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>จัดการทีม (แอดมิน)</span>
                  </button>
                )}
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  โควตาไม่เกิน {maxPlayersPerTeam} คน/ทีม
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {teams.map((t, tIdx) => {
                const teamPlayers = players.filter(p => t.playerIds.includes(p.id));
                const count = teamPlayers.length;
                const isFull = count >= maxPlayersPerTeam;
                const needed = Math.max(0, maxPlayersPerTeam - count);

                const colorBanners: Record<string, { gradient: string; lightBg: string; textBadge: string }> = {
                  red: {
                    gradient: 'from-rose-600 via-rose-700 to-rose-900 text-white',
                    lightBg: 'bg-rose-50/50',
                    textBadge: 'bg-rose-50 text-rose-800 border-rose-200',
                  },
                  green: {
                    gradient: 'from-emerald-600 via-emerald-700 to-teal-900 text-white',
                    lightBg: 'bg-emerald-50/50',
                    textBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  },
                  blue: {
                    gradient: 'from-sky-600 via-sky-700 to-blue-900 text-white',
                    lightBg: 'bg-sky-50/50',
                    textBadge: 'bg-sky-50 text-sky-800 border-sky-200',
                  },
                  black: {
                    gradient: 'from-slate-800 via-slate-900 to-slate-950 text-white',
                    lightBg: 'bg-slate-50/50',
                    textBadge: 'bg-slate-100 text-slate-800 border-slate-300',
                  },
                  orange: {
                    gradient: 'from-amber-500 via-orange-600 to-orange-700 text-white',
                    lightBg: 'bg-orange-50/50',
                    textBadge: 'bg-orange-50 text-orange-800 border-orange-200',
                  },
                };

                const teamStyle = colorBanners[t.color] || {
                  gradient: 'from-slate-700 via-slate-800 to-slate-900 text-white',
                  lightBg: 'bg-slate-50/50',
                  textBadge: 'bg-slate-100 text-slate-800 border-slate-200',
                };

                // Array of empty slots up to maxPlayersPerTeam
                const emptySlotsCount = Math.max(0, maxPlayersPerTeam - count);

                return (
                  <div
                    key={t.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                  >
                    {/* Team Banner */}
                    <div
                      className={`px-4 py-3 bg-gradient-to-r ${teamStyle.gradient} flex items-center justify-between flex-wrap gap-2`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white border border-white/30 text-xs">
                          {tIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                              <Shield className="w-4 h-4 text-white/90" />
                              <span>{t.name}</span>
                            </h4>
                          </div>
                          <p className="text-[10px] text-white/80">
                            ทีม {t.name} • {t.color.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30 text-white">
                          {count} / {maxPlayersPerTeam} คน
                        </span>

                        {isFull ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/90 border border-rose-300 text-white text-[10px] font-black tracking-tight shadow-2xs">
                            🔴 ทีมเต็ม ({maxPlayersPerTeam}/{maxPlayersPerTeam})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 border border-emerald-300 text-slate-950 text-[10px] font-black shadow-2xs">
                            🟢 ว่างอีก {needed} ที่
                          </span>
                        )}

                        {isAdmin && onOpenTeamManager && (
                          <button
                            type="button"
                            onClick={onOpenTeamManager}
                            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                            title="แก้ไขชื่อทีม / เปลี่ยนสี / ลบทีม"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          disabled={isFull}
                          onClick={() => handleQuickJoinTeam(t.id)}
                          className="py-1 px-3 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-40 font-black text-xs rounded-xl shadow-2xs inline-flex items-center gap-1 transition-all active:scale-95 shrink-0 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3 text-emerald-600" />
                          <span>เข้าทีมนี้</span>
                        </button>
                      </div>
                    </div>

                    {/* Team Roster Table */}
                    <div className="p-3 space-y-2">
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs divide-y divide-slate-200 min-w-[300px]">
                          <thead className="bg-slate-50 text-[11px] font-bold text-slate-600">
                            <tr>
                              <th className="py-2 px-2 text-center w-8">#</th>
                              <th className="py-2 px-3">นักเตะในทีม ({count}/{maxPlayersPerTeam})</th>
                              <th className="py-2 px-2 text-center w-14">จ่ายเงิน</th>
                              <th className="py-2 px-2 text-center w-14">ฝีมือ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {teamPlayers.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-5 text-center text-slate-400 font-medium">
                                  ยังไม่มีนักเตะในทีมนี้ (เปิดรับสูงสุด {maxPlayersPerTeam} คน)
                                </td>
                              </tr>
                            ) : (
                              teamPlayers.map((p, idx) => {
                                const paid = isPlayerPaid(p.id);
                                return (
                                  <tr
                                    key={p.id}
                                    className={`transition-colors hover:bg-slate-50/80 ${
                                      !paid ? 'bg-rose-50/30' : ''
                                    }`}
                                  >
                                    <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-400 font-bold">
                                      {idx + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <PlayerAvatar nickname={p.nickname} avatarUrl={p.avatarUrl} size="sm" />
                                        <div className="min-w-0">
                                          <span className="font-bold text-slate-900 text-xs block truncate leading-tight">
                                            {p.nickname}
                                          </span>
                                          <span className="text-[10px] text-slate-400 block truncate leading-tight">
                                            {p.name || '-'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      {paid ? (
                                        <button
                                          type="button"
                                          onClick={() => onOpenPaymentModal?.(p.id)}
                                          className="w-5 h-5 rounded-full bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 inline-flex items-center justify-center cursor-pointer shadow-2xs transition-all active:scale-95 mx-auto"
                                          title="จ่ายแล้ว (แตะเพื่อดูรายละเอียด/สลิป)"
                                        >
                                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => onOpenPaymentModal?.(p.id)}
                                          className="w-5 h-5 rounded-full bg-rose-100 hover:bg-rose-200 border border-rose-300 inline-flex items-center justify-center cursor-pointer shadow-2xs transition-all active:scale-95 mx-auto"
                                          title={`ค้างชำระ ${activeSession?.feePerPlayer || 100}฿ (แตะเพื่อชำระเงิน/แนบสลิป)`}
                                        >
                                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                                        </button>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center">
                                      <div className="inline-flex items-center justify-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 text-[10px] font-bold font-mono">
                                        <Star className="w-2.5 h-2.5 fill-current text-amber-500" />
                                        <span>{p.skillRating || 3}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}

                            {/* Dotted empty slots rows up to 8 to show exact quota breakdown */}
                            {Array.from({ length: emptySlotsCount }).map((_, slotIdx) => {
                              const slotNumber = count + slotIdx + 1;
                              return (
                                <tr key={`empty_slot_${slotIdx}`} className="bg-slate-50/40 text-slate-300 text-xs">
                                  <td className="py-1.5 px-2 text-center font-mono text-[10px] text-slate-300 font-medium">
                                    {slotNumber}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-400 italic text-[11px]">
                                    <span className="inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                      ว่าง (รอสมาชิก โควตาลำดับที่ {slotNumber})
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 text-center text-slate-300 text-[10px]">-</td>
                                  <td className="py-1.5 px-2 text-center text-slate-300 text-[10px]">-</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer Info for Team */}
                      <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {isFull
                            ? `ทีม ${t.name} มีสมาชิกครบเต็มจำนวน ${maxPlayersPerTeam} คนแล้ว`
                            : `มีสมาชิก ${count} คน (ยังว่างอีก ${needed} คน จากโควตาสูงสุด ${maxPlayersPerTeam} คน)`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ALL ROSTER DIRECTORY */}
      {subTab === 'all_roster' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาสมาชิก..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder-slate-400 shadow-2xs focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                  title="ล้างคำค้นหา"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsRegisterQROpen(true)}
                className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer transition-colors active:scale-95"
                id="btn-open-register-qr-all-roster"
                title="เปิด QR Code สมาชิก & บันทึกรูปส่งกลุ่ม LINE"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                <span>QR ลงชื่อ</span>
              </button>

              <button
                onClick={() => {
                  setEditingPlayer(null);
                  setNameInput('');
                  setNicknameInput('');
                  setDefaultTeamInput('');
                  setSkillInput(3);
                  setAvatarInput('');
                  setShowAddModal(true);
                }}
                className="py-1.5 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 shadow-2xs hover:bg-emerald-700 cursor-pointer"
                id="btn-add-player"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ เพิ่มสมาชิก</span>
              </button>
            </div>
          </div>

          {/* ALL ROSTER DIRECTORY TABLE */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs divide-y divide-slate-200 table-fixed">
              <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-2 text-center w-8 sm:w-10">#</th>
                  <th className="py-2.5 px-2 sm:px-3 w-[42%] sm:w-[45%]">สมาชิก</th>
                  <th className="py-2.5 px-1.5 sm:px-2 text-center w-[22%] sm:w-[20%]">สังกัดทีม</th>
                  <th className="py-2.5 px-1.5 sm:px-2 text-center w-[16%] sm:w-[15%]">ฝีมือ</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right w-[18%] sm:w-[15%]">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      ไม่พบข้อมูลสมาชิกที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 text-center font-mono text-[10px] sm:text-[11px] text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                          <div className="relative group shrink-0">
                            <PlayerAvatar
                              nickname={p.nickname}
                              name={p.name}
                              avatarUrl={p.avatarUrl}
                              size="xs"
                            />
                            <label className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-600 cursor-pointer shadow-xs hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                              <Camera className="w-1.5 h-1.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => handlePhotoUpload(e, p)}
                              />
                            </label>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1 min-w-0">
                              <span className="truncate">{p.nickname}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate leading-tight">
                              {p.name || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        {getDefaultTeamBadge(p.defaultTeam)}
                      </td>

                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        <div className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-50/80 px-1.5 py-0.5 rounded-md border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span className="text-[10px] font-mono font-bold">{p.skillRating || 3}</span>
                        </div>
                      </td>

                      <td className="py-2 px-2 sm:px-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 sm:p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors"
                            title="แก้ไขข้อมูล/สังกัดทีม/รูปภาพ"
                          >
                            <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => onDeletePlayer(p.id)}
                              className="p-1 sm:p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 cursor-pointer transition-colors"
                              title="ลบสมาชิก"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PLAYER MODAL */}
      {(showAddModal || editingPlayer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 text-slate-900 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>{editingPlayer ? 'แก้ไขข้อมูลนักเตะ' : 'เพิ่มสมาชิกใหม่'}</span>
            </h3>

            <form onSubmit={editingPlayer ? handleSaveEdit : handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <PlayerAvatar
                  nickname={nicknameInput || 'นักเตะ'}
                  avatarUrl={avatarInput}
                  size="xl"
                />

                <div className="space-y-1.5 flex-1">
                  <span className="block text-[11px] font-bold text-slate-700">
                    รูปโปรไฟล์นักเตะ
                  </span>

                  <div className="flex items-center gap-1.5">
                    <label className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer inline-flex items-center gap-1 shadow-2xs">
                      <Camera className="w-3 h-3" />
                      <span>{avatarInput ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>

                    {avatarInput && (
                      <button
                        type="button"
                        onClick={() => setAvatarInput('')}
                        className="py-1 px-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-bold text-[11px] rounded-lg"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>

                  {isCompressing && (
                    <p className="text-[10px] text-emerald-700 font-medium">กำลังประมวลผลรูปภาพ...</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ชื่อเล่น (Nickname) *</label>
                <input
                  type="text"
                  required
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  placeholder="เช่น บอล, ต่าย, อาร์ม"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ชื่อ-นามสกุลจริง</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="เช่น กิตติศักดิ์ ศรีสุข"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold flex items-center justify-between">
                  <span>สังกัดทีมหลัก (Default Team)</span>
                  <span className="text-[10px] text-slate-400 font-normal">เปลี่ยนทีมวันเตะจริงได้อิสระ</span>
                </label>
                <div className="space-y-1.5">
                  <select
                    value={
                      ['TEA-OR', 'KOPI-OR', 'AGSA', 'BLOOM', ''].includes(defaultTeamInput)
                        ? defaultTeamInput
                        : 'custom'
                    }
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setDefaultTeamInput('ทีมใหม่');
                      } else {
                        setDefaultTeamInput(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- อิสระ (ไม่มีสังกัดประจำ) --</option>
                    <option value="TEA-OR">🔴 TEA-OR (ทีมสีแดง)</option>
                    <option value="KOPI-OR">🟢 KOPI-OR (ทีมสีเขียว)</option>
                    <option value="AGSA">🔵 AGSA (ทีมสีน้ำเงิน)</option>
                    <option value="BLOOM">⚫ BLOOM (ทีมสีดำ)</option>
                    <option value="custom">✏️ ระบุชื่อสังกัดทีมอื่นๆ...</option>
                  </select>

                  {!['TEA-OR', 'KOPI-OR', 'AGSA', 'BLOOM', ''].includes(defaultTeamInput) && (
                    <input
                      type="text"
                      value={defaultTeamInput}
                      onChange={e => setDefaultTeamInput(e.target.value)}
                      placeholder="พิมพ์ชื่อสังกัดทีม เช่น ทีมเหลือง, ทีมสิงห์..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">ระดับฝีมือ (Skill Rating 1-5)</label>
                <select
                  value={skillInput}
                  onChange={e => setSkillInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-amber-800 font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value={5}>5 ⭐ - ตัวหลัก/ดาวยิง</option>
                  <option value={4}>4 ⭐ - ฝีมือดี</option>
                  <option value={3}>3 ⭐ - ปานกลาง</option>
                  <option value={2}>2 ⭐ - ฟิตเนสทั่วไป</option>
                  <option value={1}>1 ⭐ - มือใหม่</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPlayer(null);
                    setDefaultTeamInput('');
                    setAvatarInput('');
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER QR CODE MODAL */}
      <RegisterQRModal
        session={activeSession}
        players={players}
        isOpen={isRegisterQROpen}
        onClose={() => setIsRegisterQROpen(false)}
      />

    </div>
  );
};
