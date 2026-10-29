import React, { useState } from 'react';
import { Trophy, Crown, ChevronDown, ChevronUp, Users, Goal, Award } from 'lucide-react';
import { FootballSession, Player, TeamStats } from '../types';
import { calculateTeamStats } from '../services/storage';
import { PlayerAvatar } from './PlayerAvatar';
import { TeamCrest } from './TeamCrest';

interface StandingsTabProps {
  session: FootballSession;
  players: Player[];
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ session, players }) => {
  const standings: TeamStats[] = calculateTeamStats(session);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const champion = standings[0];
  const finishedCount = session.matches.filter(m => m.status === 'finished').length;
  const isSessionFinished = finishedCount > 0 && finishedCount === session.matches.length;

  return (
    <div className="space-y-3.5 pb-20">
      {/* CHAMPION BANNER */}
      {champion && (
        <div className="relative overflow-hidden p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/95 text-amber-700 flex items-center justify-center font-bold shadow-sm shrink-0">
              <Crown className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-950 font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" />
                <span>{isSessionFinished ? 'แชมป์ประจำวัน' : 'ผู้นำจ่าฝูง'}</span>
              </div>
              <h2 className="text-lg font-black text-slate-950 truncate mt-0.5">{champion.teamName}</h2>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-amber-950 font-mono font-bold mt-1">
                <span className="bg-white/40 px-2 py-0.5 rounded-full">{champion.points} แต้ม</span>
                <span>ชนะ {champion.won} เสมอ {champion.drawn} แพ้ {champion.lost}</span>
                <span>•</span>
                <span>GD {champion.goalDiff > 0 ? `+${champion.goalDiff}` : champion.goalDiff}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STANDINGS TABLE CARD */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#ff2a6d]" />
            <h3 className="font-black text-sm text-slate-800 tracking-tight">ตารางคะแนน</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">ชนะ 3 / เสมอ 1 / แพ้ 0</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 text-[10px] sm:text-[11px] border-b border-slate-100 uppercase tracking-wider font-semibold">
                <th className="py-2.5 pl-3 pr-1 w-8 text-center">#</th>
                <th className="py-2.5 px-2">ทีม</th>
                <th className="py-2.5 px-1 text-center font-bold">แข่ง</th>
                <th className="py-2.5 px-1 text-center">ชนะ</th>
                <th className="py-2.5 px-1 text-center">เสมอ</th>
                <th className="py-2.5 px-1 text-center">แพ้</th>
                <th className="py-2.5 px-1 text-center hidden sm:table-cell">ได้</th>
                <th className="py-2.5 px-1 text-center hidden sm:table-cell">เสีย</th>
                <th className="py-2.5 px-1 text-center">ต่าง</th>
                <th className="py-2.5 pr-3 pl-1 text-center font-black text-[#ff2a6d]">แต้ม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] sm:text-xs">
              {standings.map((st, idx) => {
                const isFirst = idx === 0;
                const isExpanded = expandedTeamId === st.teamId;
                const teamObj = session.teams.find(t => t.id === st.teamId);

                return (
                  <React.Fragment key={st.teamId}>
                    <tr
                      onClick={() => setExpandedTeamId(isExpanded ? null : st.teamId)}
                      className={`cursor-pointer hover:bg-slate-50/60 transition-colors ${
                        isFirst ? 'bg-amber-50/40 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 pl-3 pr-1 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white font-black text-[10px] shadow-xs">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-black text-[10px]">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans text-xs">{idx + 1}</span>
                        )}
                      </td>

                      <td className="py-3 px-2 font-sans font-black text-slate-800">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrest teamName={st.teamName} color={st.color} size="xs" />
                          <span className="truncate max-w-[110px] sm:max-w-[150px]">{st.teamName}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-0.5" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-1 text-center text-slate-700 font-bold">{st.played}</td>
                      <td className="py-3 px-1 text-center text-emerald-600 font-bold">{st.won}</td>
                      <td className="py-3 px-1 text-center text-slate-400">{st.drawn}</td>
                      <td className="py-3 px-1 text-center text-rose-500">{st.lost}</td>
                      <td className="py-3 px-1 text-center text-slate-600 hidden sm:table-cell">{st.goalsFor}</td>
                      <td className="py-3 px-1 text-center text-slate-400 hidden sm:table-cell">{st.goalsAgainst}</td>
                      <td className="py-3 px-1 text-center text-slate-700 font-semibold">
                        {st.goalDiff > 0 ? `+${st.goalDiff}` : st.goalDiff}
                      </td>
                      <td className="py-3 pr-3 pl-1 text-center text-[#ff2a6d] font-black text-sm">
                        {st.points}
                      </td>
                    </tr>

                    {/* EXPANDED TEAM ROSTER */}
                    {isExpanded && teamObj && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={10} className="p-3.5">
                          <div className="text-xs space-y-2">
                            <div className="font-black text-slate-800 flex items-center gap-1.5 font-sans">
                              <Users className="w-3.5 h-3.5 text-[#ff2a6d]" />
                              <span>รายชื่อนักเตะในทีม ({teamObj.playerIds.length} คน):</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {teamObj.playerIds.map(pid => {
                                const p = players.find(x => x.id === pid);
                                if (!p) return null;

                                // Goals scored by this player in session
                                const goalsCount = session.matches.reduce((acc, m) => {
                                  return acc + (m.goals?.filter(g => g.playerId === pid).length || 0);
                                }, 0);

                                return (
                                  <div
                                    key={pid}
                                    className="p-2 rounded-2xl bg-white border border-slate-100 text-slate-800 flex items-center justify-between shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <PlayerAvatar nickname={p.nickname} avatarUrl={p.avatarUrl} size="xs" />
                                      <span className="font-bold truncate text-xs">{p.nickname}</span>
                                    </div>
                                    {goalsCount > 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-[#ff2a6d] font-black flex items-center gap-1 shrink-0 ml-1">
                                        <Goal className="w-3 h-3 text-[#ff2a6d]" />
                                        <span>{goalsCount}</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SESSION STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-white rounded-3xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90">
          <span className="text-[11px] text-slate-400 font-bold block mb-1">แมตช์ที่แข่งจบแล้ว</span>
          <span className="text-xl font-black text-[#ff2a6d] font-mono">
            {finishedCount} <span className="text-slate-300 font-sans text-sm">/</span> {session.matches.length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-3xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90">
          <span className="text-[11px] text-slate-400 font-bold block mb-1">ประตูรวมทั้งหมด</span>
          <span className="text-xl font-black text-amber-500 font-mono">
            {session.matches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0)}{' '}
            <span className="text-slate-400 text-xs font-sans">ลูก</span>
          </span>
        </div>
      </div>
    </div>
  );
};
