import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  Calendar,
  Lock,
  Unlock,
  LogOut,
  Shield,
  Trophy,
  Edit3,
  Plus,
  Sparkles,
  ChevronDown,
  Clock,
  Check,
  X,
  MapPin,
  Users,
  ChevronRight,
  Flame,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { FootballSession } from '../types';

const SoccerBallIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8zm-1-13.73l-3.09 2.25 1.18 3.63h3.82l1.18-3.63zm-4.36.45L4.5 9.17l2.25 3.08 1.82-1.32zm8.72 0l-1 2.48 1.82 1.32 2.25-3.08zm-8.83 7.24L4.2 13.1l2.87 2.1 1.43-2.18zm8.94 0l-1.43 2.18 2.87-2.1-2.33-2.86zm-5.47 1.86l1.8 1.31 1.8-1.31-.69-2.12h-2.22z"/>
  </svg>
);

interface HeaderProps {
  sessions: FootballSession[];
  activeSession: FootballSession | null;
  onSelectSession: (id: string) => void;
  isAdmin: boolean;
  onOpenAdminModal: () => void;
  onLogoutAdmin: () => void;
  onOpenShareModal: () => void;
  onNewSessionClick?: () => void;
  onOpenEditSessionModal?: (sessionToEdit?: FootballSession) => void;
  onOpenPaymentModal?: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  isAdmin,
  onOpenAdminModal,
  onLogoutAdmin,
  onOpenShareModal,
  onNewSessionClick,
  onOpenEditSessionModal,
  onDeleteSession,
}) => {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<FootballSession | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSessionModal(false);
        setSessionToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getStatusBadge = (status?: string, size: 'sm' | 'md' = 'md') => {
    switch (status) {
      case 'in_progress':
        return (
          <span className={`inline-flex items-center gap-1 font-black rounded-full bg-rose-50 text-[#ff2a6d] border border-rose-200/80 shadow-2xs shrink-0 whitespace-nowrap ${
            size === 'sm' ? 'px-1.5 py-0.5 text-[9px] sm:text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff2a6d]"></span>
            </span>
            <span>กำลังแข่ง</span>
          </span>
        );
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap ${
            size === 'sm' ? 'px-1.5 py-0.5 text-[9px] sm:text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>จบแล้ว</span>
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0 whitespace-nowrap ${
            size === 'sm' ? 'px-1.5 py-0.5 text-[9px] sm:text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Clock className="w-2.5 h-2.5 text-sky-500 shrink-0" />
            <span>เตรียมตัว</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#f4f6fa]/95 backdrop-blur-xl pt-2.5 pb-2 px-3 sm:px-4 transition-all">
      <div className="max-w-md mx-auto space-y-2">
        {/* TOP BAR: BRAND TITLE & ACTIONS (PROPORTIONAL, CLEAN & NON-OVERLAPPING) */}
        <div className="flex items-center justify-between gap-2 min-h-[36px]">
          {/* System Brand on Left */}
          <div className="flex items-center gap-1.5 min-w-0 select-none">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <SoccerBallIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline tracking-tight font-black leading-none truncate">
              <span className="text-sm sm:text-base text-slate-900 font-black tracking-tight">MATCH</span>
              <span className="text-sm sm:text-base text-[#ff2a6d] font-black tracking-tight ml-1">UKUWAH</span>
            </div>
          </div>

          {/* Right Action Buttons: Share & Login/Logout with Matching Proportions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Share Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="แชร์สรุปผลและรายงาน"
              id="btn-share-line"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>แชร์</span>
            </button>

            {/* Admin Login / Logout */}
            {isAdmin ? (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="h-8 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                id="btn-admin-logout"
                title="ออกจากระบบแอดมิน"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminModal}
                className="h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                id="btn-admin-login"
                title="เข้าสู่ระบบแอดมิน"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>

        {/* COMPACT & RESPONSIVE MATCHDAY CARD (PRO-LEVEL DESIGN, NO OVERFLOW) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Clickable Area: Title, Status, and Time are all interactive */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSessionToDelete(null);
                setShowSessionModal(true);
              }}
              className="flex-1 flex items-center justify-between gap-2 min-w-0 text-left cursor-pointer group select-none active:opacity-85 transition-all"
              id="btn-session-dropdown"
              title="แตะเพื่อเลือกดูหรือจัดการรอบการแข่งขัน"
            >
              {/* Left side: Trophy + Round Title */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#ff2a6d]/15 to-[#ff007f]/5 text-[#ff2a6d] flex items-center justify-center shrink-0 border border-[#ff2a6d]/20 group-hover:scale-105 transition-transform shadow-2xs">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#ff2a6d]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-0.5 truncate">
                      <span className="truncate">เลือกรอบการแข่งขัน</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#ff2a6d] transition-colors shrink-0" />
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight group-hover:text-[#ff2a6d] transition-colors">
                    {activeSession ? activeSession.title : 'ยังไม่มีรอบการแข่งขัน'}
                  </div>
                </div>
              </div>

              {/* Right side: Status & Time Section (Integrated & clickable) */}
              <div className="flex flex-col items-end justify-center gap-0.5 shrink-0 pl-1">
                {activeSession ? (
                  <>
                    {getStatusBadge(activeSession.status, 'sm')}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 font-mono whitespace-nowrap">
                      <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span>{activeSession.timeRange || '20:00 - 22:00 น.'}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-[#ff2a6d] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                    + สร้างรอบใหม่
                  </span>
                )}
              </div>
            </div>

            {/* Admin Quick Edit Button */}
            {isAdmin && onOpenEditSessionModal && activeSession && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditSessionModal(activeSession);
                }}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90 flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 ml-0.5"
                title="แก้ไขข้อมูลรอบแข่งขันนี้ (วัน/เวลา/สถานที่/สถานะ)"
                id="btn-edit-session-details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* QUICK DATE SWITCHER PILLS (แถบเลื่อนสลับรอบแบบด่วน 1-TAP) */}
        {sessions.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {sessions.map(s => {
              const isActive = s.id === activeSession?.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] text-white shadow-md shadow-rose-500/20'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <span className="truncate">{s.title}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      s.status === 'in_progress'
                        ? isActive
                          ? 'bg-white animate-pulse'
                          : 'bg-rose-500 animate-pulse'
                        : s.status === 'completed'
                        ? isActive
                          ? 'bg-white/80'
                          : 'bg-slate-400'
                        : isActive
                        ? 'bg-white/80'
                        : 'bg-sky-400'
                    }`}
                  />
                </button>
              );
            })}

            {isAdmin && onNewSessionClick && (
              <button
                type="button"
                onClick={onNewSessionClick}
                className="px-2.5 py-1 rounded-full text-xs font-bold text-[#ff2a6d] bg-rose-50 hover:bg-rose-100 border border-rose-200 shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                title="สร้างสัปดาห์ใหม่"
              >
                <Plus className="w-3 h-3" />
                <span>เพิ่มรอบ</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* FULL PROFESSIONAL "เลือกรอบการแข่งขัน" MODAL (Rendered in Portal to escape header backdrop-blur & prevent edge clipping) */}
      {showSessionModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex min-h-screen items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn cursor-pointer"
          onClick={() => {
            setShowSessionModal(false);
            setSessionToDelete(null);
          }}
        >
          <div
            className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative cursor-default my-auto max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150 mx-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header: Crisp, professional & completely contained */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#ff2a6d] to-[#ff007f] p-0.5 shadow-md flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-[#ff2a6d]" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                      เลือกรอบการแข่งขัน
                    </h3>
                    <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      {sessions.length} สัปดาห์
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                    แตะเพื่อสลับรอบ หรือจัดการรายการแข่งขันแต่ละสัปดาห์
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSessionModal(false);
                  setSessionToDelete(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer shrink-0"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sessions List */}
            <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1">
              {/* In-Modal Delete Confirmation Box */}
              {sessionToDelete && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-xs">ยืนยันลบสัปดาห์นี้?</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    คุณต้องการลบ <strong>"{sessionToDelete.title}"</strong> ใช่หรือไม่? ข้อมูลการแข่งขัน สถิติ และค่าใช้จ่ายของสัปดาห์นี้จะถูกลบถาวร
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSessionToDelete(null)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onDeleteSession) {
                          onDeleteSession(sessionToDelete.id);
                        }
                        setSessionToDelete(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ยืนยันลบ</span>
                    </button>
                  </div>
                </div>
              )}

              {sessions.length === 0 && (
                <div className="py-10 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#ff2a6d] border border-rose-200/60 flex items-center justify-center mx-auto shadow-2xs">
                    <Trophy className="w-6 h-6 fill-[#ff2a6d]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800">ยังไม่มีรอบการแข่งขันในระบบ</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isAdmin
                        ? 'ข้อมูลถูกล้างทั้งหมดแล้ว คุณสามารถสร้างรอบการแข่งขันใหม่ได้ทันที'
                        : 'จะสร้างรอบการแข่งขันได้ต้องเป็นแอดมินเท่านั้น (เข้าสู่ระบบเพื่อจัดการ)'}
                    </p>
                  </div>
                  {isAdmin ? (
                    onNewSessionClick && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSessionModal(false);
                          onNewSessionClick();
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ สร้างรอบการแข่งขันใหม่</span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSessionModal(false);
                        onOpenAdminModal();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>เข้าสู่ระบบแอดมินเพื่อสร้างรอบ</span>
                    </button>
                  )}
                </div>
              )}

              {sessions.map(s => {
                const isActive = s.id === activeSession?.id;
                const attendingCount = s.attendingPlayerIds?.length || 0;
                const matchesCount = s.matches?.length || 0;

                return (
                  <div
                    key={s.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative select-none mx-0.5 my-0.5 ${
                      isActive
                        ? 'bg-rose-50/40 border-[#ff2a6d] ring-2 ring-inset ring-[#ff2a6d]/25 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                    }`}
                  >
                    {/* Clickable Card Body */}
                    <div
                      onClick={() => {
                        onSelectSession(s.id);
                        setShowSessionModal(false);
                      }}
                      className="cursor-pointer space-y-1.5"
                    >
                      {/* Top Row: Title + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                            {s.title}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#ff2a6d] text-white shadow-2xs shrink-0">
                              รอบปัจจุบัน
                            </span>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {getStatusBadge(s.status, 'sm')}
                          {isActive && (
                            <div className="w-4 h-4 rounded-full bg-[#ff2a6d] text-white flex items-center justify-center text-[10px] shadow-2xs shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Time & Venue */}
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1 font-mono font-medium shrink-0">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{s.timeRange || '20:00 - 22:00 น.'}</span>
                        </span>

                        <span className="flex items-center gap-1 text-slate-500 min-w-0 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{s.location || 'สนามหญ้าเทียม'}</span>
                        </span>
                      </div>

                      {/* Stats: Players & Matches */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 shrink-0">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{attendingCount} ผู้เล่น</span>
                        </span>
                        <span>•</span>
                        <span className="shrink-0">{matchesCount} แมตช์</span>
                      </div>
                    </div>

                    {/* Admin Action Bar: Edit & Delete each week's session */}
                    {isAdmin && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">
                          จัดการสัปดาห์นี้
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onOpenEditSessionModal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSessionModal(false);
                                onOpenEditSessionModal(s);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลสัปดาห์นี้"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>แก้ไข</span>
                            </button>
                          )}

                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(s);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80"
                              title="ลบสัปดาห์นี้"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer (Admin Action to Add Session) */}
            {isAdmin && onNewSessionClick && (
              <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    onNewSessionClick();
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#ff2a6d] to-[#ff007f] hover:opacity-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer"
                  id="btn-add-new-session"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างรอบการแข่งขันใหม่ (สัปดาห์ใหม่)</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

