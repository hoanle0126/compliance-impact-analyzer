import { describe, it, expect } from 'vitest';
import { RegulatoryChangesService } from '../../src/modules/regulatory-changes/regulatory-changes.service';
import { RegulatoryTopic } from '@impactlens/shared';

describe('Regulatory Topic Classification Unit Tests', () => {
  const service = new RegulatoryChangesService(null as any);

  it('classifies customs procedures and declarations', () => {
    const text = 'Thủ tục hải quan điện tử và nộp tờ khai hải quan nhập khẩu.';
    const topics = service.classifyTopics(text);
    expect(topics).toContain(RegulatoryTopic.CUSTOMS_PROCEDURE);
    expect(topics).toContain(RegulatoryTopic.DECLARATION);
  });

  it('classifies document requirements and record retention', () => {
    const text = 'Chứng từ hồ sơ hải quan phải được lưu trữ trong thời hạn 5 năm.';
    const topics = service.classifyTopics(text);
    expect(topics).toContain(RegulatoryTopic.DOCUMENT_REQUIREMENT);
    expect(topics).toContain(RegulatoryTopic.RECORD_RETENTION);
  });

  it('classifies IT data and technical electronic standards', () => {
    const text = 'Lưu trữ dữ liệu điện tử theo tiêu chuẩn kỹ thuật.';
    const topics = service.classifyTopics(text);
    expect(topics).toContain(RegulatoryTopic.IT_REQUIREMENT);
    expect(topics).toContain(RegulatoryTopic.DATA_REQUIREMENT);
  });

  it('returns UNKNOWN for unclassified text', () => {
    const text = 'Một đoạn văn bản thông thường không liên quan đến xuất nhập khẩu.';
    const topics = service.classifyTopics(text);
    expect(topics).toContain(RegulatoryTopic.UNKNOWN);
  });
});
