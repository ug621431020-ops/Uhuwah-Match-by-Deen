import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Building2,
  Smartphone,
  CheckCircle2,
  Shield,
  Edit3,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  Wallet,
  ArrowRight,
  Info,
  Banknote,
  AlertCircle,
  Undo2
} from 'lucide-react';
import { generatePromptPayPayload, getStoredPaymentInfo, saveStoredPaymentInfo, PaymentInfo } from '../utils/promptpay';
import { FootballSession, Player } from '../types';
import { PlayerAvatar } from './PlayerAvatar';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: FootballSession;
  players: Player[];
  selectedPlayerId?: string;
  isAdmin?: boolean;
  onConfirmPayment?: (
    playerId: string,
    slipUrl?: string,
    amount?: number,
    paymentMethod?: 'promptpay' | 'cash' | 'transfer'
  ) => void;
  onUnmarkPayment?: (playerId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  session,
  players,
  selectedPlayerId: initialPlayerId,
  isAdmin = false,
  onConfirmPayment,
  onUnmarkPayment,
}) => {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>(getStoredPaymentInfo());
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialPlayerId || '');
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'transfer' | 'cash'>('promptpay');
  const [customAmount, setCustomAmount] = useState<number>(session.feePerPlayer || 100);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [showSlipViewer, setShowSlipViewer] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Editable fields for admin
  const [editPromptPay, setEditPromptPay] = useState(paymentInfo.promptPayId);
  const [editBankName, setEditBankName] = useState(paymentInfo.bankName);
  const [editAccountNum, setEditAccountNum] = useState(paymentInfo.accountNumber);
  const [editAccountName, setEditAccountName] = useState(paymentInfo.accountName);

  useEffect(() => {
    if (initialPlayerId) {
      setSelectedPlayerId(initialPlayerId);
    } else if (players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(players[0].id);
    }
  }, [initialPlayerId, players]);

  useEffect(() => {
    const fee = session.feePerPlayer || 100;
    setCustomAmount(fee);
  }, [session.feePerPlayer]);

  // Sync existing slip and payment status if player already paid
  useEffect(() => {
    const playerPayment = session.payments?.find(p => p.playerId === selectedPlayerId);
    if (playerPayment?.slipUrl) {
      setSlipImage(playerPayment.slipUrl);
    } else {
      setSlipImage(null);
    }
    if (playerPayment?.paymentMethod) {
      setPaymentMethod(playerPayment.paymentMethod);
    }
    if (playerPayment?.amountPaid && playerPayment.amountPaid > 0) {
      setCustomAmount(playerPayment.amountPaid);
    } else {
      setCustomAmount(session.feePerPlayer || 100);
    }
  }, [selectedPlayerId, session.payments, session.feePerPlayer]);

  // Paste image handler from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || isEditingAdmin) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setSlipImage(reader.result as string);
              setErrorMessage(null);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isEditingAdmin]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSlipViewer) {
          setShowSlipViewer(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showSlipViewer, onClose]);

  if (!isOpen) return null;

  const currentPlayer = players.find(p => p.id === selectedPlayerId);
  const playerPayment = session.payments?.find(p => p.playerId === selectedPlayerId);
  const isPlayerAlreadyPaid = playerPayment?.isPaid || false;

  const promptPayPayload = generatePromptPayPayload(paymentInfo.promptPayId, customAmount);

  // Format promptpay ID for clean display
  const formatPromptPayDisplay = (id: string) => {
    const clean = id.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`;
    }
    if (clean.length === 13) {
      return `${clean.substring(0, 1)}-${clean.substring(1, 5)}-${clean.substring(5, 10)}-${clean.substring(10, 12)}-${clean.substring(12)}`;
    }
    return id;
  };

  const processFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (กรุณาเลือกรูปขนาดไม่เกิน 8MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipImage(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveSlip = () => {
    setSlipImage(null);
  };

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(paymentInfo.promptPayId.replace(/[^0-9]/g, ''));
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleCopyBank = () => {
    navigator.clipboard.writeText(paymentInfo.accountNumber.replace(/[^0-9]/g, ''));
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // High-resolution promptpay card export for saving directly to phone/desktop
  const handleDownloadQR = () => {
    setIsDownloading(true);
    const svgElement = document.getElementById('promptpay-qr-svg');
    if (!svgElement) {
      setIsDownloading(false);
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const qrImage = new Image();
    qrImage.onload = () => {
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Outer Card Background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 36);
        ctx.fill();

        // Top Thai QR Header (PromptPay Navy)
        const headerGradient = ctx.createLinearGradient(0, 0, width, 190);
        headerGradient.addColorStop(0, '#002A54');
        headerGradient.addColorStop(1, '#004B87');
        ctx.fillStyle = headerGradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, width, 190, [36, 36, 0, 0]);
        ctx.fill();

        // Thai QR & PromptPay Text in Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px "Prompt", "Noto Sans Thai", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Thai QR Payment', width / 2, 80);

        ctx.font = 'bold 24px "Prompt", "Noto Sans Thai", sans-serif';
        ctx.fillStyle = '#BAE6FD';
        ctx.fillText('สแกนจ่ายผ่านพร้อมเพย์ (PromptPay)', width / 2, 130);

        // White Box for QR Code
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(140, 230, 520, 520, 24);
        ctx.fill();
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw QR Code in Center
        ctx.drawImage(qrImage, 175, 265, 450, 450);

        // Account Name
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 32px "Prompt", "Noto Sans Thai", sans-serif';
        ctx.fillText(paymentInfo.accountName || 'ผู้รับชำระเงิน', width / 2, 805);

        // PromptPay ID
        ctx.fillStyle = '#475569';
        ctx.font = '26px monospace';
        ctx.fillText(`พร้อมเพย์: ${formatPromptPayDisplay(paymentInfo.promptPayId)}`, width / 2, 850);

        // Amount Box Badge
        ctx.fillStyle = '#ECFDF5';
        ctx.beginPath();
        ctx.roundRect(150, 890, 500, 100, 20);
        ctx.fill();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#065F46';
        ctx.font = 'bold 36px "Prompt", "Noto Sans Thai", sans-serif';
        ctx.fillText(`จำนวนเงิน  ${customAmount.toLocaleString('th-TH')}  บาท`, width / 2, 955);

        // Generate download
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `PromptPay_${paymentInfo.promptPayId}_${customAmount}THB.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      setIsDownloading(false);
      window.URL.revokeObjectURL(blobURL);
    };
    qrImage.src = blobURL;
  };

  const handleSaveAdminPaymentInfo = () => {
    const newInfo: PaymentInfo = {
      promptPayId: editPromptPay.trim(),
      bankName: editBankName.trim(),
      accountNumber: editAccountNum.trim(),
      accountName: editAccountName.trim(),
    };
    setPaymentInfo(newInfo);
    saveStoredPaymentInfo(newInfo);
    setIsEditingAdmin(false);
  };

  const handleConfirmPaid = () => {
    if (!selectedPlayerId || !onConfirmPayment) return;

    setErrorMessage(null);
    onConfirmPayment(selectedPlayerId, slipImage || undefined, customAmount, paymentMethod);
    setIsPaidSuccess(true);
    setTimeout(() => {
      setIsPaidSuccess(false);
      onClose();
    }, 1000);
  };

  const handleCancelPayment = () => {
    if (!selectedPlayerId || !onUnmarkPayment) return;
    if (confirm(`ต้องการยกเลิกสถานะชำระเงินของ ${currentPlayer?.nickname || 'นักเตะคนนี้'} ให้เป็นค้างชำระใช่หรือไม่?`)) {
      onUnmarkPayment(selectedPlayerId);
      setSlipImage(null);
      onClose();
    }
  };

  const presetAmounts = [
    session.feePerPlayer || 100,
    50,
    150,
    200
  ].filter((v, i, a) => a.indexOf(v) === i && v > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-0 relative cursor-default max-h-[94vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white leading-tight">
                  ชำระเงิน / แนบสลิป
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PromptPay & Cash
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                {session.title || 'ฟุตบอลนัดกระชับมิตร'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Admin Edit Toggle */}
          {isAdmin && (
            <div className="flex justify-between items-center bg-amber-50/80 border border-amber-200 rounded-2xl p-2 px-3">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                โหมดจัดการ (Admin)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAdmin(!isEditingAdmin)}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-white hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                <span>{isEditingAdmin ? 'กลับหน้าชำระเงิน' : 'แก้ไขเลขบัญชี/พร้อมเพย์'}</span>
              </button>
            </div>
          )}

          {/* Admin Editing Form */}
          {isEditingAdmin ? (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-3xl space-y-3.5">
              <div className="flex items-center gap-2 text-amber-900">
                <Shield className="w-4 h-4 text-amber-600" />
                <h4 className="font-black text-xs">แก้ไขช่องทางรับชำระเงิน (แอดมิน)</h4>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    เบอร์พร้อมเพย์ / เลขบัตรประชาชน (10 หรือ 13 หลัก):
                  </label>
                  <input
                    type="text"
                    value={editPromptPay}
                    onChange={e => setEditPromptPay(e.target.value)}
                    placeholder="0812345678"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ชื่อบัญชีผู้รับเงิน:
                  </label>
                  <input
                    type="text"
                    value={editAccountName}
                    onChange={e => setEditAccountName(e.target.value)}
                    placeholder="นาย สมชาย ผู้จัดเตะบอล"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ธนาคาร:
                    </label>
                    <input
                      type="text"
                      value={editBankName}
                      onChange={e => setEditBankName(e.target.value)}
                      placeholder="กสิกรไทย (KBank)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      เลขที่บัญชี:
                    </label>
                    <input
                      type="text"
                      value={editAccountNum}
                      onChange={e => setEditAccountNum(e.target.value)}
                      placeholder="123-4-56789-0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingAdmin(false)}
                  className="flex-1 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdminPaymentInfo}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Select Player & Amount Selection Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3.5 space-y-3">
                {/* Player Picker */}
                <div>
                  <label className="block text-[11px] text-slate-500 font-bold mb-1.5">
                    เลือกนักเตะผู้ชำระเงิน:
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs">
                    {currentPlayer && (
                      <PlayerAvatar
                        nickname={currentPlayer.nickname}
                        avatarUrl={currentPlayer.avatarUrl}
                        size="sm"
                      />
                    )}
                    <select
                      value={selectedPlayerId}
                      onChange={e => setSelectedPlayerId(e.target.value)}
                      className="w-full bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
                    >
                      {players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nickname} {p.name ? `(${p.name})` : ''} {p.preferredTeamId ? `• ทีม ${p.preferredTeamId}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount Customizer & Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-slate-500 font-bold">
                      ระบุยอดชำระเงิน:
                    </label>
                    <div className="flex items-center gap-1 font-mono font-black text-emerald-800 text-base">
                      <input
                        type="number"
                        min="1"
                        value={customAmount}
                        onChange={e => setCustomAmount(Number(e.target.value) || 0)}
                        className="w-20 bg-white border border-slate-300 rounded-xl px-2 py-0.5 text-center text-emerald-700 text-base font-black font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-600 font-sans font-medium">บาท</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {presetAmounts.map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCustomAmount(amt)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          customAmount === amt
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {amt}฿
                      </button>
                    ))}
                  </div>
                </div>

                {isPlayerAlreadyPaid && (
                  <div className="p-2.5 rounded-2xl bg-emerald-100/90 text-emerald-950 font-bold text-xs flex items-center justify-between gap-2 border border-emerald-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        ชำระแล้ว {playerPayment?.amountPaid}฿ ({playerPayment?.paidAt || 'บันทึกแล้ว'})
                      </span>
                    </div>
                    {onUnmarkPayment && (
                      <button
                        type="button"
                        onClick={handleCancelPayment}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline shrink-0 cursor-pointer"
                      >
                        ยกเลิกยอด
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* PAYMENT METHOD SELECTION TABS */}
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('promptpay')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'promptpay'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>พร้อมเพย์ QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>โอนบัญชี</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                  <span>เงินสด</span>
                </button>
              </div>

              {/* TAB 1: PROMPTPAY QR */}
              {paymentMethod === 'promptpay' && (
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 text-slate-900 relative">
                  {/* Authentic Thai QR PromptPay Header */}
                  <div className="bg-[#003B71] text-white px-4 py-3 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-xs">
                          <div className="w-full h-full bg-[#003B71] rounded-md flex items-center justify-center">
                            <QrCode className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <span className="font-black text-sm tracking-wider text-white">
                          Thai QR Payment
                        </span>
                      </div>
                      <span className="text-[10px] text-sky-200 font-medium tracking-wide mt-0.5">
                        สแกนจ่ายผ่านพร้อมเพย์ (PromptPay)
                      </span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-4 sm:p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-50/60 to-white">
                    <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-slate-100 relative group">
                      <QRCodeSVG
                        id="promptpay-qr-svg"
                        value={promptPayPayload}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Account Name & PromptPay Info */}
                    <div className="mt-3.5 space-y-0.5 max-w-xs">
                      <h4 className="font-black text-sm text-slate-900 leading-snug">
                        {paymentInfo.accountName || 'ผู้รับเงิน'}
                      </h4>
                      <p className="font-mono text-xs text-slate-600 font-bold">
                        พร้อมเพย์: {formatPromptPayDisplay(paymentInfo.promptPayId)}
                      </p>
                    </div>

                    {/* Highlighted Amount Badge */}
                    <div className="mt-3 px-4 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-1.5 shadow-2xs">
                      <span className="text-[11px] font-medium text-emerald-700">ยอดชำระ:</span>
                      <span className="font-black text-base font-mono text-emerald-800">
                        {customAmount.toLocaleString('th-TH')}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700">บาท</span>
                    </div>

                    {/* Actions Bar under QR Card */}
                    <div className="flex items-center gap-2 mt-4 w-full">
                      <button
                        type="button"
                        onClick={handleDownloadQR}
                        disabled={isDownloading}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        title="บันทึกรูป QR สำหรับสแกนในแอปธนาคาร"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{isDownloading ? 'กำลังบันทึก...' : 'บันทึกรูป QR'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPromptPay}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        title="คัดลอกเบอร์พร้อมเพย์"
                      >
                        {copiedPromptPay ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>คัดลอกแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-emerald-700" />
                            <span>คัดลอกเบอร์</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BANK TRANSFER */}
              {paymentMethod === 'transfer' && (
                <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-md space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-2xl border border-sky-200">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-sky-800 font-bold block">
                        {paymentInfo.bankName || 'ธนาคาร'}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-base block tracking-wider">
                        {paymentInfo.accountNumber}
                      </span>
                      <span className="text-[11px] text-slate-600 font-medium block truncate">
                        ชื่อบัญชี: {paymentInfo.accountName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedBank ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedBank ? 'คัดลอกเลขบัญชีแล้ว' : 'คัดลอกเลขที่บัญชี'}</span>
                  </button>
                </div>
              )}

              {/* TAB 3: CASH PAYMENT */}
              {paymentMethod === 'cash' && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 space-y-2 text-amber-950">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                    <Banknote className="w-4 h-4 text-amber-700" />
                    <span>ชำระด้วยเงินสด</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    คุณสามารถชำระเงินสดจำนวน <strong>{customAmount} บาท</strong> ได้โดยตรงกับผู้จัด ณ สนามฟุตบอล เมื่อผู้จัดได้รับเงินจะทำการยืนยันยอดให้ทันที
                  </p>
                </div>
              )}

              {/* Payment Slip Upload Attachment Section (For PromptPay & Transfer) */}
              {paymentMethod !== 'cash' && (
                <div
                  className={`p-3.5 rounded-3xl space-y-2.5 transition-all ${
                    isDragging
                      ? 'bg-emerald-100 border-2 border-dashed border-emerald-500'
                      : 'bg-emerald-50/60 border border-emerald-200'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>แนบรูปสลิปการโอนเงิน (หรือวางรูป / ลากไฟล์มาวาง)</span>
                    </label>
                    {slipImage && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        แนบสลิปแล้ว
                      </span>
                    )}
                  </div>

                  {slipImage ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-900 group shadow-sm">
                      <img
                        src={slipImage}
                        alt="สลิปการโอนเงิน"
                        className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowSlipViewer(true)}
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                        <button
                          type="button"
                          onClick={() => setShowSlipViewer(true)}
                          className="pointer-events-auto p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูรูปเต็ม</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveSlip}
                          className="pointer-events-auto p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบออก</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center bg-white hover:bg-emerald-50/50 cursor-pointer transition-all text-center">
                      <Upload className="w-5 h-5 text-emerald-600 mb-1 animate-bounce" />
                      <span className="text-xs font-bold text-slate-800">คลิกเลือกรูป หรือ ลากไฟล์สลิปมาวางที่นี่</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">รองรับ JPG, PNG หรือกด Ctrl+V วางรูปได้เลย</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Warning/Error Message if any */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 text-rose-800 font-bold text-xs rounded-2xl text-center border border-rose-200 animate-fadeIn">
                  {errorMessage}
                </div>
              )}

              {/* Success Notification message */}
              {isPaidSuccess && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-2xl text-center border border-emerald-300 animate-fadeIn">
                  🎉 บันทึกการชำระเงินเรียบร้อยแล้ว!
                </div>
              )}

              {/* Confirm Payment Action Button & Close Button */}
              <div className="space-y-2 pt-1">
                {onConfirmPayment && (
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5 text-white/90" />
                    <span>
                      {isPlayerAlreadyPaid
                        ? `อัปเดตข้อมูลชำระเงิน (${customAmount} บาท)`
                        : slipImage
                        ? `ยืนยันชำระเงิน (${customAmount} บาท) พร้อมสลิป`
                        : `ยืนยันว่าชำระเงินแล้ว (${customAmount} บาท)`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer text-center"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Slip Image Fullscreen Lightbox Modal */}
      {showSlipViewer && slipImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowSlipViewer(false)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl p-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 text-white border-b border-slate-800">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>สลิปการชำระเงิน - {currentPlayer?.nickname || 'นักเตะ'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSlipViewer(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={slipImage} alt="สลิปการโอนเงินแบบเต็ม" className="max-w-full h-auto rounded-2xl shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
