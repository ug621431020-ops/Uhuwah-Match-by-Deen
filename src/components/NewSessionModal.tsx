import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Plus, Shield, Users } from 'lucide-react';
import { FootballSession, Player, Team } from '../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onCreateSession: (sessionData: {
    title: string;
    date: string;
    timeRange: string;
    location: string;
    maxPlayersPerTeam: number;
  }) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  onCreateSession,
}) => {
  const defaultDate = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState(`สัปดาห์ที่ - ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`);
  const [date, setDate] = useState(defaultDate);
  const [timeRange, setTimeRange] = useState('20:00 - 22:00 น.');
  const [location, setLocation] = useState('สนาม ซอย 9 (สนาม 2)');
  const [maxPlayers, setMaxPlayers] = useState(7);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSession({
      title,
      date,
      timeRange,
      location,
      maxPlayersPerTeam: maxPlayers || 7,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 text-slate-900 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">แอดมินสร้างรายการประจำสัปดาห์</h2>
            <p className="text-xs text-slate-500">เปิดระบบลงทะเบียนเข้าเตะและเลือกทีมสัปดาห์นี้</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              หัวข้อ / ชื่อสัปดาห์ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="เช่น สัปดาห์ที่ 12 - บอลพฤหัส..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                วันที่แข่ง *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-2 font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold">
                ช่วงเวลา *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={timeRange}
                  onChange={e => setTimeRange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                  placeholder="20:00 - 22:00 น."
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">
              สถานที่ / สนาม *
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-8 pr-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                placeholder="สนาม ซอย 9 (สนาม 2)..."
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                โควตานักเตะต่อทีม
              </span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                ไม่เกิน {maxPlayers} คน/ทีม
              </span>
            </div>
            <p className="text-[10px] text-emerald-800 leading-snug">
              ตั้งค่าทีมละไม่เกิน 7 คนเป็นค่าเริ่มต้น เมื่อเปิดสัปดาห์ นักเตะจะเลือกลงทีมได้โดยตรง
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>สร้างสัปดาห์นี้</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
