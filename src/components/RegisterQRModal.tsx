import React, { useRef, useState } from 'react';
import { Download, X, Copy, Check, QrCode, CalendarCheck, MapPin, Clock, Users, Sparkles, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { FootballSession, Player } from '../types';

interface RegisterQRModalProps {
  session?: FootballSession | null;
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterQRModal: React.FC<RegisterQRModalProps> = ({
  session,
  players,
  isOpen,
  onClose,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Use URL targeting all roster and add player modal
  const getRegisterUrl = () => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'players');
      url.searchParams.set('view', 'all_roster');
      url.searchParams.set('action', 'add_player');
      return url.toString();
    } catch {
      return window.location.href;
    }
  };

  const registerUrl = getRegisterUrl();
  const attendingCount = session?.attendingPlayerIds?.length || 0;
  const totalPlayersCount = players.length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toJpeg(posterRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#022c22', // emerald-950
      });
      const link = document.createElement('a');
      link.download = `football-register-qr-${session?.date || 'roster'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download QR Poster error:', err);
      alert('ไม่สามารถดาวน์โหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">QR Code เพิ่มสมาชิก & สังกัดทีม</h3>
              <p className="text-[10px] text-slate-500">สแกนเพื่อเปิดหน้าสมาชิกทั้งหมด และกรอกข้อมูลเพิ่มสมาชิกทันที</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* POSTER CARD (TARGET FOR HTML-TO-IMAGE DOWNLOAD) */}
        <div className="p-3 sm:p-4 bg-slate-100/70">
          <div
            ref={posterRef}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 p-5 text-white shadow-xl border border-emerald-700/60"
          >
            {/* Background Aesthetic Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Poster Header */}
            <div className="relative z-10 text-center space-y-1.5 pb-3 border-b border-emerald-800/60">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black tracking-wider uppercase">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>ลงทะเบียนเพิ่มสมาชิก & สังกัดทีม</span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {session?.title || 'รายชื่อสมาชิกฟุตบอล'}
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-emerald-200/90 font-medium">
                <span className="inline-flex items-center gap-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-700/60">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{session?.timeRange || '20:00 - 22:00 น.'}</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-700/60">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{session?.location || 'สนามซอย 9'}</span>
                </span>
              </div>
            </div>

            {/* QR CODE CONTAINER */}
            <div className="relative z-10 flex flex-col items-center my-4">
              <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/30 flex items-center justify-center">
                <QRCodeSVG
                  value={registerUrl}
                  size={190}
                  level="H"
                  includeMargin={true}
                  fgColor="#022c22"
                  bgColor="#ffffff"
                />
              </div>

              <div className="mt-3 text-center space-y-1">
                <p className="text-xs font-bold text-emerald-300">
                  📱 สแกนเพื่อเปิดหน้าสมาชิก & เพิ่มสมาชิกใหม่
                </p>
                <p className="text-[10px] text-slate-300">
                  กรอกชื่อเล่น • เลือกสังกัดทีม • ระดับฝีมือ
                </p>
              </div>
            </div>

            {/* STATUS BADGE */}
            <div className="relative z-10 bg-slate-900/90 rounded-xl p-2.5 border border-emerald-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300 text-[11px]">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>จำนวนสมาชิกในระบบ</span>
              </div>
              <div className="flex items-center gap-1 font-mono font-black text-emerald-400 text-xs">
                <span>{totalPlayersCount}</span>
                <span className="text-slate-300">คน</span>
              </div>
            </div>

            {/* Poster Footer Note */}
            <div className="relative z-10 mt-3 pt-2 text-center border-t border-emerald-900/60">
              <span className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-semibold">
                ⚽ ระบบจัดการแมตช์ฟุตบอล • สังกัดทีมและจัดคู่เตะอัตโนมัติ
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white space-y-2 border-t border-slate-100">
          <button
            onClick={handleDownloadPoster}
            disabled={isDownloading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            id="btn-download-register-qr"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกรูปภาพ...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>บันทึกรูป QR Code (ส่งในกลุ่ม LINE)</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">คัดลอกลิงก์แล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>คัดลอกลิงก์</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
