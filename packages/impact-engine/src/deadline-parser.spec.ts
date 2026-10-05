import { describe, it, expect } from 'vitest';
import { parseDeadlineFromText } from './deadline-parser';

describe('Deadline Parser Test Suite', () => {
  it('parses mandated retention periods correctly without hallucinating calendar dates', () => {
    const text = 'Hồ sơ được lưu trong thời hạn 5 năm.';
    const result = parseDeadlineFromText(text, null, 'EV-001');

    expect(result.hasDeadline).toBe(true);
    expect(result.deadlineType).toBe('RETENTION_PERIOD');
    expect(result.retentionYears).toBe(5);
    expect(result.parsedDate).toBeNull();
    expect(result.requiresHumanReview).toBe(false);
  });

  it('parses explicit Vietnamese dates accurately', () => {
    const text = 'Quy định có hiệu lực thi hành kể từ ngày 15 tháng 11 năm 2026.';
    const result = parseDeadlineFromText(text, null, 'EV-002');

    expect(result.hasDeadline).toBe(true);
    expect(result.deadlineType).toBe('EXPLICIT_DATE');
    expect(result.parsedDate).toBe('2026-11-15T00:00:00.000Z');
  });

  it('flags ambiguous phrases for human review without inventing false deadlines', () => {
    const text = 'Doanh nghiệp nộp báo cáo giải trình khi có yêu cầu từ cơ quan hải quan.';
    const result = parseDeadlineFromText(text, null, 'EV-003');

    expect(result.hasDeadline).toBe(true);
    expect(result.deadlineType).toBe('AMBIGUOUS');
    expect(result.parsedDate).toBeNull();
    expect(result.requiresHumanReview).toBe(true);
    expect(result.confidence).toBe('LOW');
  });

  it('returns false for generic text without deadlines', () => {
    const text = 'Hàng hóa thuộc đối tượng kiểm tra chuyên ngành.';
    const result = parseDeadlineFromText(text);

    expect(result.hasDeadline).toBe(false);
    expect(result.parsedDate).toBeNull();
  });
});
