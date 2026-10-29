import React, { useState } from 'react';
import {
  X,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
  Palette,
  Users,
} from 'lucide-react';
import { Team, TeamColor, FootballSession, Player } from '../types';
import { TeamCrest } from './TeamCrest';

interface AdminTeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FootballSession;
  players: Player[];
  onAddTeam: (team: { name: string; color: TeamColor }) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onRegenerateSchedule?: () => void;
}

const COLOR_OPTIONS: { color: TeamColor; label: string; bgClass: string; borderClass: string }[] = [
  { color: 'red', label: 'สีแดง', bgClass: 'bg-rose-500', borderClass: 'border-rose-400' },
  { color: 'blue', label: 'สีน้ำเงิน', bgClass: 'bg-blue-600', borderClass: 'border-blue-400' },
  { color: 'green', label: 'สีเขียว', bgClass: 'bg-emerald-600', borderClass: 'border-emerald-400' },
  { color: 'black', label: 'สีดำ', bgClass: 'bg-slate-900', borderClass: 'border-slate-700' },
  { color: 'yellow', label: 'สีเหลือง', bgClass: 'bg-amber-400', borderClass: 'border-amber-300' },
  { color: 'purple', label: 'สีม่วง', bgClass: 'bg-purple-600', borderClass: 'border-purple-400' },
  { color: 'orange', label: 'สีส้ม', bgClass: 'bg-orange-500', borderClass: 'border-orange-400' },
];

export const AdminTeamManagerModal: React.FC<AdminTeamManagerModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onRegenerateSchedule,
}) => {
  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState<TeamColor>('yellow');
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Team State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<TeamColor>('red');

  // Delete Confirmation State
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditColor(team.color);
  };

  const handleSaveEdit = (team: Team) => {
    if (!editName.trim()) {
      alert('กรุณากรอกชื่อทีม');
      return;
    }
    onUpdateTeam({
      ...team,
      name: editName.trim(),
      color: editColor,
    });
    setEditingTeamId(null);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
  };

  const handleCreateNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      alert('กรุณากรอกชื่อทีม');
      return;
    }
    onAddTeam({
      name: newTeamName.trim(),
      color: newTeamColor,
    });
    setNewTeamName('');
    setShowAddForm(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingTeam) return;
    onDeleteTeam(deletingTeam.id);
    setDeletingTeam(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 text-slate-900 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                จัดการทีมแข่งขัน (หลังบ้าน)
              </h3>
              <p className="text-[11px] text-slate-500">
                เปลี่ยนชื่อทีม เพิ่มทีมใหม่ ลบทีม หรือปรับแต่งสีทีม
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOP SUMMARY & ADD BUTTON */}
        <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">
              จำนวนทีมปัจจุบัน: <span className="font-mono text-[#ff2a6d] font-black">{session.teams.length} ทีม</span>
            </span>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มทีมใหม่</span>
            </button>
          )}
        </div>

        {/* ADD NEW TEAM FORM */}
        {showAddForm && (
          <form
            onSubmit={handleCreateNewTeam}
            className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>สร้างทีมแข่งขันใหม่</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
              >
                ปิดฟอร์ม
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                ชื่อทีม (Team Name):
              </label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                placeholder="เช่น HARIMAU, TEA-GOLD, ทีม 5..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-500" />
                <span>เลือกสีประจำทีม:</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setNewTeamColor(opt.color)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      newTeamColor === opt.color
                        ? 'bg-white border-emerald-500 text-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/70 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${opt.bgClass} shadow-xs`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-1.5 px-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                บันทึกเพิ่มทีม
              </button>
            </div>
          </form>
        )}

        {/* CURRENT TEAMS LIST */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              รายชื่อทีมทั้งหมด ({session.teams.length})
            </span>
            <span className="text-[10px] text-slate-400">
              คลิกที่ปุ่มดินสอเพื่อแก้ไขชื่อหรือสีทีม
            </span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {session.teams.map((team, idx) => {
              const isEditing = editingTeamId === team.id;
              const memberCount = team.playerIds.length;
              const matchesCount = session.matches.filter(
                m => m.homeTeamId === team.id || m.awayTeamId === team.id
              ).length;

              if (isEditing) {
                return (
                  <div
                    key={team.id}
                    className="p-3 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>แก้ไขทีมที่ {idx + 1}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">ชื่อทีม:</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700">สีทีม:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_OPTIONS.map(opt => (
                          <button
                            key={opt.color}
                            type="button"
                            onClick={() => setEditColor(opt.color)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer ${
                              editColor === opt.color
                                ? 'bg-white border-amber-500 text-slate-900 ring-1 ring-amber-500 shadow-2xs'
                                : 'bg-white/70 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${opt.bgClass}`} />
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="py-1 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(team)}
                        className="py-1 px-3.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        บันทึกชื่อทีม
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamCrest teamName={team.name} color={team.color} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                          {team.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {COLOR_OPTIONS.find(c => c.color === team.color)?.label || team.color}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>สมาชิก: {memberCount} คน</span>
                        <span>•</span>
                        <span>แมตช์ที่ลงเล่น: {matchesCount} นัด</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(team)}
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-amber-700 cursor-pointer transition-colors"
                      title="เปลี่ยนชื่อทีมหรือสีทีม"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingTeam(team)}
                      disabled={session.teams.length <= 2}
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                      title={
                        session.teams.length <= 2
                          ? 'ต้องมีอย่างน้อย 2 ทีมเพื่อแข่งขัน'
                          : 'ลบทีมนี้'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCHEDULE HELPER OPTION */}
        {onRegenerateSchedule && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">
                อัปเดตตารางแข่งขันตามทีมปัจจุบัน
              </span>
              <span className="text-[10px] text-amber-700">
                หากมีการเพิ่มหรือลบทีม สามารถกดสร้างตารางแข่งวนใหม่อัตโนมัติได้ทันที
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('ต้องการสร้างตารางแข่งขันใหม่ตามทีมปัจจุบันใช่หรือไม่?')) {
                  onRegenerateSchedule();
                  onClose();
                }
              }}
              className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>สร้างตารางใหม่</span>
            </button>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
          >
            เรียบร้อย
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE TEAM MODAL */}
      {deletingTeam && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 text-slate-900 shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                ยืนยันการลบทีม "{deletingTeam.name}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                การลบทีมนี้จะส่งผลต่อนักเตะและแมตช์ที่เกี่ยวข้อง
              </p>
            </div>

            <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs space-y-1.5 text-left text-rose-950">
              <div>
                • มีนักเตะในทีม <span className="font-black">{deletingTeam.playerIds.length} คน</span> (นักเตะจะถูกย้ายเป็นรอสังกัดทีม)
              </div>
              <div>
                • แมตช์การแข่งขันที่มีทีมนี้จะถูกลบออก และจัดเรียงลำดับนัดที่เหลือใหม่
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTeam(null)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                ยืนยันลบทีม
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
