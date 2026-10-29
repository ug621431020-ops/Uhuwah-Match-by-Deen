import React, { useState } from 'react';
import { Copy, Check, X, MessageSquare, Image as ImageIcon, Loader2, Share2 } from 'lucide-react';
import { FootballSession, Player } from '../types';
import { calculateTeamStats } from '../services/storage';
import { generateSessionJPG } from '../utils/pdfGenerator';

interface ShareSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FootballSession | null;
  players: Player[];
}

export const ShareSummaryModal: React.FC<ShareSummaryModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingJPG, setIsGeneratingJPG] = useState(false);

  if (!isOpen || !session) return null;

  const standings = calculateTeamStats(session);
  const champion = standings[0];

  const getTeamEmoji = (color?: string, name?: string) => {
    if (color === 'blue' || name?.includes('AGSA')) return '🔵';
    if (color === 'green' || name?.includes('KOPI')) return '🟢';
    if (color === 'red' || name?.includes('TEA')) return '🔴';
    if (color === 'black' || name?.includes('BLOOM')) return '⚫';
    if (color === 'yellow') return '🟡';
    if (color === 'purple') return '🟣';
    return '⚽';
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

  const formatThaiCurrentTimestamp = () => {
    const now = new Date();
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
    const day = now.getDate();
    const month = monthNames[now.getMonth()];
    const yearBE = now.getFullYear() + 543;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${yearBE} | ${hours}:${minutes} น.`;
  };

  const attendingPlayerIds = (session.attendingPlayerIds && session.attendingPlayerIds.length > 0)
    ? session.attendingPlayerIds
    : players.map(p => p.id);

  const totalPlayersCount = attendingPlayerIds.length;
  const paidCount = attendingPlayerIds.filter(pid => session.payments?.some(p => p.playerId === pid && p.isPaid)).length;
  const unpaidCount = totalPlayersCount - paidCount;

  let paymentStatusText = '';
  if (unpaidCount === 0) {
    paymentStatusText = `ชำระครบทุกคนแล้ว (${paidCount}/${totalPlayersCount} จ่ายแล้ว)`;
  } else {
    const unpaidNames = attendingPlayerIds
      .filter(pid => !session.payments?.some(p => p.playerId === pid && p.isPaid))
      .map(pid => players.find(x => x.id === pid)?.nickname || players.find(x => x.id === pid)?.name)
      .filter(Boolean);
    paymentStatusText = `จ่ายแล้ว (${paidCount}/${totalPlayersCount} คน) | ค้างชำระ ${unpaidCount} คน (${unpaidNames.join(', ')})`;
  }

  const shareText = `⚽ MATCH UKHUWAH | สรุปผลประจำสัปดาห์

📅 ${formatThaiFullDate(session.date)}
🕗 เวลา ${session.timeRange || '20:00 - 22:00 น.'}
📍 สนาม ${session.location || 'สนาม CN ตือเบาะ'}

🏆 อันดับ 1 ประจำสัปดาห์
🥇 ${champion ? champion.teamName : 'ยังไม่มีผลสรุป'} — ${champion ? champion.points : 0} คะแนน

📊 ตารางคะแนนรวม

${standings
  .map(
    (st, idx) =>
      `${idx + 1}. ${getTeamEmoji(st.color, st.teamName)} ${st.teamName} | แข่ง ${st.played} | ชนะ ${st.won} | เสมอ ${st.drawn} | แพ้ ${st.lost} | ${st.points} แต้ม`
  )
  .join('\n')}

💰 สรุปค่าใช้จ่าย

* ค่าสนาม (${session.timeRange || '20:00 - 22:00 น.'}) — ${(session.fieldCost || 1800).toLocaleString()} บาท
* ค่าน้ำเปล่า — ${(session.waterCost || 200).toLocaleString()} บาท
* ค่าเตะ — คนละ ${(session.feePerPlayer || 100).toLocaleString()} บาท

✅ สถานะการชำระเงิน
${paymentStatusText}

ขอบคุณทุกคนครับ ⚽
MATCH UKHUWAH — ฟุตบอลแห่งมิตรภาพและความผูกพัน

━━━━━━━━━━━━━━━━━━
🤖 ข้อความจากระบบ MATCH UKHUWAH
🕐 ส่งเมื่อ: ${formatThaiCurrentTimestamp()}
━━━━━━━━━━━━━━━━━━`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, '_blank', 'width=600,height=500');
  };

  const handleDownloadJPG = async () => {
    setIsGeneratingJPG(true);
    try {
      await generateSessionJPG(session, players);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingJPG(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          id="btn-close-share-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">สรุปผล & ออกรายงาน</h3>
            <p className="text-xs text-slate-500">ส่งข้อความลงไลน์กลุ่ม หรือบันทึกเป็นไฟล์ JPG</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
            ข้อความสรุปผล (LINE/Chat)
          </label>
          <textarea
            readOnly
            value={shareText}
            rows={8}
            className="w-full bg-transparent text-xs font-mono text-emerald-800 leading-relaxed resize-none focus:outline-none scrollbar-thin"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              id="btn-copy-share-text"
              className="py-2.5 px-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-[0.98] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
            </button>

            <button
              onClick={handleShareFacebook}
              id="btn-share-facebook"
              className="py-2.5 px-3 rounded-xl font-bold bg-[#1877F2] text-white hover:bg-[#166fe5] transition-all flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์ลง Facebook</span>
            </button>
          </div>

          <button
            onClick={handleDownloadJPG}
            disabled={isGeneratingJPG}
            id="btn-generate-jpg-summary"
            className="w-full py-2.5 px-4 rounded-xl font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2 text-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingJPG ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <ImageIcon className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isGeneratingJPG ? 'กำลังสร้างภาพ JPG...' : 'บันทึกเป็นไฟล์ JPG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

