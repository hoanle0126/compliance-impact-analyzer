import { z } from 'zod';
import {
  ApplicabilityStatus,
  ApplicabilityConfidence,
  ImpactDimension,
  SeverityLevel,
  PriorityLevel,
  ObligationType,
  ActionOwner,
  ActionStatus,
  RuleOperator,
  RegulatoryTopic,
} from '../enums';

export const StructuredAiImpactAreaSchema = z.object({
  area: z.nativeEnum(ImpactDimension),
  severity: z.nativeEnum(SeverityLevel),
  description: z.string().min(5),
  evidenceIds: z.array(z.string()).default([]),
});

export const StructuredAiObligationSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  obligationType: z.nativeEnum(ObligationType).default(ObligationType.OTHER),
  responsibleDepartment: z.nativeEnum(ActionOwner).default(ActionOwner.COMPLIANCE),
  effectiveFrom: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  rawDeadlineText: z.string().nullable().optional(),
  evidenceIds: z.array(z.string()).default([]),
  confidence: z.nativeEnum(ApplicabilityConfidence).default(ApplicabilityConfidence.MEDIUM),
  requiresReview: z.boolean().default(true),
});

export const StructuredAiActionSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  priority: z.nativeEnum(PriorityLevel).default(PriorityLevel.MEDIUM),
  ownerDepartment: z.nativeEnum(ActionOwner).default(ActionOwner.COMPLIANCE),
  dueDate: z.string().nullable().optional(),
  basis: z.string().min(3),
  evidenceIds: z.array(z.string()).default([]),
  status: z.nativeEnum(ActionStatus).default(ActionStatus.PLANNED),
});

export const StructuredAiOutputSchema = z.object({
  summary: z.string().min(10),
  applicability: z.object({
    status: z.nativeEnum(ApplicabilityStatus),
    reason: z.string().min(5),
    confidence: z.nativeEnum(ApplicabilityConfidence),
  }),
  impactAreas: z.array(StructuredAiImpactAreaSchema),
  obligations: z.array(StructuredAiObligationSchema),
  recommendedActions: z.array(StructuredAiActionSchema),
  assumptions: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  requiresHumanReview: z.boolean().default(true),
});

export type StructuredAiOutput = z.infer<typeof StructuredAiOutputSchema>;

export const WebhookChangeItemSchema = z.object({
  changeType: z.enum(['ADDED', 'MODIFIED', 'REPEALED']),
  hierarchyPath: z.string(),
  oldContent: z.string().optional(),
  newContent: z.string(),
  article: z.string().optional(),
  clause: z.string().optional(),
  point: z.string().optional(),
  topics: z.array(z.nativeEnum(RegulatoryTopic)).optional(),
});

export const WebhookRegulatoryChangeSchema = z.object({
  document: z.object({
    id: z.string().optional(),
    title: z.string().min(3),
    documentNumber: z.string().min(1),
    authority: z.string(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    effectiveAt: z.string(),
    promulgatedAt: z.string().optional(),
    jurisdiction: z.string().optional().default('VIETNAM'),
  }),
  previousVersion: z
    .object({
      versionNumber: z.string(),
      contentSummary: z.string().optional(),
    })
    .optional(),
  newVersion: z
    .object({
      versionNumber: z.string(),
      contentSummary: z.string().optional(),
    })
    .optional(),
  changes: z.array(WebhookChangeItemSchema).min(1),
  topics: z.array(z.nativeEnum(RegulatoryTopic)).optional(),
});

export const RuleConditionSchema = z.object({
  field: z.string(),
  operator: z.nativeEnum(RuleOperator),
  value: z.any(),
});

export const ApplicabilityRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  description: z.string(),
  topic: z.nativeEnum(RegulatoryTopic).optional(),
  priority: z.number().int().default(100),
  enabled: z.boolean().default(true),
  conditions: z.array(RuleConditionSchema),
  targetStatus: z.nativeEnum(ApplicabilityStatus),
  explanationTemplate: z.string(),
});
