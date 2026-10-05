import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegulatoryChangeDto } from './dto/create-regulatory-change.dto';
import { RegulatoryChangePayload, RegulatoryTopic, EvidenceSource } from '@impactlens/shared';

@Injectable()
export class RegulatoryChangesService {
  constructor(private prisma: PrismaService) {}

  classifyTopics(text: string): RegulatoryTopic[] {
    const lower = text.toLowerCase();
    const detected = new Set<RegulatoryTopic>();

    if (lower.includes('hải quan') || lower.includes('thủ tục hải quan')) {
      detected.add(RegulatoryTopic.CUSTOMS_PROCEDURE);
    }
    if (lower.includes('tờ khai') || lower.includes('khai báo')) {
      detected.add(RegulatoryTopic.DECLARATION);
    }
    if (lower.includes('tài liệu') || lower.includes('chứng từ') || lower.includes('hồ sơ')) {
      detected.add(RegulatoryTopic.DOCUMENT_REQUIREMENT);
    }
    if (lower.includes('lưu trữ') || lower.includes('thời hạn lưu') || lower.includes('lưu trong')) {
      detected.add(RegulatoryTopic.RECORD_RETENTION);
    }
    if (lower.includes('điện tử') || lower.includes('dữ liệu') || lower.includes('tiêu chuẩn kỹ thuật')) {
      detected.add(RegulatoryTopic.IT_REQUIREMENT);
      detected.add(RegulatoryTopic.DATA_REQUIREMENT);
    }
    if (lower.includes('thuế') || lower.includes('thuế suất')) {
      detected.add(RegulatoryTopic.TAX);
      detected.add(RegulatoryTopic.DUTY);
    }
    if (lower.includes('giấy phép') || lower.includes('cấp phép')) {
      detected.add(RegulatoryTopic.IMPORT_LICENSE);
    }

    if (detected.size === 0) {
      detected.add(RegulatoryTopic.UNKNOWN);
    }

    return Array.from(detected);
  }

  async findAll() {
    return this.prisma.regulatoryChange.findMany({
      include: {
        changes: true,
        evidences: true,
        _count: { select: { analyses: true } },
      },
      orderBy: { effectiveAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const reg = await this.prisma.regulatoryChange.findUnique({
      where: { id },
      include: {
        changes: true,
        evidences: true,
        analyses: {
          include: {
            organization: { select: { id: true, legalName: true, displayName: true } },
          },
        },
      },
    });

    if (!reg) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'REGULATORY_CHANGE_NOT_FOUND',
        message: `Regulatory change with ID '${id}' not found.`,
      });
    }

    return reg;
  }

  async create(dto: CreateRegulatoryChangeDto) {
    const docTopics = new Set<string>(dto.topics || []);
    const classifiedFromTitle = this.classifyTopics(dto.title);
    classifiedFromTitle.forEach((t) => docTopics.add(t));

    // Analyze topics per change item
    const changeItemsWithTopics = dto.changes.map((item) => {
      const itemTopics = new Set<string>(item.topics || []);
      const autoClassified = this.classifyTopics(item.newContent + ' ' + (item.oldContent || ''));
      autoClassified.forEach((t) => {
        itemTopics.add(t);
        docTopics.add(t);
      });
      return {
        ...item,
        topics: Array.from(itemTopics),
      };
    });

    return this.prisma.$transaction(async (tx) => {
      const reg = await tx.regulatoryChange.create({
        data: {
          title: dto.title,
          documentNumber: dto.documentNumber,
          authority: dto.authority,
          sourceUrl: dto.sourceUrl,
          effectiveAt: new Date(dto.effectiveAt),
          promulgatedAt: dto.promulgatedAt ? new Date(dto.promulgatedAt) : null,
          jurisdiction: dto.jurisdiction || 'VIETNAM',
          topics: Array.from(docTopics),
          changes: {
            create: changeItemsWithTopics.map((c) => ({
              changeType: c.changeType,
              hierarchyPath: c.hierarchyPath,
              oldContent: c.oldContent,
              newContent: c.newContent,
              article: c.article,
              clause: c.clause,
              point: c.point,
              topics: c.topics,
            })),
          },
        },
        include: { changes: true },
      });

      // Automatically construct and link legal evidence items
      let evIdx = 1;
      for (const chg of reg.changes) {
        const docPrefix = reg.documentNumber.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 12);
        const evidenceId = `EV_${docPrefix}_${String(evIdx).padStart(3, '0')}`;
        evIdx++;

        await tx.legalEvidence.create({
          data: {
            id: evidenceId,
            changeId: reg.id,
            documentNumber: reg.documentNumber,
            documentTitle: reg.title,
            sourceUrl: reg.sourceUrl,
            hierarchyPath: chg.hierarchyPath,
            article: chg.article,
            clause: chg.clause,
            point: chg.point,
            textExcerpt: chg.newContent,
            retrievalSource: EvidenceSource.REGULATORY_CHANGE,
            verified: true,
          },
        });
      }

      return tx.regulatoryChange.findUnique({
        where: { id: reg.id },
        include: { changes: true, evidences: true },
      });
    });
  }

  toPayload(reg: any): RegulatoryChangePayload {
    return {
      id: reg.id,
      document: {
        id: reg.id,
        title: reg.title,
        documentNumber: reg.documentNumber,
        authority: reg.authority,
        sourceUrl: reg.sourceUrl || undefined,
        effectiveAt: reg.effectiveAt.toISOString(),
        promulgatedAt: reg.promulgatedAt?.toISOString(),
        jurisdiction: reg.jurisdiction,
      },
      changes: reg.changes.map((c: any) => ({
        changeType: c.changeType,
        hierarchyPath: c.hierarchyPath,
        oldContent: c.oldContent || undefined,
        newContent: c.newContent,
        article: c.article || undefined,
        clause: c.clause || undefined,
        point: c.point || undefined,
        topics: c.topics as any,
      })),
      topics: reg.topics as any,
    };
  }
}
