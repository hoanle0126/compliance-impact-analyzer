import {
  UserRole,
  OrganizationType,
  BusinessActivityType,
  FactSource,
  FactConfidence,
  ChangeType,
  RegulatoryTopic,
  ApplicabilityStatus,
  ApplicabilityConfidence,
  ImpactDimension,
  SeverityLevel,
  PriorityLevel,
  AnalysisWorkflowStatus,
  ObligationType,
  ActionOwner,
  ActionStatus,
  EvidenceSource,
  RuleOperator,
} from '../enums';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  globalRole: UserRole;
  memberships: Array<{
    organizationId: string;
    organizationName: string;
    role: UserRole;
  }>;
}

export interface ProfileFactItem {
  id?: string;
  factType: string;
  value: string | boolean | number;
  source: FactSource;
  confidence: FactConfidence;
  notes?: string;
}

export interface FacilityItem {
  id?: string;
  name: string;
  location: string;
  facilityType: string;
  customsArea: string;
  isBonded: boolean;
  processingActivity?: string;
}

export interface ProductProfileItem {
  id?: string;
  category: string;
  hsCode: string;
  description: string;
  originCountries: string[];
  destinationCountries: string[];
  isControlled: boolean;
  notes?: string;
}

export interface CustomsProfileItem {
  isImporter: boolean | null;
  isExporter: boolean | null;
  isCustomsBroker: boolean;
  isFdi: boolean;
  isExportProcessingEnterprise: boolean;
  isBondedWarehouseOperator: boolean;
  isManufacturingForExport: boolean;
  isProcessingEnterprise: boolean;
  notes?: string;
}

export interface OrganizationProfile {
  id: string;
  legalName: string;
  displayName: string;
  organizationType: OrganizationType;
  taxId?: string;
  country: string;
  jurisdictions: string[];
  industry: string;
  businessModel: string;
  employeeRange?: string;
  active: boolean;
  businessActivities: BusinessActivityType[];
  facilities: FacilityItem[];
  products: ProductProfileItem[];
  customsProfile: CustomsProfileItem;
  facts: ProfileFactItem[];
  profileVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeItemPayload {
  changeType: ChangeType;
  hierarchyPath: string;
  oldContent?: string;
  newContent: string;
  article?: string;
  clause?: string;
  point?: string;
  topics?: RegulatoryTopic[];
}

export interface RegulatoryChangePayload {
  id?: string;
  document: {
    id?: string;
    title: string;
    documentNumber: string;
    authority: string;
    sourceUrl?: string;
    effectiveAt: string;
    promulgatedAt?: string;
    jurisdiction?: string;
  };
  previousVersion?: {
    versionNumber: string;
    contentSummary?: string;
  };
  newVersion?: {
    versionNumber: string;
    contentSummary?: string;
  };
  changes: ChangeItemPayload[];
  topics?: RegulatoryTopic[];
}

export interface LegalEvidenceItem {
  id: string;
  documentId?: string;
  documentTitle: string;
  documentNumber: string;
  sourceUrl?: string;
  version?: string;
  article?: string;
  clause?: string;
  point?: string;
  hierarchyPath: string;
  textExcerpt: string;
  retrievalSource: EvidenceSource;
  verified: boolean;
}

export interface RuleCondition {
  field: string; // e.g. 'businessActivities', 'organizationType', 'facts.USES_IMPORTED_RAW_MATERIALS', 'jurisdictions'
  operator: RuleOperator;
  value: any;
}

export interface ApplicabilityRuleDefinition {
  id: string;
  name: string;
  description: string;
  topic?: RegulatoryTopic;
  priority: number;
  enabled: boolean;
  conditions: RuleCondition[];
  targetStatus: ApplicabilityStatus;
  explanationTemplate: string;
}

export interface MatchedRuleExplanation {
  ruleId: string;
  ruleName: string;
  matchedConditions: Array<{
    field: string;
    operator: RuleOperator;
    expected: any;
    actual: any;
    matched: boolean;
  }>;
  explanation: string;
  targetStatus: ApplicabilityStatus;
}

export interface ApplicabilityEvaluationResult {
  status: ApplicabilityStatus;
  confidence: ApplicabilityConfidence;
  reasoningFactors: string[];
  matchedRules: MatchedRuleExplanation[];
  profileFactsUsed: Array<{
    factType: string;
    value: any;
    source: FactSource;
  }>;
  legalEvidenceUsed: string[]; // IDs
  missingInformation: string[];
}

export interface ImpactAreaItem {
  area: ImpactDimension;
  severity: SeverityLevel;
  description: string;
  evidenceIds: string[];
}

export interface ComplianceObligationItem {
  id?: string;
  title: string;
  description: string;
  obligationType: ObligationType;
  responsibleDepartment: ActionOwner;
  effectiveFrom?: string | null;
  deadline?: string | null;
  rawDeadlineText?: string | null;
  evidenceIds: string[];
  confidence: ApplicabilityConfidence;
  requiresReview: boolean;
}

export interface RecommendedActionItem {
  id?: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  ownerDepartment: ActionOwner;
  dueDate?: string | null;
  basis: string;
  evidenceIds: string[];
  status: ActionStatus;
}

export interface DecisionTraceStep {
  stepNumber: number;
  stepName: string;
  detail: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface StructuredImpactAssessment {
  summary: string;
  applicability: {
    status: ApplicabilityStatus;
    reason: string;
    confidence: ApplicabilityConfidence;
  };
  impactAreas: ImpactAreaItem[];
  obligations: ComplianceObligationItem[];
  recommendedActions: RecommendedActionItem[];
  assumptions: string[];
  missingInformation: string[];
  requiresHumanReview: boolean;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  decisionTrace: DecisionTraceStep[];
}

export interface HumanReviewInput {
  status: AnalysisWorkflowStatus; // APPROVED | REJECTED | IN_REVIEW | NEEDS_REVIEW
  reviewerId: string;
  reviewerName: string;
  comments?: string;
  severityOverride?: SeverityLevel;
  editedSummary?: string;
}

export interface AuditLogItem {
  id: string;
  organizationId?: string;
  analysisId?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: Record<string, any>;
  timestamp: string;
}
