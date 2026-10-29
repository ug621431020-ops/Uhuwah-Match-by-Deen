import React, { useRef, useState } from 'react';
import { Download, X, Calendar, Clock, MapPin, Trophy, Shield, Sparkles, Check, Flame } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { FootballSession, Player, Team } from '../types';
import { parseSessionDurationMinutes, calculateSessionTimingInfo, getMatchTimeSlot } from '../utils/timeCalculator';

interface SchedulePosterModalProps {
  session: FootballSession;
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulePosterModal: React.FC<SchedulePosterModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const totalSessionMins = parseSessionDurationMinutes(session.timeRange);
  const matches = session.matches || [];
  const matchCount = matches.length;
  const durationPerMatch = session.matchDurationMinutes || 7;
  const timingCalc = calculateSessionTimingInfo(totalSessionMins, matchCount, durationPerMatch);

  const getTeam = (teamId: string): Team | undefined => {
    return session.teams.find(t => t.id === teamId);
  };

  const formatThaiFullDate = (dateStr?: string) => {
    if (!dateStr) return 'วันพฤหัสบดีที่ 13 สิงหาคม 2569';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;

    const dayOfWeekNames = [
      'วันอาทิตย์',
      'วันจันทร์',
      'วันอังคาร',
      'วันพุธ',
      'วันพฤหัสบดี',
      'วันศุกร์',
      'วันเสาร์',
    ];
    const monthNames = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];

    const dayOfWeek = dayOfWeekNames[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    const yearBE = dateObj.getFullYear() + 543;

    return `${dayOfWeek}ที่ ${day} ${month} ${yearBE}`;
  };

  const getTeamDot = (color?: string) => {
    switch (color) {
      case 'red':
        return 'bg-rose-500';
      case 'blue':
        return 'bg-sky-500';
      case 'green':
        return 'bg-emerald-500';
      case 'black':
        return 'bg-slate-900 border border-slate-500';
      case 'yellow':
        return 'bg-amber-400';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-slate-400';
    }
  };

  const handleDownloadJPG = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toJpeg(posterRef.current, {
        quality: 0.96,
        pixelRatio: 2.5, // Ultra sharp on all mobile displays
        cacheBust: true,
      });

      const dateFilename = session.date || new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.download = `MATCH_UKHUWAH_Schedule_${dateFilename}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating JPG poster:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ โปรดลองใหม่อีกครั้ง');
    } finally {
      setIsDownloading(false);
    }
  };

  const isGridTwoCols = matches.length > 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-4 text-white shadow-2xl space-y-3 my-auto max-h-[95vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white">ดาวน์โหลดรูปตารางแข่ง</h3>
              <p className="text-[10px] text-slate-400">
                แสดงครบทุกแมตช์ ({matchCount} นัด • แมตช์ละ {durationPerMatch} นาที) พอดีสำหรับแชร์ลง LINE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* POSTER CANVAS PREVIEW - SCROLLABLE ON MOBILE */}
        <div className="flex-1 overflow-y-auto py-1 flex justify-center">
          <div
            ref={posterRef}
            className="w-full max-w-[480px] bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-950 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl flex flex-col justify-between text-white shadow-2xl relative overflow-hidden select-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.28) 0%, transparent 65%), radial-gradient(circle at 100% 100%, rgba(14, 165, 233, 0.18) 0%, transparent 60%)',
            }}
          >
            {/* Top Branding & Info */}
            <div className="text-center space-y-1.5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-black tracking-widest uppercase shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>MATCH UKHUWAH</span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md">
                ตารางการแข่งขันฟุตบอลประจำสัปดาห์
              </h2>

              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] text-slate-200 font-medium flex-wrap">
                <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800 shadow-2xs">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{formatThaiFullDate(session.date)}</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800 shadow-2xs">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{session.timeRange || '20:00 - 22:00 น.'}</span>
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-300 flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>{session.location || 'สนามซอย 9'}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.2 rounded border border-emerald-800/60">
                  {matchCount} แมตช์ (นัดละ {durationPerMatch} นาที • รวม {timingCalc.totalPlayMinutes} น.)
                </span>
              </div>

              {/* Teams Legend */}
              <div className="flex items-center justify-center gap-2 pt-1 pb-1 flex-wrap">
                {session.teams.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-bold text-slate-200"
                  >
                    <span className={`w-2 h-2 rounded-full ${getTeamDot(t.color)}`} />
                    <span>{t.name}</span>
                    <span className="text-slate-500 font-mono text-[9px]">({t.playerIds.length} คน)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MATCHES GRID - SHOWS ALL MATCHES (No Truncation) */}
            <div className="my-2 py-1 relative z-10">
              {matches.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  ยังไม่ได้สร้างแมตช์การแข่งขัน
                </div>
              ) : (
                <div
                  className={`grid gap-1.5 ${
                    isGridTwoCols ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {matches.map((m, idx) => {
                    const home = getTeam(m.homeTeamId);
                    const away = getTeam(m.awayTeamId);
                    const timeSlot = getMatchTimeSlot(session.timeRange, idx, matches.length, durationPerMatch);
                    const isFinished = m.status === 'finished';

                    if (m.isBreak) {
                      return (
                        <div
                          key={m.id}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/40 text-amber-200 flex items-center justify-between text-[11px] shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">☕</span>
                            <span className="font-bold text-[10px] text-amber-300">
                              {m.breakTitle || 'พักเบรกครึ่งรอบ'}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] text-amber-400 font-bold">
                            {m.durationMinutes} นาที ({timeSlot.startTime})
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`px-2.5 py-1.5 rounded-xl border ${
                          isFinished
                            ? 'border-emerald-500/40 bg-slate-900/95'
                            : 'border-slate-800/90 bg-slate-900/85'
                        } text-slate-200 flex items-center justify-between text-[11px] shadow-2xs`}
                      >
                        {/* Match Number & Time */}
                        <div className="flex flex-col text-left shrink-0 min-w-[64px]">
                          <span className="font-mono text-[10px] font-black text-emerald-400 leading-tight">
                            นัดที่ {m.matchNumber}
                          </span>
                          <span className="font-mono text-[8px] text-amber-300 font-bold tracking-tight">
                            {timeSlot.startTime} - {timeSlot.endTime}
                          </span>
                        </div>

                        {/* Matchup */}
                        <div className="flex items-center justify-center gap-1.5 flex-1 mx-1 min-w-0">
                          {/* Home Team */}
                          <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                            <span className="font-bold text-[10px] text-white truncate text-right">
                              {home?.name || 'ทีมเหย้า'}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${getTeamDot(home?.color)} shrink-0`} />
                          </div>

                          {/* Score / VS */}
                          <div className="px-1.5 py-0.2 rounded bg-slate-950 font-mono font-black text-[10px] text-amber-400 border border-slate-800 shrink-0 min-w-[34px] text-center shadow-inner">
                            {m.homeScore !== null && m.awayScore !== null
                              ? `${m.homeScore}-${m.awayScore}`
                              : 'VS'}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-1 flex-1 justify-start min-w-0">
                            <span className={`w-2 h-2 rounded-full ${getTeamDot(away?.color)} shrink-0`} />
                            <span className="font-bold text-[10px] text-white truncate text-left">
                              {away?.name || 'ทีมเยือน'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Footer */}
            <div className="text-center pt-2 border-t border-slate-800/80 relative z-10 space-y-0.5">
              <p className="text-[10px] font-black text-emerald-400 tracking-wide">
                MATCH UKHUWAH — ฟุตบอลแห่งมิตรภาพและความผูกพัน
              </p>
              <p className="text-[8px] text-slate-400 font-mono">
                จองสนาม {totalSessionMins} นาที • โควตาไม่เกิน 7 คน/ทีม
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            ปิด
          </button>

          <button
            onClick={handleDownloadJPG}
            disabled={isDownloading}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'กำลังสร้างรูป...' : 'บันทึกรูปภาพ (JPG)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

