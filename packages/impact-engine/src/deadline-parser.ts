export interface ParsedDeadlineResult {
  hasDeadline: boolean;
  deadlineType: 'EXPLICIT_DATE' | 'RELATIVE_DAYS' | 'RETENTION_PERIOD' | 'AMBIGUOUS' | 'NONE';
  rawText: string | null;
  parsedDate: string | null;
  retentionYears?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  requiresHumanReview: boolean;
  evidenceId?: string;
  notes?: string;
}

export function parseDeadlineFromText(
  text: string,
  baseEffectiveDateStr?: string | null,
  evidenceId?: string
): ParsedDeadlineResult {
  if (!text || text.trim() === '') {
    return {
      hasDeadline: false,
      deadlineType: 'NONE',
      rawText: null,
      parsedDate: null,
      confidence: 'HIGH',
      requiresHumanReview: false,
      evidenceId,
    };
  }

  // 1. Look for retention years pattern: "thời hạn X năm" or "lưu trong X năm"
  const retentionMatch = text.match(/(?:thời hạn|lưu trong)\s+(\d+)\s+năm/i);
  if (retentionMatch) {
    const years = parseInt(retentionMatch[1], 10);
    return {
      hasDeadline: true,
      deadlineType: 'RETENTION_PERIOD',
      rawText: retentionMatch[0],
      parsedDate: null, // Retention is a duration, not a single point in time
      retentionYears: years,
      confidence: 'HIGH',
      requiresHumanReview: false,
      evidenceId,
      notes: `Mandated record retention period of ${years} years.`,
    };
  }

  // 2. Look for Vietnamese explicit date: "ngày DD tháng MM năm YYYY"
  const vnDateMatch = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  if (vnDateMatch) {
    const day = vnDateMatch[1].padStart(2, '0');
    const month = vnDateMatch[2].padStart(2, '0');
    const year = vnDateMatch[3];
    const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;

    return {
      hasDeadline: true,
      deadlineType: 'EXPLICIT_DATE',
      rawText: vnDateMatch[0],
      parsedDate: isoDate,
      confidence: 'HIGH',
      requiresHumanReview: false,
      evidenceId,
    };
  }

  // 3. Look for standard DD/MM/YYYY or YYYY-MM-DD
  const slashDateMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slashDateMatch) {
    const day = slashDateMatch[1].padStart(2, '0');
    const month = slashDateMatch[2].padStart(2, '0');
    const year = slashDateMatch[3];
    return {
      hasDeadline: true,
      deadlineType: 'EXPLICIT_DATE',
      rawText: slashDateMatch[0],
      parsedDate: `${year}-${month}-${day}T00:00:00.000Z`,
      confidence: 'HIGH',
      requiresHumanReview: false,
      evidenceId,
    };
  }

  // 4. Look for relative days: "trong thời hạn X ngày"
  const relativeDaysMatch = text.match(/trong\s+thời\s+hạn\s+(\d+)\s+ngày/i);
  if (relativeDaysMatch) {
    const days = parseInt(relativeDaysMatch[1], 10);
    let parsedDate: string | null = null;
    let confidence: 'HIGH' | 'MEDIUM' = 'MEDIUM';

    if (baseEffectiveDateStr) {
      const baseDate = new Date(baseEffectiveDateStr);
      if (!isNaN(baseDate.getTime())) {
        baseDate.setDate(baseDate.getDate() + days);
        parsedDate = baseDate.toISOString();
        confidence = 'HIGH';
      }
    }

    return {
      hasDeadline: true,
      deadlineType: 'RELATIVE_DAYS',
      rawText: relativeDaysMatch[0],
      parsedDate,
      confidence,
      requiresHumanReview: parsedDate === null,
      evidenceId,
      notes: `${days} days from effective date.`,
    };
  }

  // 5. Look for ambiguous phrases: "kịp thời", "khi có yêu cầu", "sớm nhất"
  const ambiguousMatch = text.match(/(?:kịp thời|khi có yêu cầu|sớm nhất|trong thời gian hợp lý)/i);
  if (ambiguousMatch) {
    return {
      hasDeadline: true,
      deadlineType: 'AMBIGUOUS',
      rawText: ambiguousMatch[0],
      parsedDate: null,
      confidence: 'LOW',
      requiresHumanReview: true,
      evidenceId,
      notes: 'Ambiguous timeline expression; compliance officer must manually evaluate required timeframe.',
    };
  }

  return {
    hasDeadline: false,
    deadlineType: 'NONE',
    rawText: null,
    parsedDate: null,
    confidence: 'HIGH',
    requiresHumanReview: false,
    evidenceId,
  };
}
