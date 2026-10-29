import React, { useState } from 'react';
import { Lock, KeyRound, User, CheckCircle2, AlertCircle, X, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setPassword('');
    setUsername('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === 'admin' && password === '1234') {
      setError('');
      onLoginSuccess();
      handleClose();
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-slate-900 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shadow-2xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">เข้าสู่ระบบแอดมิน</h2>
            <p className="text-xs text-slate-500">สำหรับทีมงานจัดการตารางและข้อมูลการแข่งขัน</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อผู้ใช้ (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                id="input-admin-username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="ระบุชื่อผู้ใช้"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                id="input-admin-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="btn-admin-submit"
            className="w-full py-2.5 px-4 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-xs flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>
      </div>
    </div>
  );
};

