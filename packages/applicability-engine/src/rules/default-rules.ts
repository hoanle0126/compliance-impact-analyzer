import {
  ApplicabilityRuleDefinition,
  ApplicabilityStatus,
  RegulatoryTopic,
  RuleOperator,
} from '@impactlens/shared';

export const DEFAULT_APPLICABILITY_RULES: ApplicabilityRuleDefinition[] = [
  {
    id: 'RULE_IMPORT_DOC_REQ',
    name: 'Importer Document Requirement Rule',
    description: 'Applies when regulatory change introduces document requirements for importing entities',
    topic: RegulatoryTopic.DOCUMENT_REQUIREMENT,
    priority: 10,
    enabled: true,
    targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
    explanationTemplate: 'Matched because organization engages in IMPORT activities and regulatory change introduces DOCUMENT_REQUIREMENT',
    conditions: [
      {
        field: 'businessActivities',
        operator: RuleOperator.CONTAINS,
        value: 'IMPORT',
      },
    ],
  },
  {
    id: 'RULE_CUSTOMS_PROCEDURE_ACTIVITY',
    name: 'Customs Procedure Applicability Rule',
    description: 'Applies when customs procedures change for organizations handling import/export declarations',
    topic: RegulatoryTopic.CUSTOMS_PROCEDURE,
    priority: 20,
    enabled: true,
    targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
    explanationTemplate: 'Matched because organization operates in international trade or customs declaration',
    conditions: [
      {
        field: 'businessActivities',
        operator: RuleOperator.CONTAINS,
        value: 'IMPORT',
      },
    ],
  },
  {
    id: 'RULE_RECORD_RETENTION_IMPORT',
    name: 'Record Retention Extension for Importers',
    description: 'Mandatory record retention changes apply directly to importing businesses',
    topic: RegulatoryTopic.RECORD_RETENTION,
    priority: 15,
    enabled: true,
    targetStatus: ApplicabilityStatus.APPLIES,
    explanationTemplate: 'Matched because importing organizations are legally required to retain customs records for the mandated period',
    conditions: [
      {
        field: 'businessActivities',
        operator: RuleOperator.CONTAINS,
        value: 'IMPORT',
      },
    ],
  },
  {
    id: 'RULE_ELECTRONIC_STORAGE_IT',
    name: 'Electronic Archive & Data Requirement',
    description: 'Applies to entities storing customs documentation electronically',
    topic: RegulatoryTopic.IT_REQUIREMENT,
    priority: 30,
    enabled: true,
    targetStatus: ApplicabilityStatus.POTENTIALLY_APPLIES,
    explanationTemplate: 'Matched because entity retains trade documents subject to electronic data and archive standards',
    conditions: [
      {
        field: 'businessActivities',
        operator: RuleOperator.CONTAINS,
        value: 'IMPORT',
      },
    ],
  },
  {
    id: 'RULE_NON_IMPORT_EXCLUSION',
    name: 'Consulting / Non-Trade Service Exclusion',
    description: 'Excludes organizations with purely domestic consulting activities and no import/export operations',
    priority: 100,
    enabled: true,
    targetStatus: ApplicabilityStatus.DOES_NOT_APPLY,
    explanationTemplate: 'Matched non-trade exclusion because organization only conducts CONSULTING with no customs/trade activities',
    conditions: [
      {
        field: 'businessActivities',
        operator: RuleOperator.CONTAINS,
        value: 'CONSULTING',
      },
      {
        field: 'businessActivities',
        operator: RuleOperator.NOT_IN,
        value: ['IMPORT', 'EXPORT', 'CUSTOMS_DECLARATION'],
      },
    ],
  },
];
