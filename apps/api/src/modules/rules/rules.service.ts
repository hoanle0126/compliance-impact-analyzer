import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { ApplicabilityRuleDefinition } from '@impactlens/shared';

@Injectable()
export class RulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.applicabilityRule.findMany({
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.applicabilityRule.findUnique({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException(`Rule with ID '${id}' not found`);
    }
    return rule;
  }

  async create(dto: CreateRuleDto) {
    return this.prisma.applicabilityRule.create({
      data: {
        id: dto.id,
        name: dto.name,
        description: dto.description,
        topic: dto.topic,
        priority: dto.priority,
        enabled: dto.enabled,
        conditionsJson: dto.conditions as any,
        targetStatus: dto.targetStatus as any,
        explanationTemplate: dto.explanationTemplate,
      },
    });
  }

  async update(id: string, dto: Partial<CreateRuleDto>) {
    await this.findOne(id);
    return this.prisma.applicabilityRule.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        topic: dto.topic,
        priority: dto.priority,
        enabled: dto.enabled,
        conditionsJson: dto.conditions ? (dto.conditions as any) : undefined,
        targetStatus: dto.targetStatus as any,
        explanationTemplate: dto.explanationTemplate,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.applicabilityRule.delete({ where: { id } });
  }

  async getEngineRules(): Promise<ApplicabilityRuleDefinition[]> {
    const rules = await this.prisma.applicabilityRule.findMany({
      where: { enabled: true },
      orderBy: { priority: 'asc' },
    });

    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      topic: r.topic as any,
      priority: r.priority,
      enabled: r.enabled,
      conditions: (r.conditionsJson as any) || [],
      targetStatus: r.targetStatus as any,
      explanationTemplate: r.explanationTemplate,
    }));
  }
}
