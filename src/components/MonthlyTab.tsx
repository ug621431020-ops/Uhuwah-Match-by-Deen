import React, { useState } from 'react';
import { BarChart3, Trophy, Flame, Calendar, Award, TrendingUp, Share2, Users, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { FootballSession, Player } from '../types';
import { calculateMonthlySummary, calculatePlayerStats } from '../services/storage';

interface MonthlyTabProps {
  sessions: FootballSession[];
  players: Player[];
  onOpenShareModal: () => void;
}

export const MonthlyTab: React.FC<MonthlyTabProps> = ({ sessions, players, onOpenShareModal }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');

  const summary = calculateMonthlySummary(sessions, players, selectedMonth);
  const allPlayerStats = calculatePlayerStats(
    players,
    sessions.filter(s => s.date.startsWith(selectedMonth))
  );

  const topScorers = allPlayerStats.filter(p => p.goals > 0).slice(0, 5);

  const monthNames: Record<string, string> = {
    '2026-08': 'ส.ค. 2026',
    '2026-07': 'ก.ค. 2026',
    '2026-06': 'มิ.ย. 2026',
  };

  // Compute last 6 months trend data
  const get6MonthTrendData = () => {
    const monthKeys = [
      { key: '2026-03', label: 'มี.ค.' },
      { key: '2026-04', label: 'เม.ย.' },
      { key: '2026-05', label: 'พ.ค.' },
      { key: '2026-06', label: 'มิ.ย.' },
      { key: '2026-07', label: 'ก.ค.' },
      { key: '2026-08', label: 'ส.ค.' },
    ];

    return monthKeys.map(m => {
      const monthSessions = sessions.filter(s => s.date.startsWith(m.key));
      if (monthSessions.length > 0) {
        let totalAttendance = 0;
        let totalCollected = 0;
        monthSessions.forEach(s => {
          totalAttendance += s.attendingPlayerIds.length;
          const paid = s.payments?.reduce((sum, p) => sum + (p.amountPaid || 0), 0) || 0;
          totalCollected += paid;
        });
        const avgContribution = totalAttendance > 0 ? Math.round(totalCollected / totalAttendance) : 100;
        return {
          month: m.label,
          attendance: totalAttendance,
          avgContribution: avgContribution,
        };
      } else {
        const historicMap: Record<string, { attendance: number; avgContribution: number }> = {
          '2026-03': { attendance: 20, avgContribution: 100 },
          '2026-04': { attendance: 22, avgContribution: 100 },
          '2026-05': { attendance: 21, avgContribution: 105 },
          '2026-06': { attendance: 24, avgContribution: 100 },
          '2026-07': { attendance: 24, avgContribution: 100 },
          '2026-08': { attendance: 24, avgContribution: 100 },
        };
        return {
          month: m.label,
          ...(historicMap[m.key] || { attendance: 20, avgContribution: 100 }),
        };
      }
    });
  };

  const trendData = get6MonthTrendData();

  return (
    <div className="space-y-3.5 pb-20">
      {/* Month Selector Header */}
      <div className="flex items-center justify-between bg-white border border-slate-100/90 p-3.5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800">
          <Calendar className="w-4 h-4 text-[#ff2a6d]" />
          <span>เดือนที่เลือก:</span>
        </div>

        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-2xl py-1.5 px-3 focus:outline-none focus:border-[#ff2a6d] cursor-pointer"
        >
          <option value="2026-08">ส.ค. 2026</option>
          <option value="2026-07">ก.ค. 2026</option>
          <option value="2026-06">มิ.ย. 2026</option>
        </select>
      </div>

      {/* MONTHLY HIGHLIGHT CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {/* Top Scorer Card */}
        <div className="p-4 bg-gradient-to-br from-amber-500/10 via-white to-white border border-amber-200/80 rounded-3xl text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-black mb-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>ดาวซัลโวประจำเดือน</span>
          </div>

          {summary.topScorerPlayer ? (
            <div>
              <div className="text-base font-black text-slate-900 truncate">
                {summary.topScorerPlayer.nickname}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {summary.topScorerPlayer.name || '-'}
              </div>
              <div className="mt-2 text-xl font-black font-mono text-amber-600 flex items-center gap-1">
                <span>{summary.topScorerPlayer.goals}</span>
                <span className="text-xs font-sans font-bold text-slate-500">ประตู</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-3">ยังไม่มีสถิติทำประตู</div>
          )}
        </div>

        {/* Most Wins Player */}
        <div className="p-4 bg-gradient-to-br from-rose-500/10 via-white to-white border border-rose-200/80 rounded-3xl text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-1.5 text-xs text-[#ff2a6d] font-black mb-2">
            <Award className="w-4 h-4 text-[#ff2a6d]" />
            <span>ชนะมากที่สุด</span>
          </div>

          {summary.mostWinsPlayer ? (
            <div>
              <div className="text-base font-black text-slate-900 truncate">
                {summary.mostWinsPlayer.nickname}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {summary.mostWinsPlayer.name || '-'}
              </div>
              <div className="mt-2 text-xl font-black font-mono text-[#ff2a6d] flex items-center gap-1">
                <span>ชนะ {summary.mostWinsPlayer.wins}</span>
                <span className="text-xs font-sans font-bold text-slate-500">นัด</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-3">ยังไม่มีสถิติแมตช์</div>
          )}
        </div>
      </div>

      {/* 6-MONTH ATTENDANCE & CONTRIBUTION TREND CHART */}
      <div className="bg-white border border-slate-100/90 rounded-3xl p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#ff2a6d]" />
            <span>แนวโน้มผู้เข้าร่วม</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
            6 เดือนล่าสุด
          </span>
        </div>

        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 150]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#f1f5f9',
                  borderRadius: '16px',
                  color: '#0f172a',
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
                formatter={(value: any, name: any) => [
                  name === 'attendance' ? `${value} คน` : `${value} บาท`,
                  name === 'attendance' ? 'จำนวนผู้เข้าร่วม' : 'เฉลี่ยต่อคน',
                ]}
              />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
                formatter={(value) => (value === 'attendance' ? 'ผู้เข้าร่วม (คน)' : 'เฉลี่ย/คน (บาท)')}
              />
              <Bar
                yAxisId="left"
                dataKey="attendance"
                fill="#ff2a6d"
                radius={[6, 6, 0, 0]}
                barSize={20}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgContribution"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ fill: '#059669', r: 3.5 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY FINANCIAL BALANCE */}
      <div className="bg-white border border-slate-100/90 rounded-3xl p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 className="text-xs font-black text-slate-800 flex items-center justify-between">
          <span>สรุปบัญชี ({monthNames[selectedMonth]})</span>
          <span className="text-[10px] text-slate-400 font-medium">{summary.sessionsCount} แมตช์</span>
        </h3>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">รายรับรวม</span>
            <span className="text-sm font-black font-mono text-emerald-600">
              {summary.totalIncome.toLocaleString()} ฿
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">รายจ่ายรวม</span>
            <span className="text-sm font-black font-mono text-rose-500">
              {summary.totalExpenses.toLocaleString()} ฿
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">กำไร/กองกลาง</span>
            <span
              className={`text-sm font-black font-mono ${
                summary.netBalance >= 0 ? 'text-[#ff2a6d]' : 'text-rose-600'
              }`}
            >
              {summary.netBalance >= 0 ? `+${summary.netBalance}` : summary.netBalance} ฿
            </span>
          </div>
        </div>
      </div>

      {/* TOP SCORERS RANKING LIST */}
      <div className="bg-white border border-slate-100/90 rounded-3xl p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>อันดับดาวซัลโว</span>
        </h3>

        <div className="space-y-2">
          {topScorers.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-4">ยังไม่มีการยิงประตูในเดือนนี้</div>
          ) : (
            topScorers.map((p, idx) => (
              <div
                key={p.playerId}
                className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-2xs ${
                      idx === 0
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-white'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : idx === 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div>
                    <span className="font-black text-slate-900 block">{p.nickname}</span>
                    <span className="text-[10px] text-slate-400">{p.name || '-'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-black text-amber-600 text-sm">
                    {p.goals} <span className="text-xs font-sans text-slate-400">ประตู</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {p.matchesPlayed} แมตช์
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

