import { Injectable, Logger } from '@nestjs/common';
import {
  StructuredAiOutput,
  ApplicabilityStatus,
  ApplicabilityConfidence,
  ImpactDimension,
  SeverityLevel,
  PriorityLevel,
  ObligationType,
  ActionOwner,
  ActionStatus,
} from '@impactlens/shared';
import { ILlmProvider } from './llm-provider.interface';

@Injectable()
export class MockLlmProvider implements ILlmProvider {
  public readonly name = 'MockLlmProvider';
  private readonly logger = new Logger(MockLlmProvider.name);

  async generateStructuredOutput(
    systemPrompt: string,
    userPrompt: string,
    allowedEvidenceIds: string[]
  ): Promise<StructuredAiOutput> {
    this.logger.log(`MockLlmProvider generating deterministic output for allowed evidence: [${allowedEvidenceIds.join(', ')}]`);

    // Ensure only valid allowed IDs are referenced
    const ev1 = allowedEvidenceIds.includes('EV-001') ? 'EV-001' : allowedEvidenceIds[0] || 'EV-001';
    const ev2 = allowedEvidenceIds.includes('EV-002') ? 'EV-002' : allowedEvidenceIds[0] || 'EV-001';
    const ev3 = allowedEvidenceIds.includes('EV-003') ? 'EV-003' : allowedEvidenceIds[0] || 'EV-001';

    return {
      summary:
        'The regulatory modification introduces a new mandatory supporting document (Document B) for import customs dossiers, extends the record retention requirement from 2 to 5 years, and mandates electronic document storage. These changes directly impact import declaration procedures, archive policies, and IT digital record workflows.',
      applicability: {
        status: ApplicabilityStatus.POTENTIALLY_APPLIES,
        reason:
          'Organization is registered as an FDI manufacturing enterprise actively importing raw electronic components. The revised customs circular directly governs import declaration dossiers and mandatory retention of trade documents.',
        confidence: ApplicabilityConfidence.HIGH,
      },
      impactAreas: [
        {
          area: ImpactDimension.DOCUMENTATION,
          severity: SeverityLevel.HIGH,
          description:
            'Import declaration procedures now mandate the submission of Document B in addition to Document A prior to customs clearance.',
          evidenceIds: [ev1],
        },
        {
          area: ImpactDimension.RECORD_RETENTION,
          severity: SeverityLevel.HIGH,
          description:
            'Mandatory customs file retention duration has been formally extended from 2 years to 5 years for post-clearance inspection audit trails.',
          evidenceIds: [ev2],
        },
        {
          area: ImpactDimension.IT_DATA,
          severity: SeverityLevel.MEDIUM,
          description:
            'All customs and trade documentation must be stored in standardized electronic format according to technical requirements.',
          evidenceIds: [ev3],
        },
        {
          area: ImpactDimension.CUSTOMS,
          severity: SeverityLevel.HIGH,
          description:
            'Customs brokers and internal clearance specialists must adjust the electronic declaration checklist to prevent clearance delays.',
          evidenceIds: [ev1, ev3],
        },
      ],
      obligations: [
        {
          title: 'Submit Document B with Import Customs Declarations',
          description:
            'Compile and attach Document B alongside Document A for all incoming import shipments under customs clearance.',
          obligationType: ObligationType.FILE,
          responsibleDepartment: ActionOwner.CUSTOMS,
          effectiveFrom: null,
          deadline: null,
          rawDeadlineText: 'when performing customs procedures',
          evidenceIds: [ev1],
          confidence: ApplicabilityConfidence.HIGH,
          requiresReview: false,
        },
        {
          title: 'Maintain Customs Records for 5 Years',
          description:
            'Retain all import dossiers, accompanying invoices, and clearance records for a minimum duration of 5 years.',
          obligationType: ObligationType.RETAIN_RECORDS,
          responsibleDepartment: ActionOwner.COMPLIANCE,
          effectiveFrom: null,
          deadline: null,
          rawDeadlineText: 'thời hạn 5 năm',
          evidenceIds: [ev2],
          confidence: ApplicabilityConfidence.HIGH,
          requiresReview: false,
        },
        {
          title: 'Implement Electronic Archive for Customs Documentation',
          description:
            'Digitize all paper trade documentation and store records electronically compliant with General Department of Customs standards.',
          obligationType: ObligationType.UPDATE_PROCESS,
          responsibleDepartment: ActionOwner.IT,
          effectiveFrom: null,
          deadline: null,
          rawDeadlineText: null,
          evidenceIds: [ev3],
          confidence: ApplicabilityConfidence.MEDIUM,
          requiresReview: true,
        },
      ],
      recommendedActions: [
        {
          title: 'Update Customs Clearance Checklist for Document B',
          description:
            'Audit procurement and logistics document packages to ensure Document B is acquired from overseas suppliers prior to cargo arrival.',
          priority: PriorityLevel.HIGH,
          ownerDepartment: ActionOwner.CUSTOMS,
          dueDate: null,
          basis: 'Mandated by modified Article 8, Clause 1 (EV-001).',
          evidenceIds: [ev1],
          status: ActionStatus.PLANNED,
        },
        {
          title: 'Revise Enterprise Document Retention Policy from 2 to 5 Years',
          description:
            'Update corporate record retention guidelines and notify physical and digital warehouse teams of the extended 5-year retention rule.',
          priority: PriorityLevel.HIGH,
          ownerDepartment: ActionOwner.COMPLIANCE,
          dueDate: null,
          basis: 'Mandated by modified Article 8, Clause 2 (EV-002).',
          evidenceIds: [ev2],
          status: ActionStatus.PLANNED,
        },
        {
          title: 'Validate Electronic Document Storage Architecture',
          description:
            'Coordinate with IT department to confirm electronic archiving system can securely preserve customs files with tamper-evident audit logs.',
          priority: PriorityLevel.MEDIUM,
          ownerDepartment: ActionOwner.IT,
          dueDate: null,
          basis: 'Mandated by added Article 8, Clause 3 (EV-003).',
          evidenceIds: [ev3],
          status: ActionStatus.PLANNED,
        },
      ],
      assumptions: [
        'Assumes the company imports raw materials under formal commercial customs declarations rather than informal border trade.',
        'Assumes existing IT storage systems can be configured to support electronic formats without full vendor overhaul.',
      ],
      missingInformation: [],
      requiresHumanReview: true,
    };
  }
}
