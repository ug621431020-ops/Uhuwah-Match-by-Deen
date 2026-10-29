export interface TimeCalculationResult {
  totalSessionMinutes: number;
  matchCount: number;
  durationPerMatchMins: number;
  totalPlayMinutes: number;
  totalRestMinutes: number;
  avgRestPerMatch: number;
  playRatioPercent: number;
  recommendationText: string;
  statusColor: 'green' | 'blue' | 'amber' | 'rose';
}

/**
 * Parse timeRange string (e.g., "20:00 - 22:00 น." or "18:00 - 20:00") into total session minutes.
 * Defaults to 120 minutes (2 hours) if parsing fails.
 */
export function parseSessionDurationMinutes(timeRangeStr?: string): number {
  if (!timeRangeStr) return 120;

  // Check for "X ชั่วโมง" or "X ชม."
  const hoursMatch = timeRangeStr.match(/(\d+(?:\.\d+)?)\s*(?:ชั่วโมง|ชม)/i);
  if (hoursMatch && hoursMatch[1]) {
    const hrs = parseFloat(hoursMatch[1]);
    if (!isNaN(hrs) && hrs > 0) {
      return Math.round(hrs * 60);
    }
  }

  // Check for time range "HH:MM - HH:MM" or "HH.MM - HH.MM"
  const rangeMatch = timeRangeStr.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (rangeMatch) {
    const startHour = parseInt(rangeMatch[1], 10);
    const startMin = parseInt(rangeMatch[2], 10);
    const endHour = parseInt(rangeMatch[3], 10);
    const endMin = parseInt(rangeMatch[4], 10);

    let startTotal = startHour * 60 + startMin;
    let endTotal = endHour * 60 + endMin;

    if (endTotal < startTotal) {
      // Midnight crossover (e.g. 23:00 to 01:00)
      endTotal += 24 * 60;
    }

    const diff = endTotal - startTotal;
    if (diff > 0 && diff <= 360) {
      return diff;
    }
  }

  return 120; // Default 2 hours
}

/**
 * Parse start time in minutes from midnight from timeRange string (e.g., "20:00 - 22:00 น.").
 * Defaults to 1200 minutes (20:00 / 8 PM) if not specified.
 */
export function parseStartTimeMinutes(timeRangeStr?: string): number {
  if (!timeRangeStr) return 20 * 60; // 20:00 default

  const rangeMatch = timeRangeStr.match(/(\d{1,2})[:.](\d{2})/);
  if (rangeMatch) {
    const h = parseInt(rangeMatch[1], 10);
    const m = parseInt(rangeMatch[2], 10);
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      return h * 60 + m;
    }
  }

  return 20 * 60;
}

/**
 * Format minutes from midnight to "HH:MM" format.
 */
export function formatMinutesToTime(minsFromMidnight: number): string {
  const normalized = (minsFromMidnight + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = Math.floor(normalized % 60);
  const hStr = h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  return `${hStr}:${mStr}`;
}

/**
 * Calculate the specific start & end time for a given match index in a session.
 */
export function getMatchTimeSlot(
  sessionTimeRange: string | undefined,
  matchIndex: number,
  totalMatches: number,
  durationPerMatchMins: number
): { startTime: string; endTime: string; timeRangeStr: string } {
  const startSessionMins = parseStartTimeMinutes(sessionTimeRange);
  const totalSessionMins = parseSessionDurationMinutes(sessionTimeRange);

  const safeMatches = Math.max(1, totalMatches);
  const safeDuration = Math.max(1, durationPerMatchMins);
  const totalPlayMins = safeMatches * safeDuration;
  const remainingRest = Math.max(0, totalSessionMins - totalPlayMins);

  // Calculate rest interval between consecutive matches
  let restInterval = 3; // Default 3 minutes break between matches
  if (safeMatches > 1) {
    const proportionalRest = Math.floor(remainingRest / (safeMatches - 1));
    if (proportionalRest >= 1 && proportionalRest <= 15) {
      restInterval = proportionalRest;
    } else if (proportionalRest > 15) {
      restInterval = 5; // Standard 5 mins break if rest time is large
    }
  }

  const matchStartMins = startSessionMins + matchIndex * (safeDuration + restInterval);
  const matchEndMins = matchStartMins + safeDuration;

  const startTime = formatMinutesToTime(matchStartMins);
  const endTime = formatMinutesToTime(matchEndMins);

  return {
    startTime,
    endTime,
    timeRangeStr: `${startTime} - ${endTime}`,
  };
}

/**
 * Calculate complete match timing analysis based on session time, match count, and match duration.
 */
export function calculateSessionTimingInfo(
  totalSessionMins: number,
  matchCount: number,
  durationPerMatchMins: number
): TimeCalculationResult {
  const safeSessionMins = totalSessionMins > 0 ? totalSessionMins : 120;
  const safeMatchCount = matchCount > 0 ? matchCount : 1;
  const safeDuration = durationPerMatchMins > 0 ? durationPerMatchMins : 7;

  const totalPlayMinutes = safeMatchCount * safeDuration;
  const totalRestMinutes = Math.max(0, safeSessionMins - totalPlayMinutes);
  const avgRestPerMatch =
    safeMatchCount > 1
      ? Math.floor(totalRestMinutes / (safeMatchCount - 1))
      : totalRestMinutes;

  const playRatioPercent = Math.min(
    100,
    Math.round((totalPlayMinutes / safeSessionMins) * 100)
  );

  let recommendationText = '';
  let statusColor: 'green' | 'blue' | 'amber' | 'rose' = 'green';

  if (totalPlayMinutes > safeSessionMins) {
    statusColor = 'rose';
    recommendationText = `⚠️ เวลาเตะรวม (${totalPlayMinutes} นาที) เกินเวลาสนาม (${safeSessionMins} นาที) แนะนำลดเวลาเตะเหลือ ${Math.floor(
      safeSessionMins / safeMatchCount
    )} นาที/แมตช์`;
  } else if (playRatioPercent >= 60 && playRatioPercent <= 85) {
    statusColor = 'green';
    recommendationText = `✅ ตารางแข่งลงตัวดีมาก! เตะรวม ${totalPlayMinutes} นาที (${playRatioPercent}% ของเวลาสนาม) มีเวลาพักสลับทีมเฉลี่ย ${avgRestPerMatch} นาที/นัด`;
  } else if (playRatioPercent > 85) {
    statusColor = 'amber';
    recommendationText = `⚡ เวลาเตะแน่นแน่น (${playRatioPercent}%) พักสลับทีมเฉลี่ย ${avgRestPerMatch} นาที/นัด ระวังนักเตะเหนื่อยล้าเกินไป`;
  } else {
    statusColor = 'blue';
    recommendationText = `💡 เวลาสนามยังเหลือ (${totalRestMinutes} นาที) สามารถเพิ่มจำนวนรอบเตะ หรือปรับเป็น ${Math.min(
      12,
      Math.floor((safeSessionMins * 0.75) / safeMatchCount)
    )} นาที/แมตช์ได้`;
  }

  return {
    totalSessionMinutes: safeSessionMins,
    matchCount: safeMatchCount,
    durationPerMatchMins: safeDuration,
    totalPlayMinutes,
    totalRestMinutes,
    avgRestPerMatch,
    playRatioPercent,
    recommendationText,
    statusColor,
  };
}
