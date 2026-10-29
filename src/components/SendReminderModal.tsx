import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Copy,
  Check,
  Bell,
  AlertCircle,
  MessageSquare,
  Building2,
  Smartphone,
  Share2,
} from 'lucide-react';
import { FootballSession, Player } from '../types';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FootballSession | null;
  players: Player[];
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
}) => {
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('');

  const targetPlayerIds = (session?.attendingPlayerIds && session.attendingPlayerIds.length > 0)
    ? session.attendingPlayerIds
    : players.map(p => p.id);

  // Find unpaid players
  const unpaidPlayers = session ? targetPlayerIds
    .filter(pid => !session.payments?.some(p => p.playerId === pid && p.isPaid))
    .map(pid => {
      const p = players.find(x => x.id === pid);
      const paymentInfo = session.payments?.find(pm => pm.playerId === pid);
      return {
        id: pid,
        nickname: p?.nickname || 'นักเตะ',
        name: p?.name || '',
        amount: paymentInfo?.amountDue || session.feePerPlayer || 100,
      };
    }) : [];

  const feePerPerson = session?.feePerPlayer || 100;
  const promptPayId = session?.paymentInfo?.promptPayId || '0812345678';
  const bankName = session?.paymentInfo?.bankName || 'กสิกรไทย (KBank)';
  const accountNumber = session?.paymentInfo?.accountNumber || '123-4-56789-0';
  const accountName = session?.paymentInfo?.accountName || 'แอดมิน กีฬาเตะบอล';

  // Construct default reminder message
  const defaultMessage = session ? `📢 **แจ้งเตือนชำระเงินค่าเตะบอลประจำสัปดาห์** ⚽
📌 รายการ: ${session.title || 'เตะบอลกระชับมิตร'}
⏰ เวลา: ${session.timeRange || '20:00 - 22:00 น.'} (${session.location || 'สนามซอย 9'})
💰 ค่าเตะต่อคน: ${feePerPerson} บาท

🔴 **รายชื่อนักเตะที่ยังค้างชำระ (${unpaidPlayers.length} คน):**
${unpaidPlayers.map((p, i) => `${i + 1}. ${p.nickname} (${p.amount}฿)`).join('\n')}

💳 **ช่องทางชำระเงิน:**
• พร้อมเพย์: ${promptPayId}
• ${bankName}: ${accountNumber}
• ชื่อบัญชี: ${accountName}

📲 โอนแล้วกรุณาแจ้งสลิปในระบบหรือส่งเข้ากลุ่มด้วยนะครับ ขอบคุณครับ 🙏` : '';

  useEffect(() => {
    if (isOpen && session) {
      setCustomText(defaultMessage);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    // Facebook Sharer URL opens a post dialog with text/quote or link
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(customText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500');
  };

  const handleShareLine = () => {
    if (navigator.share) {
      navigator.share({
        title: 'แจ้งเตือนค่าเตะบอล',
        text: customText,
      }).catch(() => {
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(customText)}`;
        window.open(lineUrl, '_blank');
      });
    } else {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(customText)}`;
      window.open(lineUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                แจ้งเตือนค้างชำระเงิน (Send Reminder)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                ส่งข้อความทวงเงินให้นักเตะที่ยังไม่จ่าย ({unpaidPlayers.length} คน)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unpaid Players Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>รายชื่อที่ค้างชำระ ({unpaidPlayers.length} คน)</span>
            </span>
            <span className="font-mono text-rose-600 font-bold">
              รวม {(unpaidPlayers.reduce((s, p) => s + p.amount, 0)).toLocaleString()} ฿
            </span>
          </div>

          {unpaidPlayers.length === 0 ? (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center border border-emerald-200">
              🎉 ชำระเงินครบทุกคนแล้ว ไม่มีรายชื่อค้างชำระ!
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-rose-50/50 rounded-2xl border border-rose-100">
              {unpaidPlayers.map((p, idx) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 bg-white text-rose-900 font-bold text-xs rounded-xl border border-rose-200 shadow-2xs flex items-center gap-1"
                >
                  <span className="text-[10px] text-rose-400 font-mono">{idx + 1}.</span>
                  <span>{p.nickname}</span>
                  <span className="text-[10px] font-mono text-rose-600">({p.amount}฿)</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Custom Editable Message Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>ข้อความทวงเงิน (แก้ไขปรับแต่งได้)</span>
            </label>
            <button
              onClick={() => setCustomText(defaultMessage)}
              className="text-[10px] text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
            >
              🔄 รีเซ็ตข้อความ
            </button>
          </div>

          <textarea
            rows={8}
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 leading-relaxed focus:outline-none focus:border-amber-500 shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareFacebook}
            className="flex-1 py-2.5 px-3 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>โพสต์ลง Facebook</span>
          </button>

          <button
            type="button"
            onClick={handleShareLine}
            className="flex-1 py-2.5 px-3 bg-[#00B900] hover:bg-[#009900] text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>ส่งเข้า LINE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
