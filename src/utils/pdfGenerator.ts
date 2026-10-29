import { jsPDF } from 'jspdf';
import { FootballSession, Player } from '../types';
import { calculateTeamStats, calculatePlayerStats } from '../services/storage';

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fillColor: string,
  borderColor?: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

export const generateSessionJPG = (session: FootballSession, players: Player[]): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      const standings = calculateTeamStats(session);
      const playerStats = calculatePlayerStats(players, [session]);
      const champion = standings[0];

      const canvas = document.createElement('canvas');
      const scale = 2; // High Resolution
      canvas.width = 800 * scale;
      canvas.height = 1130 * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject('Could not get canvas context');
        return;
      }

      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 800, 1130);

      // --- 1. HEADER BENTO CARD ---
      drawRoundRect(ctx, 40, 40, 720, 120, 16, '#ffffff', '#e2e8f0');

      // Emerald Accent Bar
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(40, 40, 8, 120, [16, 0, 0, 16]) : ctx.fillRect(40, 40, 8, 120);
      ctx.fill();

      // Title & Subtitle
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Prompt", "Sarabun", sans-serif';
      ctx.fillText('รายงานสรุปผลการแข่งขัน', 64, 76);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Prompt", "Sarabun", sans-serif';
      ctx.fillText(`${session.title}   |   ${session.timeRange}`, 64, 104);
      ctx.fillText(`สนาม: ${session.location}`, 64, 130);

      // Right Badge
      drawRoundRect(ctx, 610, 60, 130, 36, 18, '#ecfdf5', '#a7f3d0');
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 13px "Prompt", "Sarabun", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('สรุปประจำสัปดาห์', 675, 82);
      ctx.textAlign = 'left';

      // --- 2. CHAMPION BANNER BENTO CARD ---
      if (champion) {
        drawRoundRect(ctx, 40, 180, 720, 80, 16, '#fffbeb', '#fde68a');

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 18px "Prompt", "Sarabun", sans-serif';
        ctx.fillText(`แชมป์ประจำสัปดาห์: ${champion.teamName}`, 64, 218);

        ctx.fillStyle = '#78350f';
        ctx.font = '13px "Prompt", "Sarabun", sans-serif';
        ctx.fillText(`ผลงาน: แข่ง ${champion.played} นัด | ชนะ ${champion.won} เสมอ ${champion.drawn} แพ้ ${champion.lost} | ได้ ${champion.goalsFor} เสีย ${champion.goalsAgainst} (ต่าง ${champion.goalDiff > 0 ? '+' : ''}${champion.goalDiff})`, 64, 242);

        drawRoundRect(ctx, 620, 195, 120, 50, 12, '#fef3c7', '#f59e0b');
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 20px "Prompt", "Sarabun", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${champion.points} แต้ม`, 680, 226);
        ctx.font = '11px "Prompt", "Sarabun", sans-serif';
        ctx.fillText('อันดับ 1', 680, 240);
        ctx.textAlign = 'left';
      }

      // --- 3. STANDINGS BENTO TABLE ---
      drawRoundRect(ctx, 40, 280, 720, 260, 16, '#ffffff', '#e2e8f0');

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Prompt", "Sarabun", sans-serif';
      ctx.fillText('ตารางคะแนนรวม (Standings)', 64, 312);

      // Table Header
      drawRoundRect(ctx, 56, 328, 688, 32, 8, '#f1f5f9');
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px "Prompt", "Sarabun", sans-serif';
      ctx.fillText('#', 72, 349);
      ctx.fillText('ทีม', 110, 349);
      ctx.fillText('แข่ง', 340, 349);
      ctx.fillText('ชนะ', 400, 349);
      ctx.fillText('เสมอ', 460, 349);
      ctx.fillText('แพ้', 520, 349);
      ctx.fillText('ประตู', 580, 349);
      ctx.fillText('แต้ม', 680, 349);

      // Table Rows
      let rowY = 380;
      standings.forEach((st, idx) => {
        const isTop = idx === 0;
        if (isTop) {
          drawRoundRect(ctx, 56, rowY - 18, 688, 36, 8, '#ecfdf5', '#a7f3d0');
        }

        ctx.fillStyle = isTop ? '#065f46' : '#1e293b';
        ctx.font = isTop ? 'bold 13px "Prompt", "Sarabun", sans-serif' : '13px "Prompt", "Sarabun", sans-serif';

        ctx.fillText(`${idx + 1}`, 72, rowY + 4);
        ctx.fillText(st.teamName, 110, rowY + 4);
        ctx.fillText(`${st.played}`, 348, rowY + 4);
        ctx.fillText(`${st.won}`, 408, rowY + 4);
        ctx.fillText(`${st.drawn}`, 468, rowY + 4);
        ctx.fillText(`${st.lost}`, 528, rowY + 4);
        ctx.fillText(`${st.goalsFor}:${st.goalsAgainst}`, 580, rowY + 4);

        // Points Pill
        drawRoundRect(ctx, 670, rowY - 12, 50, 24, 6, isTop ? '#059669' : '#e2e8f0');
        ctx.fillStyle = isTop ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${st.points}`, 695, rowY + 4);
        ctx.textAlign = 'left';

        rowY += 42;
      });

      // --- 4. FINANCE & UNPAID BENTO GRID (2 COLUMNS) ---
      // Left: Finance Summary
      drawRoundRect(ctx, 40, 560, 350, 320, 16, '#ffffff', '#e2e8f0');
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Prompt", "Sarabun", sans-serif';
      ctx.fillText('สรุปการเงิน (Finance)', 64, 592);

      const fieldCost = session.fieldCost || 0;
      const waterCost = session.waterCost || 0;
      const otherCost = session.otherCost || 0;
      const totalCost = fieldCost + waterCost + otherCost;

      const items = [
        { label: 'ค่าสนาม', value: `${fieldCost.toLocaleString()} บาท` },
        { label: 'ค่าน้ำดื่ม', value: `${waterCost.toLocaleString()} บาท` },
        { label: 'ค่าใช้จ่ายอื่น ๆ', value: `${otherCost.toLocaleString()} บาท` },
        { label: 'รวมค่าใช้จ่ายสนาม', value: `${totalCost.toLocaleString()} บาท`, isBold: true, color: '#dc2626' },
        { label: 'ค่าเตะคนละ', value: `${session.feePerPlayer || 100} บาท`, isBold: true, color: '#047857' },
        { label: 'จำนวนผู้เข้าร่วม', value: `${session.attendingPlayerIds.length || players.length} คน` },
      ];

      let finY = 625;
      items.forEach(item => {
        ctx.fillStyle = '#475569';
        ctx.font = '13px "Prompt", "Sarabun", sans-serif';
        ctx.fillText(item.label, 64, finY);

        ctx.fillStyle = item.color || '#0f172a';
        ctx.font = item.isBold ? 'bold 14px "Prompt", "Sarabun", sans-serif' : '13px "Prompt", "Sarabun", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(item.value, 370, finY);
        ctx.textAlign = 'left';

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(64, finY + 8);
        ctx.lineTo(370, finY + 8);
        ctx.stroke();

        finY += 38;
      });

      // Right: Unpaid Players & Top Scorers
      drawRoundRect(ctx, 410, 560, 350, 320, 16, '#ffffff', '#e2e8f0');

      const unpaidList = (session.payments || [])
        .filter(p => !p.isPaid)
        .map(p => players.find(x => x.id === p.playerId)?.nickname)
        .filter(Boolean);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Prompt", "Sarabun", sans-serif';
      ctx.fillText(`สถานะการชำระเงิน (${unpaidList.length} คนค้างจ่าย)`, 434, 592);

      if (unpaidList.length === 0) {
        drawRoundRect(ctx, 430, 615, 310, 50, 12, '#ecfdf5', '#a7f3d0');
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 14px "Prompt", "Sarabun", sans-serif';
        ctx.fillText('ทุกคนชำระเงินเรียบร้อยแล้ว!', 446, 645);
      } else {
        let unpY = 625;
        unpaidList.slice(0, 5).forEach((name, i) => {
          drawRoundRect(ctx, 430, unpY - 14, 310, 32, 8, '#fef2f2', '#fecaca');
          ctx.fillStyle = '#991b1b';
          ctx.font = '13px "Prompt", "Sarabun", sans-serif';
          ctx.fillText(`${i + 1}. ${name}`, 446, unpY + 6);
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 12px "Prompt", "Sarabun", sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('ยังไม่ชำระ', 724, unpY + 6);
          ctx.textAlign = 'left';
          unpY += 38;
        });

        if (unpaidList.length > 5) {
          ctx.fillStyle = '#64748b';
          ctx.font = '12px "Prompt", "Sarabun", sans-serif';
          ctx.fillText(`...และอีก ${unpaidList.length - 5} คน`, 446, unpY + 6);
        }
      }

      // Top Scorers Mini Section inside right box
      const topScorers = playerStats.slice(0, 3);
      if (topScorers.length > 0) {
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px "Prompt", "Sarabun", sans-serif';
        ctx.fillText('ดาวซัลโวประจำสัปดาห์', 434, 765);

        let scY = 790;
        topScorers.forEach((p, idx) => {
          ctx.fillStyle = idx === 0 ? '#b45309' : '#334155';
          ctx.font = '13px "Prompt", "Sarabun", sans-serif';
          ctx.fillText(`${idx + 1}. ${p.nickname}`, 434, scY);

          ctx.fillStyle = '#047857';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${p.goals} ประตู`, 730, scY);
          ctx.textAlign = 'left';

          scY += 28;
        });
      }

      // --- 5. FOOTER CARD ---
      drawRoundRect(ctx, 40, 900, 720, 60, 12, '#ffffff', '#e2e8f0');
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "Prompt", "Sarabun", sans-serif';
      ctx.fillText('รายงานสรุปผลการแข่งขันอัตโนมัติ - MATCH UKHUWAH', 60, 935);

      const nowStr = new Date().toLocaleString('th-TH');
      ctx.textAlign = 'right';
      ctx.fillText(`สร้างเมื่อ: ${nowStr}`, 740, 935);
      ctx.textAlign = 'left';

      // --- GENERATE JPG DOWNLOAD ---
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `football_summary_${session.date}.jpg`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve(true);
    } catch (err) {
      console.error('Failed to generate JPG:', err);
      reject(err);
    }
  });
};

export const generateSessionPDF = (session: FootballSession, players: Player[]): Promise<boolean> => {
  return generateSessionJPG(session, players);
};
