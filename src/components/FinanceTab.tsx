import React, { useState } from 'react';
import { Wallet, CheckCircle2, XCircle, Plus, Edit3, Search, QrCode, ArrowDownRight, ArrowUpRight, DollarSign, Image as ImageIcon, Eye, X, Bell, ChevronDown } from 'lucide-react';
import { Expense, FootballSession, Player, PlayerPayment } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { SendReminderModal } from './SendReminderModal';

interface FinanceTabProps {
  session: FootballSession;
  players: Player[];
  isAdmin: boolean;
  onUpdatePayments: (payments: PlayerPayment[]) => void;
  onUpdateSessionCosts: (fieldCost: number, waterCost: number, otherCost: number, feePerPlayer: number) => void;
  onAddExpense: (expense: Expense) => void;
  onOpenPaymentModal?: (playerId?: string) => void;
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  session,
  players,
  isAdmin,
  onUpdatePayments,
  onUpdateSessionCosts,
  onAddExpense,
  onOpenPaymentModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [editingCosts, setEditingCosts] = useState(false);
  const [viewingSlip, setViewingSlip] = useState<{ url: string; playerName: string; playerId: string } | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const [fieldCostInput, setFieldCostInput] = useState(session.fieldCost ?? 1800);
  const [waterCostInput, setWaterCostInput] = useState(session.waterCost ?? 500);
  const [otherCostInput, setOtherCostInput] = useState(session.otherCost ?? 0);
  const [feePerPlayerInput, setFeePerPlayerInput] = useState(session.feePerPlayer ?? 100);

  // Expense modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(100);
  const [expCategory, setExpCategory] = useState<Expense['category']>('other');

  // Build normalized payment list for all attending players (or all players if attendingPlayerIds is empty)
  const targetPlayerIds = (session.attendingPlayerIds && session.attendingPlayerIds.length > 0)
    ? session.attendingPlayerIds
    : players.map(p => p.id);

  const normalizedPayments: PlayerPayment[] = targetPlayerIds.map(pid => {
    const existing = (session.payments || []).find(p => p.playerId === pid);
    if (existing) return existing;
    return {
      playerId: pid,
      amountDue: session.feePerPlayer || 100,
      amountPaid: 0,
      isPaid: false,
    };
  });

  // Calculations
  const totalExpenses = (session.fieldCost ?? 1800) + (session.waterCost ?? 500) + (session.otherCost ?? 0);
  const totalCollected = normalizedPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const netBalance = totalCollected - totalExpenses;

  const paidCount = normalizedPayments.filter(p => p.isPaid).length;
  const unpaidCount = normalizedPayments.filter(p => !p.isPaid).length;
  const totalPlayersCount = normalizedPayments.length;

  const handleTogglePayment = (playerId: string) => {
    const fee = session.feePerPlayer || 100;
    const existingPayments = session.payments || [];
    let updated: PlayerPayment[];

    if (existingPayments.some(p => p.playerId === playerId)) {
      updated = existingPayments.map(p => {
        if (p.playerId === playerId) {
          const nextIsPaid = !p.isPaid;
          return {
            ...p,
            isPaid: nextIsPaid,
            amountPaid: nextIsPaid ? fee : 0,
            paidAt: nextIsPaid ? new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : undefined,
            paymentMethod: nextIsPaid ? ('promptpay' as const) : undefined,
          };
        }
        return p;
      });
    } else {
      updated = [
        ...existingPayments,
        {
          playerId,
          amountDue: fee,
          amountPaid: fee,
          isPaid: true,
          paidAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          paymentMethod: 'promptpay',
        },
      ];
    }

    onUpdatePayments(updated);
  };

  const handleSaveCosts = () => {
    onUpdateSessionCosts(fieldCostInput, waterCostInput, otherCostInput, feePerPlayerInput);
    setEditingCosts(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || expAmount <= 0) return;

    onAddExpense({
      id: `exp_${Date.now()}`,
      title: expTitle,
      amount: expAmount,
      category: expCategory,
    });

    setExpTitle('');
    setExpAmount(100);
    setShowExpenseModal(false);
  };

  const filteredPayments = normalizedPayments.filter(pm => {
    const p = players.find(x => x.id === pm.playerId);
    const nameMatch = p ? (p.name.includes(searchTerm) || p.nickname.includes(searchTerm)) : true;
    if (filterStatus === 'paid') return nameMatch && pm.isPaid;
    if (filterStatus === 'unpaid') return nameMatch && !pm.isPaid;
    return nameMatch;
  });

  return (
    <div className="space-y-3.5 pb-20">
      {/* QUICK PAYMENT QR BANNER (SLEEK, COMPACT & CONCISE) */}
      {onOpenPaymentModal && (
        <div
          onClick={() => onOpenPaymentModal()}
          className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/20 text-white p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-2.5 shadow-sm hover:border-emerald-500/40 transition-all cursor-pointer select-none active:scale-[0.99]"
          id="banner-quick-qr-pay"
          title="แตะเพื่อเปิด QR สแกนจ่ายเงิน"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-2xs">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-xs sm:text-sm text-white tracking-tight">
                  QR พร้อมเพย์
                </h4>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-black shrink-0">
                  {session.feePerPlayer || 100}฿ / คน
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/80 truncate">
                สแกนจ่ายตรงยอด • โอนเข้าบัญชี
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPaymentModal();
            }}
            className="h-8.5 sm:h-9 px-3 sm:px-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
            id="btn-finance-open-qr"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            <span>เปิด QR</span>
          </button>
        </div>
      )}

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-2">
        {/* Expenses */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-rose-600 font-bold mb-1">
            <span>รายจ่ายรวม</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 font-mono">
            {totalExpenses.toLocaleString()} ฿
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">สนาม+ค่าน้ำ</span>
        </div>

        {/* Income Collected */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold mb-1">
            <span>เก็บเงินได้</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700 font-mono">
            {totalCollected.toLocaleString()} ฿
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            {paidCount}/{totalPlayersCount} คน
          </span>
        </div>

        {/* Net Balance */}
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold mb-1">
            <span>คงเหลือ</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <div
            className={`text-base sm:text-lg font-black font-mono ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {netBalance >= 0 ? `+${netBalance}` : netBalance} ฿
          </div>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            {netBalance >= 0 ? 'เงินกองกลาง' : 'ยังขาดทุน'}
          </span>
        </div>
      </div>

      {/* EXPENSE & FEE CONFIG CARD */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>รายการค่าใช้จ่าย</span>
          </h3>

          {isAdmin && (
            <button
              onClick={() => setEditingCosts(!editingCosts)}
              className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold"
              id="btn-edit-costs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingCosts ? 'ปิดแก้ไข' : 'แก้ไขค่าใช้จ่าย'}</span>
            </button>
          )}
        </div>

        {editingCosts ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ค่าสนาม ({session.timeRange || '20:00 - 22:00 น.'})</label>
                <input
                  type="number"
                  value={fieldCostInput}
                  onChange={e => setFieldCostInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-emerald-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ค่าน้ำดื่มเปล่า</label>
                <input
                  type="number"
                  value={waterCostInput}
                  onChange={e => setWaterCostInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-emerald-800 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ค่าอื่นๆ/อุปกรณ์</label>
                <input
                  type="number"
                  value={otherCostInput}
                  onChange={e => setOtherCostInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-emerald-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ค่าเตะต่อคน (บาท)</label>
                <input
                  type="number"
                  value={feePerPlayerInput}
                  onChange={e => setFeePerPlayerInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-amber-700 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const autoFee = Math.ceil((fieldCostInput + waterCostInput + otherCostInput) / (totalPlayersCount || 1));
                  setFeePerPlayerInput(autoFee);
                }}
                className="py-1.5 px-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-[11px] border border-amber-300 transition-all cursor-pointer"
              >
                ⚡ คำนวณหารเฉลี่ย ({totalPlayersCount} คน)
              </button>

              <button
                type="button"
                onClick={handleSaveCosts}
                className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs hover:bg-emerald-700 cursor-pointer"
                id="btn-save-costs"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-700">ค่าสนาม ({session.timeRange || '20:00 - 22:00 น.'})</span>
              <span className="font-mono font-bold text-rose-600">{(session.fieldCost ?? 1800).toLocaleString()} บาท</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-700">ค่าน้ำดื่มเปล่า</span>
              <span className="font-mono font-bold text-rose-600">{(session.waterCost ?? 500).toLocaleString()} บาท</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-700">ค่าอื่นๆ / อุปกรณ์</span>
              <span className="font-mono font-bold text-rose-600">{(session.otherCost ?? 0).toLocaleString()} บาท</span>
            </div>

            <div className="flex items-center justify-between py-2 pt-2 text-slate-900 font-bold border-t border-slate-200">
              <span>รวมรายจ่ายทั้งหมด:</span>
              <span className="font-mono text-rose-700 font-black text-sm">{totalExpenses.toLocaleString()} บาท</span>
            </div>

            <div className="flex items-center justify-between py-2 px-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-950 mt-1">
              <div className="flex flex-col">
                <span className="font-bold text-xs">ค่าเตะต่อคน (บาท)</span>
                <span className="text-[10px] text-emerald-700 font-normal">ค่าที่ทุกคนต้องจ่าย</span>
              </div>
              <span className="font-mono font-black text-base text-emerald-800">
                {session.feePerPlayer || 100} ฿ / คน
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PLAYER PAYMENT TRACKING LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-xs">
        {/* HEADER & STATS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-100">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                <span>เช็กยอดชำระเงิน</span>
              </h3>
              <span className="text-[11px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                {paidCount}/{totalPlayersCount} จ่ายแล้ว
              </span>
              {unpaidCount > 0 ? (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  ค้างชำระ {unpaidCount} คน
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                  จ่ายครบทุกคนแล้ว 🎉
                </span>
              )}
            </div>

            {/* Progress Bar & Percentage */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="w-full max-w-[200px] sm:max-w-sm bg-slate-100 h-2 rounded-full overflow-hidden flex-1 sm:flex-initial">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalPlayersCount > 0 ? (paidCount / totalPlayersCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
                {totalPlayersCount > 0 ? Math.round((paidCount / totalPlayersCount) * 100) : 0}%
              </span>
            </div>
          </div>

          {unpaidCount > 0 && (
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowReminderModal(true)}
                className="w-full sm:w-auto py-1.5 sm:py-2 px-3 sm:px-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                title={`ส่งข้อความทวงเงิน (ค้างชำระ ${unpaidCount} คน)`}
                aria-label="ส่งข้อความทวงเงิน"
                id="btn-send-reminder-icon"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>ทวงเงิน ({unpaidCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* QUICK STATS MINI CARDS */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-xs">
          <div className="p-2 sm:p-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl sm:rounded-2xl">
            <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold block truncate">จ่ายแล้ว</span>
            <span className="text-xs sm:text-base font-mono font-black text-emerald-900 mt-0.5 block truncate">
              {paidCount}/{totalPlayersCount} คน
            </span>
          </div>
          <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl">
            <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold block truncate">ยอดที่เก็บได้</span>
            <span className="text-xs sm:text-base font-mono font-black text-slate-900 mt-0.5 block truncate">
              {totalCollected.toLocaleString()} ฿
            </span>
          </div>
          <div className="p-2 sm:p-2.5 bg-rose-50/70 border border-rose-200/70 rounded-xl sm:rounded-2xl">
            <span className="text-[9px] sm:text-[10px] text-rose-800 font-bold block truncate">ยอดค้างชำระ</span>
            <span className="text-xs sm:text-base font-mono font-black text-rose-700 mt-0.5 block truncate">
              {(unpaidCount * (session.feePerPlayer || 100)).toLocaleString()} ฿
            </span>
          </div>
        </div>

        {/* FILTER TABS & PROPORTIONED SEARCH BUTTON / BAR */}
        <div className="pt-0.5">
          {isSearchOpen || searchTerm !== '' ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาชื่อนักเตะ หรือ ทีม..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full bg-white border border-emerald-500/50 ring-2 ring-emerald-500/10 rounded-xl sm:rounded-2xl py-2 pl-8.5 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-2xs transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                    title="ล้างข้อความค้นหา"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                }}
                className="h-8.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl sm:rounded-2xl transition-all cursor-pointer shrink-0"
              >
                ปิด
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Filter Tabs (ทั้งหมด / ค้าง / จ่ายแล้ว) */}
              <div className="flex-1 min-w-0 grid grid-cols-3 gap-0.5 sm:gap-1 bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`py-1 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-center transition-all cursor-pointer truncate ${
                    filterStatus === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={`ทั้งหมด (${totalPlayersCount})`}
                >
                  ทั้งหมด ({totalPlayersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('unpaid')}
                  className={`py-1 px-1 sm:px-2 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-center transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                    filterStatus === 'unpaid'
                      ? 'bg-white text-rose-700 shadow-2xs'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                  title={`ค้าง (${unpaidCount})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">ค้าง ({unpaidCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('paid')}
                  className={`py-1 px-1 sm:px-2 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-center transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                    filterStatus === 'paid'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-emerald-600'
                  }`}
                  title={`จ่ายแล้ว (${paidCount})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">จ่ายแล้ว ({paidCount})</span>
                </button>
              </div>

              {/* ปุ่มค้นหา (ขนาดพอดี เหมาะสม ไม่เกะกะสายตา) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="h-8.5 px-2.5 sm:px-3 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 hover:text-slate-900 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                id="btn-toggle-search"
                title="ค้นหาชื่อนักเตะ"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden xs:inline text-[11px] sm:text-xs">ค้นหา</span>
              </button>
            </div>
          )}
        </div>

        {/* ULTRA-COMPACT 100% WIDTH TABLE (NO HORIZONTAL SCROLL) */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs divide-y divide-slate-200 table-fixed">
            <thead className="bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-600 select-none">
              <tr>
                <th className="py-2 px-1 sm:px-2 text-center w-6 sm:w-9 shrink-0">#</th>
                <th className="py-2 px-1.5 sm:px-2 min-w-0">ชื่อ / ทีม</th>
                <th className="py-2 px-1 text-right sm:text-center w-12 sm:w-16">ยอด</th>
                <th className="py-2 px-1 text-center w-14 sm:w-20">สถานะ</th>
                <th className="py-2 px-1 text-center w-12 sm:w-16">สลิป/QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                    {filterStatus === 'unpaid'
                      ? '🎉 ชำระเงินครบทุกคนแล้ว ไม่มีรายชื่อค้างชำระ'
                      : filterStatus === 'paid'
                      ? 'ยังไม่มีรายชื่อที่ชำระเงิน'
                      : 'ไม่พบรายชื่อนักเตะที่ค้นหา'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pm, idx) => {
                  const player = players.find(p => p.id === pm.playerId);
                  if (!player) return null;

                  return (
                    <tr
                      key={pm.playerId}
                      onClick={() => handleTogglePayment(pm.playerId)}
                      className={`transition-colors cursor-pointer select-none ${
                        pm.isPaid
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/60'
                          : 'hover:bg-rose-50/20'
                      }`}
                      title={pm.isPaid ? 'จ่ายแล้ว (แตะเพื่อเปลี่ยนเป็นค้างชำระ)' : 'ยังไม่จ่าย (แตะเพื่อบันทึกว่าจ่ายแล้ว)'}
                    >
                      {/* # Index */}
                      <td className="py-2 px-1 sm:px-2 text-center font-mono text-[10px] sm:text-[11px] font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Player Info (Avatar + Nickname + Inline Team Badge) */}
                      <td className="py-2 px-1.5 sm:px-2 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <PlayerAvatar nickname={player.nickname} avatarUrl={player.avatarUrl} size="sm" />
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[7px] shadow-2xs ${
                                pm.isPaid
                                  ? 'bg-emerald-600 text-white ring-1 ring-white'
                                  : 'bg-rose-500 text-white ring-1 ring-white'
                              }`}
                            >
                              {pm.isPaid ? <CheckCircle2 className="w-2 h-2" /> : <XCircle className="w-2 h-2" />}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1 min-w-0">
                              <span className="truncate">{player.nickname}</span>
                              {player.defaultTeam && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 font-bold border border-slate-200 text-slate-600 shrink-0">
                                  {player.defaultTeam}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">
                              {player.name || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount Due / Paid */}
                      <td className="py-2 px-1 text-right sm:text-center">
                        <span
                          className={`font-mono font-black text-[11px] sm:text-xs block ${
                            pm.isPaid ? 'text-emerald-700' : 'text-slate-700'
                          }`}
                        >
                          {pm.isPaid
                            ? `${pm.amountPaid || session.feePerPlayer || 100}฿`
                            : `${pm.amountDue || session.feePerPlayer || 100}฿`}
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="py-2 px-1 text-center">
                        {pm.isPaid ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                              <span className="hidden sm:inline">จ่ายแล้ว</span>
                              <span className="sm:hidden">จ่าย</span>
                            </span>
                            {pm.paidAt && (
                              <span className="text-[8px] text-emerald-600 font-medium mt-0.5 hidden sm:block">
                                {pm.paidAt}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs whitespace-nowrap flex items-center justify-center gap-0.5 mx-auto w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                            <span>ค้าง</span>
                          </span>
                        )}
                      </td>

                      {/* Slip / QR Action Buttons */}
                      <td className="py-2 px-1 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          {pm.slipUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingSlip({
                                  url: pm.slipUrl!,
                                  playerName: player.nickname || player.name,
                                  playerId: pm.playerId,
                                });
                              }}
                              className="p-1 sm:p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-all active:scale-95 shadow-2xs cursor-pointer"
                              title="ดูสลิปการโอนเงิน"
                            >
                              <ImageIcon className="w-3 h-3 text-emerald-700" />
                            </button>
                          ) : null}

                          {onOpenPaymentModal && (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(pm.playerId)}
                              className="p-1 sm:p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200 transition-all active:scale-95 shadow-2xs cursor-pointer"
                              title="เปิด QR พร้อมเพย์ / แจ้งชำระเงิน"
                            >
                              <QrCode className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Viewer Modal */}
      {viewingSlip && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setViewingSlip(null)}
        >
          <div
            className="relative max-w-md w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-3 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 text-white border-b border-slate-800">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>สลิปชำระเงิน - {viewingSlip.playerName}</span>
              </span>
              <button
                type="button"
                onClick={() => setViewingSlip(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-1 flex items-center justify-center max-h-[60vh] overflow-auto bg-slate-950/50 rounded-2xl">
              <img src={viewingSlip.url} alt="หลักฐานสลิปการโอนเงิน" className="max-w-full h-auto rounded-xl shadow-lg" />
            </div>

            {/* Retroactive Slip Action Bar */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              {onOpenPaymentModal && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = viewingSlip.playerId;
                    setViewingSlip(null);
                    onOpenPaymentModal(targetId);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไข / เปลี่ยนสลิปย้อนหลัง</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`ต้องการลบสลิปของ ${viewingSlip.playerName} ออกหรือไม่?`)) {
                      const updated = (session.payments || []).map(p => {
                        if (p.playerId === viewingSlip.playerId) {
                          return { ...p, slipUrl: undefined };
                        }
                        return p;
                      });
                      onUpdatePayments(updated);
                      setViewingSlip(null);
                    }
                  }}
                  className="py-2 px-3 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shrink-0"
                >
                  ลบสลิป
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* SEND REMINDER MODAL */}
      <SendReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        session={session}
        players={players}
      />
    </div>
  );
};
