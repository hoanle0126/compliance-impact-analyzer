import {
  OrganizationProfile,
  RegulatoryChangePayload,
  ApplicabilityRuleDefinition,
  ApplicabilityEvaluationResult,
  ApplicabilityStatus,
  ApplicabilityConfidence,
  RegulatoryTopic,
  MatchedRuleExplanation,
  FactSource,
} from '@impactlens/shared';
import { getFieldValue, evaluateCondition } from './evaluator';
import { DEFAULT_APPLICABILITY_RULES } from './rules/default-rules';

export class ApplicabilityEngine {
  private rules: ApplicabilityRuleDefinition[];

  constructor(customRules?: ApplicabilityRuleDefinition[]) {
    this.rules = customRules && customRules.length > 0 ? customRules : DEFAULT_APPLICABILITY_RULES;
  }

  public evaluate(
    profile: OrganizationProfile,
    change: RegulatoryChangePayload,
    evidenceIds: string[] = []
  ): ApplicabilityEvaluationResult {
    const missingInfo: string[] = [];
    const reasoningFactors: string[] = [];
    const matchedRules: MatchedRuleExplanation[] = [];
    const profileFactsUsed: Array<{ factType: string; value: any; source: FactSource }> = [];

    // Step 1: Detect topics from the regulatory change
    const topics = new Set<RegulatoryTopic>();
    if (change.topics) {
      change.topics.forEach((t) => topics.add(t));
    }
    change.changes.forEach((item) => {
      if (item.topics) {
        item.topics.forEach((t) => topics.add(t));
      }
    });

    // Step 2: Check for critical missing profile information (Incomplete profile scenario)
    const isTradeRegulation =
      topics.has(RegulatoryTopic.CUSTOMS_PROCEDURE) ||
      topics.has(RegulatoryTopic.DOCUMENT_REQUIREMENT) ||
      topics.has(RegulatoryTopic.RECORD_RETENTION) ||
      topics.has(RegulatoryTopic.DECLARATION) ||
      topics.has(RegulatoryTopic.IMPORT_LICENSE);

    const hasKnownActivities = profile.businessActivities && profile.businessActivities.length > 0;
    const hasKnownCustomsProfile =
      profile.customsProfile &&
      profile.customsProfile.isImporter !== null &&
      profile.customsProfile.isImporter !== undefined;

    if (isTradeRegulation && !hasKnownActivities && !hasKnownCustomsProfile) {
      missingInfo.push('Whether the organization performs import activities or international trade.');
      missingInfo.push('Customs profile status (importer/exporter registration).');

      return {
        status: ApplicabilityStatus.INSUFFICIENT_INFORMATION,
        confidence: ApplicabilityConfidence.LOW,
        reasoningFactors: [
          'The regulatory change targets international trade and customs requirements.',
          'The organization profile does not specify business activities or customs importer/exporter status.',
          'Cannot make an automated compliance determination without verified activity facts.',
        ],
        matchedRules: [],
        profileFactsUsed: [],
        legalEvidenceUsed: evidenceIds,
        missingInformation: missingInfo,
      };
    }

    // Step 3: Check for explicit exclusions / negative match (e.g. Consulting company)
    const isPureConsulting =
      profile.businessActivities?.includes('CONSULTING' as any) &&
      !profile.businessActivities?.includes('IMPORT' as any) &&
      !profile.businessActivities?.includes('EXPORT' as any) &&
      !profile.businessActivities?.includes('CUSTOMS_DECLARATION' as any) &&
      profile.customsProfile?.isImporter !== true;

    if (isPureConsulting && isTradeRegulation) {
      reasoningFactors.push('Organization activities are limited to domestic CONSULTING.');
      reasoningFactors.push('Organization does not engage in IMPORT, EXPORT, or CUSTOMS_DECLARATION activities.');
      reasoningFactors.push('Regulatory requirements for customs declarations and trade documentation do not apply.');

      if (profile.facts) {
        profile.facts.forEach((f) => {
          if (f.factType === 'BUSINESS_ACTIVITY' || f.factType === 'CUSTOMS_STATUS') {
            profileFactsUsed.push({ factType: f.factType, value: f.value, source: f.source });
          }
        });
      }

      return {
        status: ApplicabilityStatus.DOES_NOT_APPLY,
        confidence: ApplicabilityConfidence.HIGH,
        reasoningFactors,
        matchedRules: [
          {
            ruleId: 'RULE_NON_IMPORT_EXCLUSION',
            ruleName: 'Consulting / Non-Trade Service Exclusion',
            explanation: 'Organization only conducts CONSULTING with no customs or import activities.',
            targetStatus: ApplicabilityStatus.DOES_NOT_APPLY,
            matchedConditions: [
              {
                field: 'businessActivities',
                operator: 'CONTAINS' as any,
                expected: 'CONSULTING',
                actual: profile.businessActivities,
                matched: true,
              },
            ],
          },
        ],
        profileFactsUsed,
        legalEvidenceUsed: evidenceIds,
        missingInformation: [],
      };
    }

    // Step 4: Evaluate active rules against profile and topics
    const sortedRules = [...this.rules].filter((r) => r.enabled).sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      // Check if rule's topic matches one of the change topics (if topic specified)
      if (rule.topic && !topics.has(rule.topic)) {
        continue;
      }

      let allConditionsMatched = true;
      const conditionMatches: Array<{
        field: string;
        operator: any;
        expected: any;
        actual: any;
        matched: boolean;
      }> = [];

      for (const cond of rule.conditions) {
        const actualValue = getFieldValue(profile, cond.field);
        const evalRes = evaluateCondition(actualValue, cond.operator, cond.value);

        conditionMatches.push({
          field: cond.field,
          operator: cond.operator,
          expected: cond.value,
          actual: actualValue,
          matched: evalRes.matched,
        });

        if (!evalRes.matched) {
          allConditionsMatched = false;
          break;
        }
      }

      if (allConditionsMatched) {
        matchedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          explanation: rule.explanationTemplate,
          targetStatus: rule.targetStatus,
          matchedConditions: conditionMatches,
        });

        reasoningFactors.push(`Matched rule '${rule.name}': ${rule.explanationTemplate}`);
      }
    }

    // Step 5: Gather profile facts used in evaluation
    if (profile.businessActivities?.includes('IMPORT' as any)) {
      profileFactsUsed.push({
        factType: 'BUSINESS_ACTIVITY_IMPORT',
        value: true,
        source: FactSource.USER_PROVIDED,
      });
      reasoningFactors.push('Company profile actively engages in IMPORT activities.');
    }
    if (profile.customsProfile?.isImporter) {
      profileFactsUsed.push({
        factType: 'CUSTOMS_PROFILE_IMPORTER',
        value: true,
        source: FactSource.USER_PROVIDED,
      });
    }
    if (profile.organizationType) {
      profileFactsUsed.push({
        factType: 'ORGANIZATION_TYPE',
        value: profile.organizationType,
        source: FactSource.USER_PROVIDED,
      });
    }

    // Also collect any explicit facts from profile.facts
    if (profile.facts) {
      profile.facts.forEach((f) => {
        profileFactsUsed.push({
          factType: f.factType,
          value: f.value,
          source: f.source,
        });
      });
    }

    // Step 6: Determine overall status based on matched rules
    let finalStatus: ApplicabilityStatus = ApplicabilityStatus.DOES_NOT_APPLY;
    let confidence = ApplicabilityConfidence.MEDIUM;

    if (matchedRules.some((r) => r.targetStatus === ApplicabilityStatus.APPLIES)) {
      finalStatus = ApplicabilityStatus.APPLIES;
      confidence = ApplicabilityConfidence.HIGH;
    } else if (matchedRules.some((r) => r.targetStatus === ApplicabilityStatus.POTENTIALLY_APPLIES)) {
      finalStatus = ApplicabilityStatus.POTENTIALLY_APPLIES;
      confidence = ApplicabilityConfidence.HIGH;
    } else if (matchedRules.some((r) => r.targetStatus === ApplicabilityStatus.DOES_NOT_APPLY)) {
      finalStatus = ApplicabilityStatus.DOES_NOT_APPLY;
      confidence = ApplicabilityConfidence.HIGH;
    } else {
      finalStatus = ApplicabilityStatus.REQUIRES_REVIEW;
      confidence = ApplicabilityConfidence.LOW;
      reasoningFactors.push('No direct deterministic rules matched; manual compliance review required.');
    }

    return {
      status: finalStatus,
      confidence,
      reasoningFactors,
      matchedRules,
      profileFactsUsed,
      legalEvidenceUsed: evidenceIds,
      missingInformation: missingInfo,
    };
  }
}
