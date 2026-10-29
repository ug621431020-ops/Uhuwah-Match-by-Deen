import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Edit3, CheckCircle2, Trash2, AlertTriangle, Activity } from 'lucide-react';
import { FootballSession } from '../types';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FootballSession | null;
  onSave: (updatedSession: FootballSession) => void;
  canDelete?: boolean;
  onDeleteSession?: (sessionId: string) => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  onSave,
  canDelete = false,
  onDeleteSession,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'in_progress' | 'completed'>('in_progress');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setDate(session.date || '');
      setTimeRange(session.timeRange || '20:00 - 22:00 น.');
      setLocation(session.location || '');
      setStatus(session.status || 'in_progress');
      setConfirmDelete(false);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...session,
      title,
      date,
      timeRange,
      location,
      status,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteSession) {
      onDeleteSession(session.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="ปิดหน้าต่าง"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4 pr-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff2a6d]/15 to-[#ff007f]/5 text-[#ff2a6d] border border-[#ff2a6d]/20 flex items-center justify-center shrink-0 shadow-2xs">
            <Edit3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
              แก้ไขข้อมูลรอบแข่งขัน
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              วัน เวลา สนาม และสถานะการแข่งขัน
            </p>
          </div>
        </div>

        {confirmDelete ? (
          /* Delete Confirmation Screen inside Modal */
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-rose-900">
                ยืนยันการลบรอบการแข่งขัน?
              </h3>
              <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                คุณต้องการลบ <strong>"{session.title}"</strong> ใช่หรือไม่? ข้อมูลแมตช์ สถิติ และค่าใช้จ่ายของสัปดาห์นี้จะถูกลบทั้งหมด
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                id="btn-confirm-delete-session"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบ</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Status Selection Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#ff2a6d]" />
                <span>สถานะการแข่งขัน</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus('in_progress')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'in_progress'
                      ? 'bg-rose-50 border-[#ff2a6d] text-[#ff2a6d] shadow-2xs ring-1 ring-[#ff2a6d]/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff2a6d] animate-pulse shrink-0" />
                  <span>กำลังแข่ง</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('upcoming')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'upcoming'
                      ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-2xs ring-1 ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                  <span>เตรียมตัว</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    status === 'completed'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span>จบแล้ว</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ชื่อรอบ / หัวข้อการแข่ง
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-[#ff2a6d] focus:bg-white transition-colors"
                placeholder="เช่น บอลพฤหัสบดี 13 ส.ค. 2026..."
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  วันที่ (Date)
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-2 text-xs text-slate-900 focus:outline-none focus:border-[#ff2a6d] focus:bg-white font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เวลา (Time Range)
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={timeRange}
                    onChange={e => setTimeRange(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-2 text-xs text-slate-900 focus:outline-none focus:border-[#ff2a6d] focus:bg-white transition-colors"
                    placeholder="20:00 - 22:00 น."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                สนามแข่ง (Location)
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-900 focus:outline-none focus:border-[#ff2a6d] focus:bg-white transition-colors"
                  placeholder="สนาม ซอย 9 หรือ Green Arena..."
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              id="btn-save-session-edit"
              className="w-full py-2.5 px-4 rounded-xl font-bold bg-[#ff2a6d] hover:bg-[#ff007f] text-white transition-all shadow-md shadow-rose-500/20 active:scale-98 flex items-center justify-center gap-1.5 text-xs mt-3 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกการเปลี่ยนแปลง</span>
            </button>

            {/* Delete Session Button (if admin and more than 1 session) */}
            {onDeleteSession && (
              <div className="pt-2 border-t border-slate-100">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    id="btn-request-delete-session"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>ลบรอบการแข่งขันนี้ (ลบสัปดาห์นี้)</span>
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400 text-center">
                    * ไม่สามารถลบรอบสุดท้ายได้ (ระบบต้องมีอย่างน้อย 1 สัปดาห์)
                  </p>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
